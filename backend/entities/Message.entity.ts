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
import { Activity } from "./Activity.entity";
import { LocalDeal } from "./LocalDeals.entity";
@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  activityId?: string | null;

  @ManyToOne(() => Activity, (activity) => activity.messages, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({
    name: "activityId",
  })
  activity?: Activity | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  dealId?: string | null;

  @ManyToOne(() => LocalDeal, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({
    name: "dealId",
  })
  deal?: LocalDeal | null;

  @Index()
  @Column({ type: "uuid" })
  senderId!: string;

  @ManyToOne(() => User, (user) => user.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "senderId",
  })
  sender!: User;

  @Index()
  @Column({ type: "uuid", nullable: true })
  participantId?: string | null;

  @ManyToOne(() => User, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({
    name: "participantId",
  })
  participant?: User | null;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "text", nullable: true })
  image?: string | null;

  @CreateDateColumn({
    type: "timestamptz",
  })
  timestamp!: Date;
}
