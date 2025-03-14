import { InlineKeyboard } from "grammy";
import { Wallet } from "./types";
import { getNetworkName } from "./constants";

export const createMainMenuKeyboard = (isLoggedIn: boolean = false) => {
  const keyboard = new InlineKeyboard();

  if (isLoggedIn) {
    keyboard
      .text("👤 Profile", "profile")
      .text("📋 KYC Status", "kyc")
      .row()
      .text("👛 Wallets", "wallets")
      .text("💰 Balance", "balance")
      .row()
      .text("💸 Send Money", "send_money")
      .text("📥 Deposit", "deposit")
      .row()
      .text("📊 Transactions", "transfers")
      .row()
      .text("🔓 Logout", "logout");
  } else {
    keyboard.text("🔐 Login to CopperX", "login");
  }

  return keyboard;
};

export const createSendMoneyKeyboard = () => {
  return new InlineKeyboard()
    .text("📧 Send to Email", "send_email")
    .row()
    .text("🔄 Send to Wallet", "send_wallet")
    .row()
    .text("🏦 Bank Withdrawal", "withdraw")
    .row()
    .text("« Back to Menu", "main_menu");
};

export const createConfirmationKeyboard = () => {
  return new InlineKeyboard()
    .text("✅ Confirm", "confirm")
    .text("❌ Cancel", "cancel");
};

export const createWalletListKeyboard = (wallets: Wallet[]) => {
  const keyboard = new InlineKeyboard();

  wallets.forEach((wallet) => {
    keyboard
      .text(
        `${wallet.isDefault ? "✅ " : ""}${getNetworkName(wallet.network)}`,
        `select_wallet:${wallet.id}`
      )
      .row();
  });

  keyboard.text("« Back to Menu", "main_menu");
  return keyboard;
};

export const createBackToMenuKeyboard = () => {
  return new InlineKeyboard().text("« Back to Menu", "main_menu");
};
