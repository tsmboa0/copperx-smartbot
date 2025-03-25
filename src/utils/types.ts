export interface UserData {
  chatId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  scheme: string;
  accessToken: string;
  accessTokenId: string;
  expireAt: string;
  user: UserProfile;
}

export interface RouterResponse{
  route:string;
  type: "email" | 'OTP' | "amount"
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  organizationId: string;
  role: "owner" | "admin" | "user";
  status: "active" | "inactive" | "pending";
  type: "individual" | "business";
  relayerAddress?: string;
  flags: string[];
  walletAddress?: string;
  walletId?: string;
  walletAccountType?: string;
}

export interface KYCStatus {
  status: "pending" | "approved" | "rejected";
  type: "KYC" | "KYB";
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  submittedAt: string;
}

export interface EmailOTPRequest {
  email: string;
}

export interface EmailOTPAuthenticate {
  email: string;
  otp: string;
  sid: string;
}

export interface Wallet {
  id: string;
  walletAddress: string;
  network: string;
  isDefault: boolean;
}

export interface BankQuote {
  minAmount: string;
  maxAmount: string;
  arrivalTimeMessage: string;
  provider: {
    country: string;
    providerCode: string;
  };
  quotePayload: string;
  quoteSignature: string;
}
