import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserProfile } from "../utils/types/types";

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
    user.accessToken = token;
    user.accessTokenId = tokenId;
    user.expireAt = expireAt;
    return user;
  }
}
