import { Context } from "grammy";
import { authService } from "../services/auth.service";
import { InlineKeyboard } from "grammy";
import axios from "axios";
import { createBackToMenuKeyboard, createMainMenuKeyboard } from "../utils/keyboards";
import { userModel } from "../entities/user.entity";
import { EncryptionUtil } from "../utils/encryption.util";

export class AuthHandler {
  private static instance: AuthHandler;
  private userStates: Map<
    number,
    { email?: string; waitingForOTP: boolean; sid?: string }
  > = new Map();
  private readonly API_BASE_URL =
    process.env.COPPERX_API_BASE_URL || "https://income-api.copperx.io"; 

  private constructor() {}

  public static getInstance(): AuthHandler {
    if (!AuthHandler.instance) {
      AuthHandler.instance = new AuthHandler();
    }
    return AuthHandler.instance;
  }

  public async handleLogin(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    if (await authService.isAuthenticated(chatId)) {
      await ctx.reply(
        "✅ You're already logged in!\n\n" +
          "Choose any of the buttons below to perform an action",{
            reply_markup: createMainMenuKeyboard(true)
          }
      );
      return;
    }

    await ctx.reply( 
        "🔑 Please enter your CopperX email address to login:"
    );
    this.userStates.set(chatId, { waitingForOTP: false });
  }

  public async handleEmailInput(ctx: Context, email: string): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    try {
      const response = await authService.requestEmailOTP(email);
      this.userStates.set(chatId, {
        email,
        waitingForOTP: true,
        sid: response.sid,
      });
      await ctx.reply(
        "📧 I just sent an OTP to your email.\n\n" +
          "Enter the code to complete your login:"
      );
    } catch (error) {
      console.error("Error requesting OTP:", error);
      await ctx.reply(
        "❌ Oops! I couldn't send the verification code.\n\n" +
          "Please try /login again."
      );
    }
  }

  public async handleOTPInput(ctx: Context, otp: string): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    const userState = this.userStates.get(chatId);
    if (!userState?.email || !userState.waitingForOTP) {
      await ctx.reply(
        "⚠️ Session expired!\n\n" + "Please start over with /login"
      );
      return;
    }

    try {
      if (!userState.sid) {
        await ctx.reply(
          "⚠️ Session error!\n\n" + "Please start over with /login"
        );
        return;
      }

      const response = await authService.authenticateEmailOTP(
        chatId,
        userState.email,
        otp,
        userState.sid
      );
      this.userStates.delete(chatId);
      await userModel.create({userId:chatId.toString(), encryptedToken:EncryptionUtil.encrypt(response?.accessToken), expiresAt:response?.expireAt})

      await ctx.reply(
        "🎉 Successfully logged in!\n\n" +
          "Click any button below to perform an action",{
            reply_markup: createMainMenuKeyboard(await authService.isAuthenticated(chatId))
          }
      );
    } catch (error) {
      console.error("Error authenticating OTP:", error);
      await ctx.reply(
        "❌ Invalid verification code.\n\n" +
          "Please try again or use /login to restart"
      );
    }
  }

  public async handleProfile(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    if (!(await authService.isAuthenticated(chatId))) {
      await ctx.reply(
        "🔒 *Profile Access Restricted*\n\n" +
          "Please login to view your profile details.",
        {
          parse_mode: "Markdown",
          reply_markup: new InlineKeyboard().text("🔑 Login", "login"),
        }
      );
      return;
    }

    try {
      const response = await axios.get(`${this.API_BASE_URL}/api/auth/me`, {
        headers: await authService.getHeaders(chatId),
      });

      const user = response.data;

      const message = `
👤 *Your CopperX Profile*

*Personal Details*
📧 Email: \`${user.email}\`
🆔 User ID: \`${user.id}\`
👤 Name: ${user.firstName} ${user.lastName ?? ""}

*Account Status*
📋 KYC Status: ${this.getKYCStatusEmoji(
        user.status
      )} ${user.status.toUpperCase()}

Use /kyc to check detailed KYC status
Use /wallets to manage your wallets`;

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard()
          .text("📋 Check KYC Status", "kyc")
          .row()
          .text("👛 Manage Wallets", "wallets")
          .row()
          .text("« Back to Menu", "main_menu"),
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      await ctx.reply(
        "❌ Couldn't fetch your profile.\n\n" +
          "Please try again or contact support if the issue persists",
        {
          reply_markup: createBackToMenuKeyboard(),
        }
      );
    }
  }

  public async handleKYCStatus(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    if (!(await authService.isAuthenticated(chatId))) {
      await ctx.reply(
        "🔒 *KYC Status Access Restricted*\n\n" +
          "Please login to check your KYC verification status.",
        {
          parse_mode: "Markdown",
          reply_markup: new InlineKeyboard().text("🔐 Login", "login"),
        }
      );
      return;
    }

    try {
      const response = await axios.get(`${this.API_BASE_URL}/api/kycs`, {
        headers: await authService.getHeaders(chatId),
      });

      if(!response.data?.data.length){
        const message = `
  ⚠️ *KYC not started yet* 

📝 Start KYC Verification

Complete KYC verification to: 
  • Increase your transaction limits
  • Access all platform features
  • Enable bank withdrawals

Click below to start the verification process.`;

        await ctx.reply(message, {
          parse_mode:"Markdown",
          reply_markup: new InlineKeyboard()
          .url("Start KYC", "https://t.me/copperx_smartbot?startapp")
          .text("<< Back to Menu", "main_menu")
        });

        return
      }


      const kycData = response.data.data[0];
      const status = kycData?.status.toUpperCase();

      let message = `
        📋 *KYC Verification Status*

        *Current Status:* ${this.getKYCStatusEmoji(status)} ${status}
        `;

      switch (status.toLowerCase()) {
        case "pending":
          message += `
            ⏳ Your KYC verification is being processed.
            We'll notify you once the verification is complete.

            *Submission Date:* ${new Date(kycData.createdAt).toLocaleDateString()}`;
          break;

        case "approved":
          message += `
            ✅ Your account is fully verified!

            *Verification Details:*
            📅 Approved Date: ${new Date(
                        kycData.kycDetail.currentKycVerification.verifiedAt
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
            `;
          break;

        case "rejected":
          message += `
            ❌ Your KYC verification was not approved.

            *Reason:* ${kycData.rejectionReason}

            Please submit new documents with the following corrections:
            ${kycData.requiredCorrections.join("\n")}`;
          break;

        default:
           message += `
            ⚠️ *Your KYC has not been started yet*

            📝 *Start KYC Verification*

            Complete KYC verification to:
            • Increase your transaction limits
            • Access all platform features
            • Enable bank withdrawals

            Click below to start the verification process.`;
      }

      const keyboard = new InlineKeyboard();
      if (
        status.toLowerCase() === "none" ||
        status.toLowerCase() === "rejected"
      ) {
        keyboard.url("📝 Start KYC", "https://t.me/someapp");
      }
      keyboard
        .text("👤 View Profile", "profile")
        .row()
        .text("« Back to Menu", "main_menu");

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error("Error fetching KYC status:", error);
      await ctx.reply(
        "❌ Couldn't fetch your KYC status.\n\n" +
          "Please try again or contact support if the issue persists",
        {
          reply_markup: createBackToMenuKeyboard(),
        }
      );
    }
  }

  private getKYCStatusEmoji(status: string): string {
    switch (status.toLowerCase()) {
      case "approved":
        return "✅";
      case "pending":
        return "⏳";
      case "rejected":
        return "❌";
      default:
        return "📝";
    }
  }

  public async handleLogout(ctx: Context): Promise<void> {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    await authService.logout(chatId);
    await ctx.reply(
      "👋 Successfully logged out!\n\n" +
        "Use /login whenever you want to connect again", {
          reply_markup: createMainMenuKeyboard(await authService.isAuthenticated(chatId))
        }
    );
  }

  public isWaitingForOTP(chatId: number): boolean {
    return this.userStates.get(chatId)?.waitingForOTP || false;
  }
}

export const authHandler = AuthHandler.getInstance();
