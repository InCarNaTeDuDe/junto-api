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

@Entity("tickets")
export class Ticket {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  sellerId!: string;

  @ManyToOne(() => User, (user) => user.tickets, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "sellerId" })
  seller!: User;

  @Column({ type: "varchar" })
  eventName!: string;

  @Column({ type: "varchar" })
  category!: string;

  @Column({ type: "timestamp" })
  date!: Date;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  price!: number;

  @Column({ type: "varchar" })
  section!: string;

  @Column({
    type: "varchar",
    nullable: true,
  })
  row?: string;

  @Column({ type: "text" })
  description!: string;

  @Column({
    type: "boolean",
    default: false,
  })
  isSold!: boolean;

  @Column({ type: "varchar" })
  qrCode!: string;

  @CreateDateColumn({
    type: "timestamp",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
  })
  updatedAt!: Date;
}
