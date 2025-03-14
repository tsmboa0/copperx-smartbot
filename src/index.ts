import "dotenv/config";
import { Bot } from "grammy";
import { authHandler } from "./handlers/auth.handler";
import { walletHandler } from "./handlers/wallet.handler";
import { AppDataSource } from "./config/database";
import { transferHandler } from "./handlers/transfer.handler";
import {
  createMainMenuKeyboard,
  createSendMoneyKeyboard,
  createBackToMenuKeyboard,
} from "./utils/keyboards";
import { authService } from "./services/auth.service";
import axios from "axios";
import { InlineKeyboard } from "grammy";

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not defined in the environment variables");
}

AppDataSource.initialize()
  .then(() => {
    console.log("Database connection initialized");
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
    process.exit(1);
  });

const bot = new Bot(process.env.BOT_TOKEN);

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
  const chatId = ctx.from?.id;
  if (!chatId) return;

  const isLoggedIn = await authService.isAuthenticated(chatId);
  await ctx.reply(
    "🚀 Welcome to CopperX Bot!\n\n" +
      "I'm here to help you manage your CopperX account. Choose an option below:",
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

bot.on("message:text", async (ctx) => {
  const chatId = ctx.from?.id;
  if (!chatId) return;

  const text = ctx.message.text;

  if (text.startsWith("/")) return;

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

console.log("Starting the bot...");
bot.start();
