import * as crypto from "crypto";
import config from "../config/config"

export class EncryptionUtil {
  private static readonly algorithm = "aes-256-cbc";

  private static getKey(): Buffer {
    const envKey = config.encryption.key;
    if (Buffer.from(envKey).length !== 32) {
      return crypto.createHash("sha256").update(String(envKey)).digest();
    }
    return Buffer.from(envKey);
  }

  /**
   * Encrypts a string using AES-256-CBC
   * @param text The text to encrypt
   * @returns The encrypted text as a base64 string with IV prepended
   */
  static encrypt(text: string): string {
    // Generate a random IV for each encryption
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.getKey(), iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Prepend the IV to the encrypted data (IV needs to be stored for decryption)
    return iv.toString("hex") + ":" + encrypted;
  }

  /**
   * Decrypts a string that was encrypted with the encrypt method
   * @param encryptedText The encrypted text with IV prepended
   * @returns The decrypted text
   */
  static decrypt(encryptedText: string): string {
    try {
      const textParts = encryptedText.split(":");
      if (textParts.length !== 2) {
        throw new Error("Invalid encrypted text format");
      }

      const iv = Buffer.from(textParts[0], "hex");
      const encryptedData = textParts[1];

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.getKey(),
        iv
      );

      let decrypted = decipher.update(encryptedData, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Decryption error:", error);
      return encryptedText;
    }
  }
}
