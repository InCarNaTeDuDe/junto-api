import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

import { DeviceSession } from "./DeviceSession.entity";
import { LoginHistory } from "./LoginHistory.entity";
import { Activity } from "./Activity.entity";
import { Ticket } from "./Ticket.entity";
import { Notification } from "./Notification.entity";
import { Message } from "./Message.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    unique: true,
  })
  email!: string;

  @Column({
    type: "varchar",
  })
  name!: string;

  @Column({
    type: "varchar",
    nullable: true,
  })
  avatar?: string;

  @Column({
    type: "varchar",
    nullable: true,
  })
  passwordHash?: string;

  @Column({
    type: "varchar",
    nullable: true,
  })
  pushToken?: string;

  @CreateDateColumn({
    type: "timestamp",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
  })
  updatedAt!: Date;

  // relations
  @OneToMany(() => DeviceSession, (s) => s.user)
  deviceSessions!: DeviceSession[];

  @OneToMany(() => LoginHistory, (l) => l.user)
  loginHistory!: LoginHistory[];

  @OneToMany(() => Activity, (a) => a.organizer)
  activities!: Activity[];

  @OneToMany(() => Ticket, (t) => t.seller)
  tickets!: Ticket[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications!: Notification[];

  @OneToMany(() => Message, (message) => message.sender)
  messages!: Message[];
}
