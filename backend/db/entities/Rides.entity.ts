import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { User } from "./User.entity";

export type RideVehicleType = "car" | "bike";

export type RideStatus = "active" | "in_progress" | "completed" | "cancelled";

export interface RidePassenger {
  userId: string;
  userName: string;
  seats: number;
  pickupPoint?: string;
  passengerPhone?: string;
  joinedAt: string;
}

@Entity("rides")
export class Ride {
  // =========================
  // ID
  // =========================

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // =========================
  // DRIVER
  // =========================

  @Column()
  driverId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "driverId",
  })
  driver!: User;

  @Column()
  driverName!: string;

  @Column({
    type: "float",
    default: 5.0,
  })
  driverRating!: number;

  @Column({
    nullable: true,
  })
  driverAvatar?: string;

  @Column({
    nullable: true,
    default: "#2563EB",
  })
  driverAvatarBg?: string;

  // =========================
  // ROUTE
  // =========================

  @Column()
  from!: string;

  @Column()
  to!: string;

  @Column()
  time!: string;

  // =========================
  // VEHICLE
  // =========================

  @Column({
    type: "varchar",
  })
  vehicleType!: RideVehicleType;

  // =========================
  // SEATS
  // =========================

  @Column({
    type: "int",
  })
  seatsLeft!: number;

  @Column({
    type: "int",
  })
  totalSeats!: number;

  // =========================
  // PRICE
  // =========================

  @Column()
  price!: string;

  // =========================
  // RIDE DETAILS
  // =========================

  @Column({
    default: true,
  })
  verified!: boolean;

  @Column({
    nullable: true,
  })
  notes?: string;

  // =========================
  // LOCATION
  // =========================

  @Column({
    nullable: true,
  })
  locationName?: string;

  @Column({
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

  // =========================
  // STATUS
  // =========================

  @Column({
    type: "varchar",
    default: "active",
  })
  status!: RideStatus;

  // =========================
  // PASSENGER
  // =========================
  //
  // Currently:
  // ONE driver + ONE passenger
  //

  @Column({
    type: "jsonb",
    default: [],
  })
  passengers!: RidePassenger[];

  // =========================
  // TIMESTAMPS
  // =========================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
