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

export type ServiceCluster = "fix" | "glam" | "home" | "auto" | string;

/**
 * Unified entity for all local services and doorstep experts:
 * - Table: "local_services"
 * - Technicians (electricians, plumbers, AC repair, carpenters, mechanics)
 * - Beauty & Grooming Experts (bridal makeup, facials, waxing, mehendi, hair styling)
 * - Home Helpers (deep cleaning, maids, home cooks, pest control, movers)
 * - Auto Pros (bike repair, car repair, puncture, car wash, roadside help)
 */
@Entity("local_services")
export class LocalService {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  providerId?: string;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "providerId" })
  provider?: User;

  // Professional / Agency Name (e.g., "Ramesh Electricals", "Rashmi Bridal Makeovers")
  @Column({ type: "varchar", length: 150 })
  name!: string;

  // Title getter/setter for compatibility
  // get title(): string {
  //   return this.name;
  // }
  // set title(val: string) {
  //   this.name = val;
  // }

  // Cluster grouping: "fix" (technicians), "glam" (beauty/makeup), "home" (home help), "auto" (mechanics)
  @Index()
  @Column({ type: "varchar", length: 50, default: "fix" })
  cluster!: ServiceCluster;

  // Specific service category (e.g., "Electrician", "Bridal Makeup", "Bike Repair", "Deep Cleaning")
  @Index()
  @Column({ type: "varchar", length: 100 })
  category!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ type: "varchar", length: 150, nullable: true })
  locationName?: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude?: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude?: number;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  experience?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  rate?: string;

  @Column({ type: "varchar", length: 50, default: "#EA580C" })
  avatarBg?: string;

  @Column({ type: "varchar", length: 50, default: "construct" })
  categoryIcon?: string;

  @Column({ type: "boolean", default: true })
  availableToday?: boolean;

  @Column({ type: "boolean", default: true })
  verified?: boolean;

  @Column({ type: "decimal", precision: 3, scale: 2, default: 5.0 })
  rating?: number;

  @Column({ type: "int", default: 1 })
  reviewsCount?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// ServiceProvider alias pointing directly to LocalService
export const ServiceProvider = LocalService;
export type ServiceProvider = LocalService;
