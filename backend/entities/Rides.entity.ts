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

@Entity("rides")
export class Ride {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * User who created/owns the ride
   *
   * rides.userId -> users.id
   */
  @Index()
  @Column({
    type: "uuid",
  })
  userId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "userId",
    referencedColumnName: "id",
  })
  user!: User;

  @Column({
    type: "varchar",
    length: 120,
  })
  driverName!: string;

  @Column({
    type: "decimal",
    precision: 2,
    scale: 1,
    default: 5.0,
  })
  driverRating!: number;

  @Column({
    type: "varchar",
    nullable: true,
  })
  driverAvatar?: string;

  @Column({
    type: "varchar",
    length: 20,
    default: "#2563EB",
  })
  driverAvatarBg!: string;

  @Column({
    type: "varchar",
    length: 120,
  })
  from!: string;

  @Column({
    type: "varchar",
    length: 120,
  })
  to!: string;

  @Column({
    type: "varchar",
    length: 80,
  })
  time!: string;

  @Column({
    type: "enum",
    enum: ["car", "bike"],
  })
  vehicleType!: "car" | "bike";

  @Column({
    type: "int",
  })
  seatsLeft!: number;

  @Column({
    type: "int",
  })
  totalSeats!: number;

  @Column({
    type: "varchar",
    length: 50,
  })
  price!: string;

  @Column({
    type: "boolean",
    default: true,
  })
  verified!: boolean;

  @Column({
    type: "varchar",
    length: 300,
    nullable: true,
  })
  notes?: string;

  @Column({
    type: "varchar",
    length: 120,
    nullable: true,
  })
  locationName?: string;

  @Column({
    type: "varchar",
    length: 120,
    nullable: true,
  })
  locationState?: string;

  @Column({
    type: "double precision",
    nullable: true,
  })
  latitude?: number;

  @Column({
    type: "double precision",
    nullable: true,
  })
  longitude?: number;

  @Column({
    type: "enum",
    enum: ["active", "in_progress", "completed", "cancelled"],
    default: "active",
  })
  status!: "active" | "in_progress" | "completed" | "cancelled";

  /**
   * For now passengers are stored directly
   * in the rides table as JSONB.
   */
  @Column({
    type: "jsonb",
    default: () => "'[]'",
  })
  passengers!: Array<{
    userId: string;
    userName: string;
    seats: number;
    pickupPoint?: string;
    passengerPhone?: string;
    joinedAt: string;
  }>;

  @CreateDateColumn({
    type: "timestamp",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
  })
  updatedAt!: Date;
}
