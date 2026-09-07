import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { User } from "./User.entity";

@Entity("supportchat")
export class SupportChat {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.supportChats, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "userId",
  })
  user!: User;

  @Column({ type: "varchar", length: 20 })
  sender!: "user" | "bot";

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar", length: 20, default: "active" })
  status!: "active" | "ended";

  @Index()
  @Column({ type: "varchar", length: 100, nullable: true })
  sessionId?: string | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
