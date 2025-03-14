import * as crypto from "crypto";

export class EncryptionUtil {
  private static readonly algorithm = "aes-256-cbc";
  private static readonly key =
    process.env.ENCRYPTION_KEY || "default-encryption-key-must-be-32-chars";
  private static readonly iv = crypto.randomBytes(16);

  /**
   * Encrypts a string using AES-256-CBC
   * @param text The text to encrypt
   * @returns The encrypted text as a base64 string with IV prepended
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.key),
      iv
    );

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
  }

  /**
   * Decrypts a string that was encrypted with the encrypt method
   * @param encryptedText The encrypted text with IV prepended
   * @returns The decrypted text
   */
  static decrypt(encryptedText: string): string {
    const textParts = encryptedText.split(":");
    const iv = Buffer.from(textParts[0], "hex");
    const encryptedData = textParts[1];

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.key),
      iv
    );

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}
