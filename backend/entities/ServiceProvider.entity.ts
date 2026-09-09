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
 * Unified entity for all local service professionals:
 * - Technicians (electricians, plumbers, AC repair, carpenters, appliance mechanics)
 * - Beauty & Grooming Experts (bridal makeup, facials, waxing, mehendi, hair styling, nails)
 * - Home Helpers (deep cleaning, maids, home cooks, pest control, packers & movers)
 * - Mechanics & Auto Pros (bike repair, car repair, puncture, car wash, roadside assistance)
 */
@Entity("service_providers")
export class ServiceProvider {
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

  // Professional / Business Name (e.g., "Suresh Kumar", "Ananya Makeover Studio", "Rajesh Auto Works")
  @Column({ type: "varchar", length: 150 })
  name!: string;

  // Title getter/setter for compatibility with legacy LocalService
  get title(): string {
    return this.name;
  }
  set title(val: string) {
    this.name = val;
  }

  // Cluster grouping: "fix" (technicians), "glam" (beauty/makeup), "home" (home help), "auto" (mechanics)
  @Index()
  @Column({ type: "varchar", length: 50, default: "fix" })
  cluster!: ServiceCluster;

  // Specific service category (e.g., "Electrician", "Bridal makeup", "Bike repair", "Deep cleaning")
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

// Alias for backward compatibility
export const LocalService = ServiceProvider;
export type LocalService = ServiceProvider;
