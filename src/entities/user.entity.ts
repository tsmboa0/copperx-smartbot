import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserProfile } from "../utils/types";
import { EncryptionUtil } from "../utils/encryption.util";

@Entity("users")
export class User {
  @PrimaryColumn()
  chatId!: number;

  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column()
  accessToken!: string;

  @Column()
  accessTokenId!: string;

  @Column()
  expireAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  static fromProfile(
    chatId: number,
    profile: UserProfile,
    token: string,
    tokenId: string,
    expireAt: Date
  ): User {
    const user = new User();
    user.chatId = chatId;
    user.email = profile.email;
    user.name = profile.firstName + " " + profile.lastName;

    user.accessToken = EncryptionUtil.encrypt(token);
    user.accessTokenId = EncryptionUtil.encrypt(tokenId);

    user.expireAt = expireAt;
    return user;
  }

  /**
   * Get the decrypted access token
   * @returns The decrypted access token
   */
  getDecryptedAccessToken(): string {
    return EncryptionUtil.decrypt(this.accessToken);
  }

  /**
   * Get the decrypted access token ID
   * @returns The decrypted access token ID
   */
  getDecryptedAccessTokenId(): string {
    return EncryptionUtil.decrypt(this.accessTokenId);
  }
}
