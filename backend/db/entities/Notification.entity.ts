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

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar" })
  type!: string; // activity | ticket | system

  @Column({
    type: "boolean",
    default: false,
  })
  read!: boolean;

  @CreateDateColumn({
    type: "timestamp",
  })
  timestamp!: Date;
}
