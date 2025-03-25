import "dotenv/config";
import { Bot } from "grammy";
import { authHandler } from "./handlers/auth.handler";
import { walletHandler } from "./handlers/wallet.handler";
import { transferHandler } from "./handlers/transfer.handler";
import mongoose from "mongoose";
import config from "./config/config";
import {
  createMainMenuKeyboard,
  createSendMoneyKeyboard,
  createBackToMenuKeyboard,
} from "./utils/keyboards";
import { authService } from "./services/auth.service";
import axios from "axios";
import { InlineKeyboard } from "grammy";
import http from "http";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { agentService } from "./services/agent.service";
import { storeContext, getContext } from "./utils/store";

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not defined in the environment variables");
}

mongoose.connect(config.dbClient.uri)
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

const bot = new Bot(process.env.BOT_TOKEN);
bot.use(rateLimitMiddleware(10, 60*1000));

bot.api.setMyCommands([
  { command: "start", description: "Start the bot and see available commands" },
  { command: "menu", description: "Show the main menu" },
  { command: "login", description: "Login to your CopperX account" },
  { command: "profile", description: "View your CopperX profile details" },
  { command: "kyc", description: "Check your KYC verification status" },
  { command: "logout", description: "Logout from your CopperX account" },
  { command: "wallets", description: "View all your connected wallets" },
  { command: "balance", description: "Check wallet balances across networks" },
  {
    command: "setdefault",
    description: "Set your default wallet for transactions",
  },
  {
    command: "deposit",
    description: "Get deposit instructions for your wallet",
  },
  { command: "transactions", description: "View your transaction history" },
  { command: "send_email", description: "Send funds to an email address" },
  { command: "send_wallet", description: "Send funds to external wallet" },
  { command: "withdraw", description: "Withdraw funds to bank account" },
  { command: "transfers", description: "View recent transfers" },
  { command: "notifications", description: "Manage deposit notifications" },
  {
    command: "simulate_deposit",
    description: "Simulate a deposit notification",
  },
]);

bot.command("start", async (ctx) => {
  console.log("inside start");
  const chatId = ctx.from?.id;
  if (!chatId) return;

  const isLoggedIn = await authService.isAuthenticated(chatId);
  await ctx.reply(
    `👋 Welcome ${ctx.from?.first_name}!\n\n` +
      "I'm CopperX SmartBot designed to help you manage your account seemlessly. Choose an option below or simply ask me a question 😉",
    {
      parse_mode: "Markdown",
      reply_markup: createMainMenuKeyboard(isLoggedIn),
    }
  );
});

bot.command("menu", async (ctx) => {
  const chatId = ctx.from?.id;
  if (!chatId) return;

  const isLoggedIn = await authService.isAuthenticated(chatId);
  await ctx.reply("📋 *CopperX Menu*\n\n" + "Choose an option below:", {
    parse_mode: "Markdown",
    reply_markup: createMainMenuKeyboard(isLoggedIn),
  });
});

bot.command("login", async (ctx) => {
  await authHandler.handleLogin(ctx);
});

bot.command("profile", async (ctx) => {
  await authHandler.handleProfile(ctx);
});

bot.command("kyc", async (ctx) => {
  await authHandler.handleKYCStatus(ctx);
});

bot.command("logout", async (ctx) => {
  await authHandler.handleLogout(ctx);
});

bot.command("wallets", async (ctx) => {
  await walletHandler.handleWallets(ctx);
});

bot.command("balance", async (ctx) => {
  await walletHandler.handleBalances(ctx);
});

bot.command("setdefault", async (ctx) => {
  await walletHandler.handleSetDefault(ctx);
});

bot.command("deposit", async (ctx) => {
  await walletHandler.handleDeposit(ctx);
});

bot.command("transactions", async (ctx) => {
  await walletHandler.handleTransactions(ctx);
});

bot.command("send_email", async (ctx) => {
  await transferHandler.handleEmailTransfer(ctx);
});

bot.command("send_wallet", async (ctx) => {
  await transferHandler.handleWalletTransfer(ctx);
});

bot.command("withdraw", async (ctx) => {
  await transferHandler.handleBankWithdrawal(ctx);
});

bot.command("transfers", async (ctx) => {
  await transferHandler.handleRecentTransfers(ctx);
});

//when messages 

bot.on("message:text", async (ctx) => {
  const chatId = ctx.from?.id;
  if (!chatId) return;

  const text = ctx.message.text;

  if (text.startsWith("/")) return;

  //pass the request to the router.
  const res = await agentService.router(ctx);
  if(res && res == "chatbot"){
    //route to chatbot
    console.log("res = ",res," calling the assitent agent now!");
    //store context to be reused later
    storeContext(ctx.from.id, ctx);
    console.log('context stored');

    const assistent_res = await agentService.callAgent(ctx);

    console.log("The assistant response is: ",assistent_res)
    return
  }

  //if the router's response is "normal", continue in the normal route.

  if (authHandler.isWaitingForOTP(chatId)) {
    await authHandler.handleOTPInput(ctx, text);
    return;
  }

  const userState = authHandler["userStates"].get(chatId);
  if (userState && !userState.waitingForOTP) {
    await authHandler.handleEmailInput(ctx, text);
    return;
  }

  if (walletHandler["userStates"].get(chatId)?.action === "set_default") {
    await walletHandler.handleSetDefaultChoice(ctx);
    return;
  }

  await transferHandler.handleTransferInput(ctx);
});

//callback query

bot.callbackQuery("main_menu", async (ctx) => {
  const chatId = ctx.from?.id;
  if (!chatId) return;

  const isLoggedIn = await authService.isAuthenticated(chatId);
  await ctx.editMessageText("Choose an option:", {
    reply_markup: createMainMenuKeyboard(isLoggedIn),
    parse_mode: "Markdown",
  });
});

bot.callbackQuery("send_money", async (ctx) => {
  await ctx.editMessageText(
    "💸 *Send Money*\n\nChoose how you'd like to send funds:",
    {
      parse_mode: "Markdown",
      reply_markup: createSendMoneyKeyboard(),
    }
  );
});

bot.callbackQuery("send_email", async (ctx) => {
  await ctx.answerCallbackQuery();
  await transferHandler.handleEmailTransfer(ctx);
});

bot.callbackQuery("profile", async (ctx) => {
  await ctx.answerCallbackQuery();
  await authHandler.handleProfile(ctx);
});

bot.callbackQuery("kyc", async (ctx) => {
  await ctx.answerCallbackQuery();
  await authHandler.handleKYCStatus(ctx);
});

bot.callbackQuery("wallets", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.callbackQuery.message) {
    await walletHandler.handleWallets(ctx);
  }
});

bot.callbackQuery("balance", async (ctx) => {
  await ctx.answerCallbackQuery();
  await walletHandler.handleBalances(ctx);
});

bot.callbackQuery("deposit", async (ctx) => {
  await ctx.answerCallbackQuery();
  await walletHandler.handleDeposit(ctx);
});

bot.callbackQuery("transfers", async (ctx) => {
  await ctx.answerCallbackQuery();
  await transferHandler.handleRecentTransfers(ctx);
});

bot.callbackQuery("send_wallet", async (ctx) => {
  await ctx.answerCallbackQuery();
  await transferHandler.handleWalletTransfer(ctx);
});

bot.callbackQuery("withdraw", async (ctx) => {
  await ctx.answerCallbackQuery();
  await transferHandler.handleBankWithdrawal(ctx);
});

bot.callbackQuery("login", async (ctx) => {
  await ctx.answerCallbackQuery();
  await authHandler.handleLogin(ctx);
});

bot.callbackQuery("logout", async (ctx) => {
  await ctx.answerCallbackQuery();
  await authHandler.handleLogout(ctx);
});

bot.callbackQuery(/^select_wallet:/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const walletId = ctx.callbackQuery.data.split(":")[1];
  await walletHandler.handleSetDefault(ctx, walletId);
});

bot.callbackQuery(/^select_bank:/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const bankAccountId = ctx.callbackQuery.data.split(":")[1];
  await transferHandler.handleBankSelection(ctx, bankAccountId);
});

bot.callbackQuery("setdefault", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.callbackQuery.message) {
    await walletHandler.handleSetDefault(ctx);
  }
});

bot.callbackQuery("confirm", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.from?.id;
  if (!chatId) return;

  const userState = transferHandler["userStates"].get(chatId);
  if (!userState || !userState.confirmationPending) return;

  try {
    switch (userState.action) {
      case "email_transfer":
        await axios.post(
          `${transferHandler["API_BASE_URL"]}/api/transfers/send`,
          {
            recipient: userState.recipient,
            amount: (Number(userState.amount) * Math.pow(10, 8)).toString(),
            symbol: userState.symbol,
          },
          { headers: await authService.getHeaders(chatId) }
        );
        break;

      case "wallet_transfer":
        await axios.post(
          `${transferHandler["API_BASE_URL"]}/api/transfers/wallet-withdraw`,
          {
            walletAddress: userState.recipient,
            amount: (Number(userState.amount) * Math.pow(10, 8)).toString(),
            purposeCode: "self",
          },
          { headers: await authService.getHeaders(chatId) }
        );
        break;

      case "bank_withdrawal":
        if (userState.quote) {
          await axios.post(
            `${transferHandler["API_BASE_URL"]}/api/transfers/offramp`,
            {
              quotePayload: userState.quote.quotePayload,
              quoteSignature: userState.quote.quoteSignature,
            },
            { headers: await authService.getHeaders(chatId) }
          );
        }
        break;
    }

    await ctx.editMessageText(
      "✅ Transfer initiated successfully!\n\n" +
        "You can track the status in your recent transfers.",
      {
        reply_markup: new InlineKeyboard()
          .text("📊 View Transfers", "transfers")
          .row()
          .text("« Back to Menu", "main_menu"),
      }
    );
    transferHandler["userStates"].delete(chatId);
  } catch (error) {
    console.error("Error processing transfer:", error);
    await ctx.editMessageText(
      "❌ Transfer failed.\n\n" +
        "Please try again or contact support if the issue persists",
      {
        reply_markup: createBackToMenuKeyboard(),
      }
    );
    transferHandler["userStates"].delete(chatId);
  }
});

bot.callbackQuery("cancel", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.from?.id;
  if (!chatId) return;

  const userState = transferHandler["userStates"].get(chatId);
  if (!userState || !userState.confirmationPending) return;

  await ctx.editMessageText("❌ Transfer cancelled.", {
    reply_markup: createBackToMenuKeyboard(),
  });
  transferHandler["userStates"].delete(chatId);
});

bot.callbackQuery(/^select_payee:/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const email = ctx.callbackQuery.data.split(":")[1];
  await transferHandler.handlePayeeSelection(ctx, email);
});

bot.callbackQuery("add_new_recipient", async (ctx) => {
  await ctx.answerCallbackQuery();
  await transferHandler.handleAddNewRecipient(ctx);
});

bot.catch((err) => {
  console.error("Bot encountered an error:", err);
});

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    const uptime = process.uptime();
    const uptimeFormatted = {
      days: Math.floor(uptime / (24 * 60 * 60)),
      hours: Math.floor((uptime % (24 * 60 * 60)) / (60 * 60)),
      minutes: Math.floor((uptime % (60 * 60)) / 60),
      seconds: Math.floor(uptime % 60),
    };

    const response = {
      status: "ok",
      message: "Bot is running",
      uptime: uptimeFormatted,
      timestamp: new Date().toISOString(),
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response, null, 2));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(3000, () => {
  console.log("Health check server running on port 3000");
  console.log("Access the health endpoint at: http://localhost:3000/health");
});

server.on("error", (error) => {
  console.error("Health check server error:", error);
});

console.log("Starting the bot...");
bot.start();
export default bot
