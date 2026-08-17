import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User.entity";

@Entity("rides")
export class Ride {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "varchar" })
  fromLocation!: string;

  @Column({ type: "varchar" })
  toLocation!: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
  })
  fromLatitude!: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
  })
  fromLongitude!: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
  })
  toLatitude!: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
  })
  toLongitude!: number;

  @Column({ type: "timestamp" })
  departureTime!: Date;

  @Column({ type: "int", default: 1 })
  availableSeats!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  cost!: number;

  @Column({ type: "text", nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
