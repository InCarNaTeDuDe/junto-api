import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

import { User } from "./User.entity";

@Entity("login_history")
export class LoginHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.loginHistory, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "varchar" })
  method!: string; // GOOGLE_SSO

  @Column({ type: "varchar" })
  platform!: string;

  @Column({ type: "varchar" })
  ipAddress!: string;

  @Column({ type: "boolean", default: true })
  success!: boolean;

  @CreateDateColumn({
    type: "timestamp",
  })
  loginTime!: Date;
}
