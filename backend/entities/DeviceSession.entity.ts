import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

import { User } from "./User.entity";

@Entity("device_sessions")
export class DeviceSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.deviceSessions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "varchar" })
  deviceId!: string;

  @Column({ type: "varchar" })
  platform!: string; // ANDROID | IOS | WEB

  @Column({ type: "varchar" })
  deviceName!: string;

  @Column({
    type: "varchar",
    nullable: true,
  })
  model?: string;

  @Column({
    type: "varchar",
    nullable: true,
  })
  os?: string;

  @Column({ type: "varchar" })
  appVersion!: string;

  @Column({ type: "varchar" })
  ipAddress!: string;

  @Column({
    type: "boolean",
    default: true,
  })
  isActive!: boolean;

  @CreateDateColumn({
    type: "timestamp",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
  })
  updatedAt!: Date;
}
