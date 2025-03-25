import axios from "axios";
import {
  AuthResponse,
  EmailOTPRequest,
  EmailOTPAuthenticate,
  UserProfile,
  KYCStatus,
} from "../utils/types";
import { userModel } from "../entities/user.entity";
import { EncryptionUtil } from "../utils/encryption.util";

const API_BASE_URL =
  process.env.COPPERX_API_BASE_URL || "https://income-api.copperx.io";

class AuthService {
  private static instance: AuthService;
  // private userRepository = AppDataSource.getRepository(User);

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async getHeaders(chatId: number) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await this.getAccessToken(chatId)}`,
    };
  }

  public async requestEmailOTP(email: string): Promise<{ sid: string }> {
    const payload: EmailOTPRequest = { email };
    const response = await axios.post<{ sid: string }>(
      `${API_BASE_URL}/api/auth/email-otp/request`,
      payload
    );
    return response.data;
  }

  public async authenticateEmailOTP(
    chatId: number,
    email: string,
    otp: string,
    sid: string
  ): Promise<AuthResponse> {
    const payload: EmailOTPAuthenticate = { email, otp, sid };
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/email-otp/authenticate`,
      payload
    );
    return response.data;
  }

  public async getProfile(chatId: number): Promise<UserProfile> {
    const response = await axios.get<UserProfile>(
      `${API_BASE_URL}/api/auth/me`,
      { headers: await this.getHeaders(chatId) }
    );

    return response.data;
  }

  public async getKYCStatus(chatId: number): Promise<KYCStatus[]> {
    const response = await axios.get<{ data: KYCStatus[] }>(
      `${API_BASE_URL}/api/kycs`,
      {
        headers: await this.getHeaders(chatId),
      }
    );
    return response.data.data;
  }

  public async isAuthenticated(chatId: number): Promise<boolean> {
    const user =  await userModel.findOne({userId:chatId.toString()});
    if (!user) return false;

    if (!user?.expiresAt || Date.now() > new Date(user?.expiresAt).getTime()) {
      console.log("user session expired");
      await this.logout(chatId);
      return false;
    }

    return true;
  }

  public async logout(chatId: number): Promise<void> {
    await userModel.deleteOne({userId:chatId.toString()});
  }

  private async getAccessToken(chatId: number): Promise<string> {
    const user = await userModel.findOne({userId:chatId.toString()});
    if (!user) {
      throw new Error("User not found");
    }

    // Decrypt the token before using it
    return EncryptionUtil.decrypt(user?.encryptedToken!);
  }
}

export const authService = AuthService.getInstance();
