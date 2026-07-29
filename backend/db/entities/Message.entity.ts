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

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  activityId!: string;

  @ManyToOne(() => Activity, (activity) => activity.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "activityId",
  })
  activity!: Activity;

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

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({
    type: "timestamptz",
  })
  timestamp!: Date;
}
