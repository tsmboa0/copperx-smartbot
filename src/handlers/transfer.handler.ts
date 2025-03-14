import { Context } from "grammy";
import { authService } from "../services/auth.service";
import axios from "axios";
import { InlineKeyboard } from "grammy";
import {
  createBackToMenuKeyboard,
  createConfirmationKeyboard,
} from "../utils/keyboards";
import { BankQuote } from "../utils/types/types";

export class TransferHandler {
  private static instance: TransferHandler;
  private readonly API_BASE_URL =
    process.env.COPPERX_API_BASE_URL || "https://income-api.copperx.io";
  private userStates: Map<
    number,
    {
      action?: "email_transfer" | "wallet_transfer" | "bank_withdrawal";
      recipient?: string;
      amount?: string;
      symbol?: string;
      confirmationPending?: boolean;
      bankAccountId?: string;
      quote?: BankQuote;
    }
  > = new Map();

  private constructor() {}

  public static getInstance(): TransferHandler {
    if (!TransferHandler.instance) {
      TransferHandler.instance = new TransferHandler();
    }
    return TransferHandler.instance;
  }

  public async handleEmailTransfer(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    if (!(await authService.isAuthenticated(chatId))) {
      await ctx.reply(
        "🔒 This feature requires login!\n\n" +
          "Please use /login to connect your account first",
        {
          reply_markup: new InlineKeyboard().text("🔐 Login", "login"),
        }
      );
      return;
    }

    this.userStates.set(chatId, { action: "email_transfer" });

    if (ctx.callbackQuery) {
      await ctx.editMessageText(
        "📧 *Send Funds via Email*\n\n" +
          "Please enter the recipient's email address:",
        {
          parse_mode: "Markdown",
          reply_markup: createBackToMenuKeyboard(),
        }
      );
    } else {
      await ctx.reply(
        "📧 *Send Funds via Email*\n\n" +
          "Please enter the recipient's email address:",
        {
          parse_mode: "Markdown",
          reply_markup: createBackToMenuKeyboard(),
        }
      );
    }
  }

  public async handleWalletTransfer(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    if (!(await authService.isAuthenticated(chatId))) {
      await ctx.reply(
        "🔒 This feature requires login!\n\n" +
          "Please use /login to connect your account first",
        {
          reply_markup: new InlineKeyboard().text("🔐 Login", "login"),
        }
      );
      return;
    }

    try {
      const balances = await this.fetchBalances(chatId);
      const message = `
🔄 *External Wallet Transfer*

Available balances:
${this.formatBalances(balances)}

Please enter the recipient's wallet address:`;

      this.userStates.set(chatId, { action: "wallet_transfer" });

      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          parse_mode: "Markdown",
          reply_markup: createBackToMenuKeyboard(),
        });
      } else {
        await ctx.reply(message, {
          parse_mode: "Markdown",
          reply_markup: createBackToMenuKeyboard(),
        });
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
      await ctx.reply(
        "❌ Couldn't fetch your balances.\n\n" +
          "Please try again or contact support if the issue persists",
        {
          reply_markup: new InlineKeyboard().text("🔄 Retry", "retry"),
        }
      );
    }
  }

  public async handleBankWithdrawal(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    if (!(await authService.isAuthenticated(chatId))) {
      await ctx.reply(
        "🔒 This feature requires login!\n\n" +
          "Please use /login to connect your account first",
        {
          reply_markup: new InlineKeyboard().text("🔐 Login", "login"),
        }
      );
      return;
    }

    try {
      const [balancesResponse, defaultWalletResponse] = await Promise.all([
        axios.get(`${this.API_BASE_URL}/api/wallets/balances`, {
          headers: await authService.getHeaders(chatId),
        }),
        axios.get(`${this.API_BASE_URL}/api/wallets/default`, {
          headers: await authService.getHeaders(chatId),
        }),
      ]);

      const balances = balancesResponse.data;
      const defaultWallet = defaultWalletResponse.data;

      if (!balances || balances.length === 0) {
        await ctx.reply(
          "💰 No funds available for withdrawal.\n\n" +
            "Please deposit funds first using /deposit",
          {
            reply_markup: new InlineKeyboard().text("💰 Deposit", "deposit"),
          }
        );
        return;
      }

      const defaultWalletBalance = balances.find(
        (w: any) => w.walletId === defaultWallet.id
      );

      const accountsResponse = await axios.get(
        `${this.API_BASE_URL}/api/accounts`,
        { headers: await authService.getHeaders(chatId) }
      );

      const accounts = accountsResponse.data.data;
      const bankAccounts = accounts.filter(
        (account: any) => account.type === "bank_account"
      );

      if (!bankAccounts || bankAccounts.length === 0) {
        await ctx.reply(
          "🏦 No bank accounts found.\n\n" + "Please add a bank account first.",
          {
            reply_markup: new InlineKeyboard()
              .text("➕ Add Bank Account", "add_bank")
              .row()
              .text("« Back to Menu", "main_menu"),
          }
        );
        return;
      }

      const keyboard = new InlineKeyboard();
      bankAccounts.forEach((account: any, index: number) => {
        if (account.status === "verified") {
          keyboard
            .text(
              `${
                account.bankAccount.bankName
              } (${account.bankAccount.bankAccountNumber.slice(-4)})`,
              `select_bank:${account.id}`
            )
            .row();
        }
      });
      keyboard.text("« Back to Menu", "main_menu");

      const balanceMessage = defaultWalletBalance
        ? defaultWalletBalance.balances
            .map(
              (b: any) =>
                `• ${b.symbol}: ${(Number(b.balance) / Math.pow(10, 8)).toFixed(
                  2
                )}`
            )
            .join("\n")
        : "No balance found in default wallet";

      await ctx.reply(
        `🏦 *Bank Withdrawal*\n\n` +
          `💰 *Available Balance:*\n${balanceMessage}\n\n` +
          `Select a bank account for withdrawal:`,
        {
          parse_mode: "Markdown",
          reply_markup: keyboard,
        }
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      await ctx.reply(
        "❌ Something went wrong.\n\n" +
          "Please try again or contact support if the issue persists",
        {
          reply_markup: createBackToMenuKeyboard(),
        }
      );
    }
  }

  public async handleBankSelection(
    ctx: Context,
    bankAccountId: string
  ): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    this.userStates.set(chatId, {
      action: "bank_withdrawal",
      bankAccountId,
    });

    await ctx.reply(
      "💰 Please enter the amount you want to withdraw (e.g., '100'):",
      {
        reply_markup: createBackToMenuKeyboard(),
      }
    );
  }

  public async handleRecentTransfers(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    if (!(await authService.isAuthenticated(chatId))) {
      await ctx.reply(
        "🔒 This feature requires login!\n\n" +
          "Please use /login to connect your account first",
        {
          reply_markup: new InlineKeyboard().text("🔐 Login", "login"),
        }
      );
      return;
    }

    try {
      const response = await axios.get(
        `${this.API_BASE_URL}/api/transfers?page=1&limit=10`,
        { headers: await authService.getHeaders(chatId) }
      );

      const transfers = response.data.data;
      if (!transfers || transfers.length === 0) {
        await ctx.reply(
          "📊 No recent transfers found.\n\n" +
            "Your transfer history will appear here once you make some transactions.",
          {
            reply_markup: new InlineKeyboard().text(
              "📊 Transactions",
              "transfers"
            ),
          }
        );
        return;
      }

      const formatAmount = (amount: number, symbol: string = "USDC") => {
        return `${(amount / Math.pow(10, 8)).toFixed(2)} ${symbol}`;
      };

      const getTypeEmoji = (type: string) => {
        switch (type.toLowerCase()) {
          case "deposit":
            return "📥";
          case "withdraw":
            return "📤";
          case "send":
            return "➡️";
          case "receive":
            return "⬅️";
          default:
            return "💸";
        }
      };

      const message = `
📊 *Recent Transfers*\n
${transfers
  .slice(0, 10)
  .map((tx: any) => {
    const type = tx.destinationAccount.bankName
      ? "Off-Ramp"
      : tx.type?.toUpperCase();
    const amount = formatAmount(tx.amount, tx.symbol);
    const recipient = tx.recipient || "N/A";
    const status = tx.status || "pending";
    const date = new Date(tx.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${getTypeEmoji(tx.type)} *${type}*
Amount: ${amount}
To: ${tx.destinationAccount.walletAddress ?? tx.destinationAccount.bankName}
Status: ${status === "success" ? "✅" : status === "pending" ? "⏳" : "❌"}
Date: ${date}${tx.hash ? `\nHash: \`${tx.hash}\`` : ""}\n`;
  })
  .join("\n")}
Use /send_to_email to send via email or /withdraw for bank withdrawals.`;

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().text("« Back to Menu", "main_menu"),
      });
    } catch (error) {
      console.error("Error fetching transfers:", error);
      await ctx.reply(
        "❌ Couldn't fetch your transfers.\n\n" +
          "Please try again or contact support if the issue persists",
        {
          reply_markup: new InlineKeyboard().text(
            "📊 Transactions",
            "transfers"
          ),
        }
      );
    }
  }

  public async handleTransferInput(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    const userState = this.userStates.get(chatId);
    if (!userState) return;

    const text = ctx.message?.text;
    if (!text) return;

    try {
      switch (userState.action) {
        case "email_transfer":
          if (!userState.recipient) {
            if (!this.isValidEmail(text)) {
              await ctx.reply("❌ Invalid email address. Please try again:", {
                reply_markup: createBackToMenuKeyboard(),
              });
              return;
            }
            this.userStates.set(chatId, { ...userState, recipient: text });
            await ctx.reply("💰 Please enter the amount you want to send:", {
              reply_markup: createBackToMenuKeyboard(),
            });
            return;
          }

          if (!userState.amount) {
            const amount = text.trim();
            if (!this.isValidAmount(amount)) {
              await ctx.reply(
                '❌ Invalid amount format. Please use format: "100"',
                {
                  reply_markup: createBackToMenuKeyboard(),
                }
              );
              return;
            }

            this.userStates.set(chatId, {
              ...userState,
              amount,
              symbol: "USDC",
              confirmationPending: true,
            });

            await this.sendConfirmation(ctx, {
              recipient: userState.recipient,
              amount,
              symbol: "USDC",
              type: "email",
            });
            return;
          }
          break;

        case "wallet_transfer":
          if (!userState.recipient) {
            if (!text.startsWith("0x") || text.length !== 42) {
              await ctx.reply(
                "❌ Invalid wallet address.\n\n" +
                  "Please enter a valid wallet address starting with '0x'",
                {
                  reply_markup: createBackToMenuKeyboard(),
                }
              );
              return;
            }
            this.userStates.set(chatId, { ...userState, recipient: text });
            await ctx.reply("💰 Please enter the amount you want to send:", {
              reply_markup: createBackToMenuKeyboard(),
            });
            return;
          }

          if (!userState.amount) {
            if (!this.isValidAmount(text)) {
              await ctx.reply(
                "❌ Invalid format.\n\n" + 'Please use format: "100"',
                {
                  reply_markup: createBackToMenuKeyboard(),
                }
              );
              return;
            }

            this.userStates.set(chatId, {
              ...userState,
              amount: text,
              symbol: "USDC",
              confirmationPending: true,
            });

            await this.sendConfirmation(ctx, {
              recipient: userState.recipient,
              amount: text,
              symbol: "USDC",
              type: "wallet",
            });
            return;
          }
          break;

        case "bank_withdrawal":
          if (!userState.amount && userState.bankAccountId) {
            const [amount] = text.split(" ");
            if (!this.isValidAmount(amount)) {
              await ctx.reply(
                "❌ Invalid format.\n\n" + "Please use format: '100'",
                {
                  reply_markup: createBackToMenuKeyboard(),
                }
              );
              return;
            }

            try {
              const quoteResponse = await axios.post(
                `${this.API_BASE_URL}/api/quotes/offramp`,
                {
                  amount: (Number(amount) * Math.pow(10, 8)).toString(),
                  currency: "USDC",
                  sourceCountry: "none",
                  destinationCountry: "ind",
                  onlyRemittance: true,
                  preferredBankAccountId: userState.bankAccountId,
                },
                { headers: await authService.getHeaders(chatId) }
              );

              const quote = quoteResponse.data;
              const quoteData = JSON.parse(quote.quotePayload);

              this.userStates.set(chatId, {
                ...userState,
                amount,
                symbol: "USDC",
                quote,
                confirmationPending: true,
              });

              const message = `
💱 *Withdrawal Quote*

Amount: ${amount} USDC
You'll Receive: ${(Number(quoteData.toAmount) / Math.pow(10, 8)).toFixed(
                2
              )} USDC
Exchange Rate: 1 USDC = ${Number(quoteData.rate).toFixed(2)} INR
Fee: ${(Number(quoteData.totalFee) / Math.pow(10, 8)).toFixed(2)} USDC
Arrival Time: ${quote.arrivalTimeMessage}

⚠️ *Important:*
• This quote is valid for a limited time
• Minimum amount: ${(Number(quote.minAmount) / Math.pow(10, 8)).toFixed(2)} USDC
• Maximum amount: ${(Number(quote.maxAmount) / Math.pow(10, 8)).toFixed(2)} USDC

Would you like to proceed with this withdrawal?`;

              await ctx.reply(message, {
                parse_mode: "Markdown",
                reply_markup: createConfirmationKeyboard(),
              });
            } catch (error) {
              console.error("Error getting quote:", error);
              await ctx.reply(
                "❌ Failed to get withdrawal quote.\n\n" +
                  "Please try again or contact support if the issue persists",
                {
                  reply_markup: createBackToMenuKeyboard(),
                }
              );
              this.userStates.delete(chatId);
            }
            return;
          }

          if (userState.confirmationPending && userState.quote) {
            if (text.toLowerCase() === "confirm") {
              try {
                await axios.post(
                  `${this.API_BASE_URL}/api/transfers/offramp`,
                  {
                    quotePayload: userState.quote.quotePayload,
                    quoteSignature: userState.quote.quoteSignature,
                  },
                  { headers: await authService.getHeaders(chatId) }
                );

                await ctx.reply(
                  "✅ Withdrawal initiated successfully!\n\n" +
                    "You can track the status in your recent transfers.",
                  {
                    reply_markup: new InlineKeyboard()
                      .text("📊 View Transfers", "transfers")
                      .row()
                      .text("« Back to Menu", "main_menu"),
                  }
                );
              } catch (error) {
                console.error("Error processing withdrawal:", error);
                await ctx.reply(
                  "❌ Withdrawal failed.\n\n" +
                    "Please try again or contact support if the issue persists",
                  {
                    reply_markup: createBackToMenuKeyboard(),
                  }
                );
              }
            } else {
              await ctx.reply("❌ Withdrawal cancelled.", {
                reply_markup: createBackToMenuKeyboard(),
              });
            }
            this.userStates.delete(chatId);
          }
          break;
      }
    } catch (error) {
      console.error("Error processing transfer:", error);
      await ctx.reply(
        "❌ Transfer failed.\n\n" +
          "Please try again or contact support if the issue persists",
        {
          reply_markup: new InlineKeyboard().text("🏦 Retry", "retry"),
        }
      );
      this.userStates.delete(chatId);
    }
  }

  private getTransferTypeEmoji(type: string): string {
    switch (type.toLowerCase()) {
      case "email_transfer":
        return "📧";
      case "wallet_transfer":
        return "🔄";
      case "bank_withdrawal":
        return "🏦";
      default:
        return "💸";
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidAmount(amount: string): boolean {
    return !isNaN(Number(amount)) && Number(amount) > 0;
  }

  private async sendConfirmation(
    ctx: Context,
    details: {
      recipient: string;
      amount: string;
      symbol: string;
      type: "email" | "wallet" | "bank";
    }
  ) {
    const message = `
⚠️ *Please Confirm Transfer*

To: ${
      details.type === "wallet" ? `\`${details.recipient}\`` : details.recipient
    }
Amount: ${details.amount} ${details.symbol}
${details.type === "wallet" ? "\nPurpose: Self Transfer" : ""}

${
  details.type === "wallet"
    ? `
⚠️ *Important:*
• Make sure the recipient address is correct
• Verify the network matches the recipient
• Transfers cannot be reversed
`
    : ""
}`;

    await ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: createConfirmationKeyboard(),
    });
  }

  private async fetchBalances(chatId: number) {
    const response = await axios.get(
      `${this.API_BASE_URL}/api/wallets/balances`,
      { headers: await authService.getHeaders(chatId) }
    );
    return response.data;
  }

  private formatBalances(balances: any[]) {
    return balances
      .map((wallet: any) =>
        wallet.balances
          .map((b: any) => `• ${b.symbol}: ${Number(b.balance).toFixed(6)}`)
          .join("\n")
      )
      .join("\n");
  }
}

export const transferHandler = TransferHandler.getInstance();
