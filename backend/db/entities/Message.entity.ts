import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

import { User } from "./User.entity";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  chatId!: string;

  @Index()
  @Column({ type: "uuid" })
  senderId!: string;

  @ManyToOne(() => User, (user) => user.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "senderId" })
  sender!: User;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({
    type: "timestamp",
  })
  timestamp!: Date;
}
