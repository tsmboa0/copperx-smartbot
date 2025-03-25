
import { UserProfile } from "../utils/types";
import { EncryptionUtil } from "../utils/encryption.util";
import mongoose from "mongoose";


const UserSessionSchema = new mongoose.Schema({
  userId: String,
  encryptedToken: String,
  expiresAt: String
});

const rateLimitSchema = new mongoose.Schema({
  userId: String,
  timestamps: [Number], 
});

export const userModel = mongoose.model("userModel", UserSessionSchema);
export const RateLimit = mongoose.model('RateLimit', rateLimitSchema);
