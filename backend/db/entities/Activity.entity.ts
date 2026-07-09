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

@Entity("activities")
export class Activity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  organizerId!: string;

  @ManyToOne(() => User, (user) => user.activities, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "organizerId" })
  organizer!: User;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar" })
  category!: string;

  @Column({ type: "varchar" })
  location!: string;

  @Column({ type: "timestamp" })
  datetime!: Date;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  cost!: number;

  @Column({ type: "int" })
  maxParticipants!: number;

  @Column({ type: "int" })
  remainingSeats!: number;

  @Column({
    type: "simple-array",
    nullable: true,
  })
  participantIds?: string[];

  @Column({
    type: "simple-array",
    nullable: true,
  })
  tags?: string[];

  @CreateDateColumn({
    type: "timestamp",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
  })
  updatedAt!: Date;
}
