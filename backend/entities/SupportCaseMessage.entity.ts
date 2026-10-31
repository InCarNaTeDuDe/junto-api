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
import { SupportCase } from "./SupportCase.entity";

export enum MessageSenderType {
  USER = "USER",
  AGENT = "AGENT",
  SYSTEM = "SYSTEM",
}

@Entity("support_case_messages")
export class SupportCaseMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({
    name: "caseId",
    type: "uuid",
  })
  caseId!: string;

  @ManyToOne(() => SupportCase, (c) => c.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "caseId",
  })
  case!: SupportCase;

  @Column({
    name: "senderType",
    type: "varchar",
    length: 20,
  })
  senderType!: MessageSenderType;

  @Index()
  @Column({
    name: "senderId",
    type: "uuid",
    nullable: true,
  })
  senderId?: string | null;

  @Column({
    type: "text",
  })
  message!: string;

  @Index()
  @Column({
    name: "isInternalNote",
    type: "boolean",
    default: false,
  })
  isInternalNote!: boolean;

  @CreateDateColumn({
    name: "createdAt",
    type: "timestamp",
  })
  createdAt!: Date;
}
