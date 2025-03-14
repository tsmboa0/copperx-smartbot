import { Context } from "grammy";
import { authService } from "../services/auth.service";
import axios from "axios";
import { Wallet } from "../utils/types";
import { getNetworkName } from "../utils/constants";
import {
  createWalletListKeyboard,
  createMainMenuKeyboard,
  createBackToMenuKeyboard,
} from "../utils/keyboards";
import { InlineKeyboard } from "grammy";

export class WalletHandler {
  private static instance: WalletHandler;
  private readonly API_BASE_URL =
    process.env.COPPERX_API_BASE_URL || "https://income-api.copperx.io";

  private userStates: Map<
    number,
    {
      action?: "set_default";
      wallets?: any[];
    }
  > = new Map();

  private constructor() {}

  public static getInstance(): WalletHandler {
    if (!WalletHandler.instance) {
      WalletHandler.instance = new WalletHandler();
    }
    return WalletHandler.instance;
  }

  public async handleWallets(ctx: Context): Promise<void> {
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
      const [walletsResponse, defaultWalletResponse] = await Promise.all([
        this.fetchWallets(chatId),
        axios.get(`${this.API_BASE_URL}/api/wallets/default`, {
          headers: await authService.getHeaders(chatId),
        }),
      ]);

      const wallets = walletsResponse;
      const defaultWallet = defaultWalletResponse.data;

      if (!wallets || wallets.length === 0) {
        await ctx.reply(
          "👛 No wallets found.\n\n" + "Please create a wallet first!",
          {
            reply_markup: createBackToMenuKeyboard(),
          }
        );
        return;
      }

      const message = `
👛 *Your Wallets*

${wallets
  .map(
    (wallet: any) => `
${wallet.id === defaultWallet.id ? "✅ *Default Wallet*" : "👛 *Wallet*"}
Network: ${getNetworkName(wallet.network)}
Address: \`${wallet.walletAddress}\`
`
  )
  .join("\n")}

Use /setdefault to change your default wallet.`;

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard()
          .text("⚙️ Set Default", "setdefault")
          .row()
          .text("💰 View Balances", "balance")
          .row()
          .text("« Back to Menu", "main_menu"),
      });
    } catch (error) {
      console.error("Error fetching wallets:", error);
      await ctx.reply(
        "❌ Couldn't fetch your wallets.\n\n" +
          "Please try again or contact support if the issue persists",
        {
          reply_markup: createBackToMenuKeyboard(),
        }
      );
    }
  }

  public async handleBalances(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    if (!(await authService.isAuthenticated(chatId))) {
      await ctx.reply(
        "🔒 This feature requires login!\n\n" +
          "Please use /login to connect your account first"
      );
      return;
    }

    try {
      const [balancesResponse, walletsResponse] = await Promise.all([
        axios.get(`${this.API_BASE_URL}/api/wallets/balances`, {
          headers: await authService.getHeaders(chatId),
        }),
        axios.get(`${this.API_BASE_URL}/api/wallets`, {
          headers: await authService.getHeaders(chatId),
        }),
      ]);

      const wallets = balancesResponse.data;
      const walletsMap = walletsResponse.data.reduce(
        (acc: any, wallet: Wallet) => {
          acc[wallet.id] = wallet.walletAddress;
          return acc;
        },
        {}
      );

      if (!wallets || wallets.length === 0) {
        await ctx.reply(
          "💰 No wallets found.\n\n" +
            "Please create a wallet and deposit some funds first!"
        );
        return;
      }

      const message = `
💰 *Your Wallet Balances*

${wallets
  .map(
    (wallet: any) => `
${wallet.isDefault ? "✅ *Default Wallet*" : "👛 *Wallet*"} _(${getNetworkName(
      wallet.network
    )})_
${wallet.balances
  .map(
    (balance: any) =>
      `• ${balance.symbol}: ${Number(balance.balance).toFixed(6)}`
  )
  .join("\n")}
\`${walletsMap[wallet.walletId]}\`
`
  )
  .join("\n")}

Use /deposit to add funds or /setdefault to change your default wallet.
    `;
      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error fetching balances:", error);
      await ctx.reply(
        "❌ Couldn't fetch your balances.\n\n" +
          "Please try again or contact support if the issue persists"
      );
    }
  }

  public async handleSetDefault(
    ctx: Context,
    walletId?: string
  ): Promise<void> {
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
      if (walletId) {
        await axios.post(
          `${this.API_BASE_URL}/api/wallets/default`,
          { walletId },
          { headers: await authService.getHeaders(chatId) }
        );

        const wallet = (await this.fetchWallets(chatId)).find(
          (w) => w.id === walletId
        );
        await ctx.reply(
          "✅ Default wallet updated successfully!\n\n" +
            `New default wallet _(${getNetworkName(wallet?.network!)})_:\n` +
            `\`${wallet?.walletAddress}\``,
          {
            parse_mode: "Markdown",
            reply_markup: createMainMenuKeyboard(),
          }
        );
        return;
      }

      const wallets = await this.fetchWallets(chatId);
      const message = `⚙️ *Set Default Wallet*\n\nChoose a wallet to set as default:`;

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: createWalletListKeyboard(wallets),
      });
    } catch (error) {
      console.error("Error with default wallet:", error);
      await ctx.reply(
        "❌ Operation failed.\n\n" +
          "Please try again or contact support if the issue persists",
        {
          reply_markup: createBackToMenuKeyboard(),
        }
      );
    }
  }

  public async handleSetDefaultChoice(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    const userState = this.userStates.get(chatId);
    if (
      !userState?.action ||
      userState.action !== "set_default" ||
      !userState.wallets
    ) {
      return;
    }

    const choice = parseInt(ctx.message?.text || "");
    if (isNaN(choice) || choice < 1 || choice > userState.wallets.length) {
      await ctx.reply(
        "❌ Invalid choice.\n\n" +
          `Please enter a number between 1 and ${userState.wallets.length}.`
      );
      return;
    }

    const selectedWallet = userState.wallets[choice - 1];

    console.log(selectedWallet);
    try {
      await axios.post(
        `${this.API_BASE_URL}/api/wallets/default`,
        { walletId: selectedWallet.id },
        { headers: await authService.getHeaders(chatId) }
      );

      await ctx.reply(
        "✅ Default wallet updated successfully!\n\n" +
          `New default wallet _(${getNetworkName(
            selectedWallet.network
          )})_:\n` +
          `\`${selectedWallet.walletAddress}\``,
        { parse_mode: "Markdown" }
      );

      this.userStates.delete(chatId);
    } catch (error) {
      console.error("Error setting default wallet:", error);
      await ctx.reply(
        "❌ Couldn't set the default wallet.\n\n" +
          "Please try again or contact support if the issue persists"
      );
    }
  }

  public async handleDeposit(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    if (!(await authService.isAuthenticated(chatId))) {
      await ctx.reply(
        "🔒 This feature requires login!\n\n" +
          "Please use /login to connect your account first"
      );
      return;
    }

    try {
      const response = await axios.get(
        `${this.API_BASE_URL}/api/wallets/default`,
        {
          headers: await authService.getHeaders(chatId),
        }
      );

      const defaultWallet = response.data;
      if (!defaultWallet) {
        await ctx.reply(
          "⚠️ No default wallet found.\n\n" +
            "Please set a default wallet first using /setdefault"
        );
        return;
      }

      const message = `
💎 *Deposit Instructions*

To deposit funds to your wallet:

1. Send your funds to this address:
\`${defaultWallet.walletAddress}\`

2. Make sure to select the correct network:
*${getNetworkName(defaultWallet.network)}*

3. Wait for the transaction to be confirmed

⚠️ *Important:*
• Only send supported tokens
• Double-check the network before sending
• Minimum deposit amount may apply

Use /transactions to check your deposit status.
      `;
      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error fetching default wallet:", error);
      await ctx.reply(
        "❌ Couldn't fetch deposit information.\n\n" +
          "Please try again or contact support if the issue persists"
      );
    }
  }

  public async handleTransactions(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    if (!(await authService.isAuthenticated(chatId))) {
      await ctx.reply(
        "🔒 This feature requires login!\n\n" +
          "Please use /login to connect your account first"
      );
      return;
    }

    try {
      const response = await axios.get(`${this.API_BASE_URL}/api/transfers`, {
        headers: await authService.getHeaders(chatId),
      });

      const transactions = response.data;
      if (!transactions || transactions.length === 0) {
        await ctx.reply(
          "📊 No transactions found.\n\n" +
            "Your transaction history will appear here once you make some transfers."
        );
        return;
      }

      const message = `
📊 *Recent Transactions*

${transactions
  .slice(0, 5)
  .map(
    (tx: any) => `
*${tx.type === "deposit" ? "📥 Deposit" : "📤 Withdrawal"}*
*Amount:* ${tx.amount} ${tx.symbol}
*Status:* ${tx.status}
*Date:* ${new Date(tx.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}
*Hash:* \`${tx.hash}\`
`
  )
  .join("\n")}

Use /wallets to manage your wallets or /balance to check current balances.
      `;
      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      await ctx.reply(
        "❌ Couldn't fetch your transactions.\n\n" +
          "Please try again or contact support if the issue persists"
      );
    }
  }

  private async fetchWallets(chatId: number): Promise<Wallet[]> {
    const response = await axios.get<Wallet[]>(
      `${this.API_BASE_URL}/api/wallets`,
      {
        headers: await authService.getHeaders(chatId),
      }
    );
    return response.data;
  }
}

export const walletHandler = WalletHandler.getInstance();
