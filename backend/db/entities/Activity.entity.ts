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

export enum ActivityCategory {
  DAY_MATES = "DAY_MATES",
  MOVIES = "MOVIES",
  SPORTS = "SPORTS",
  FOOD = "FOOD",
}

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

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "enum", enum: ActivityCategory })
  category!: ActivityCategory;

  @Column({ type: "varchar", nullable: true })
  activityEmoji?: string;

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

  /* ---------------- Location ---------------- */

  @Column({
    type: "varchar",
  })
  locationName!: string;

  @Column({
    type: "varchar",
  })
  locationState!: string;
  // for frequent searching index lat,long cols
  @Index()
  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
  })
  latitude!: number;

  @Index()
  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
  })
  longitude!: number;

  @Column({
    type: "boolean",
    default: false,
  })
  isAutoDetected!: boolean;
}
