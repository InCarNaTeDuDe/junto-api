import {
  BeforeInsert,
  BeforeUpdate,
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
 * Standard clusters and canonical categories defined for LocalServices
 */
export const SERVICE_CLUSTERS = {
  AUTO: "auto",
  FIX: "fix",
  GLAM: "glam",
  HOME: "home",
} as const;

export const LOCAL_SERVICE_CATEGORIES = {
  // 🚗 Auto Pros & Mechanics
  AUTO: [
    "Bike repair",
    "Puncture",
    "Car repair",
    "Car wash",
    "Roadside assistance",
  ] as const,
  // 🔧 Fix & Home Technicians
  FIX: [
    "Electrician",
    "Plumber",
    "AC repair",
    "Washing machine repair",
    "Carpenter",
    "TV/electronics repair",
  ] as const,
  // 💄 GlamUp Beauty & Grooming
  GLAM: [
    "Bridal makeup",
    "Facial",
    "Mehendi",
    "Hair styling",
    "Nails & Art",
  ] as const,
  // 🧹 Home Help & Food
  HOME: [
    "Deep cleaning",
    "Cooking",
    "Pest-control requests",
    "Moving assistance",
    "Maids",
  ] as const,
};

/**
 * Robust helper to resolve cluster from category and description
 */
export function resolveServiceCluster(
  category?: string,
  description?: string,
  existingCluster?: string,
): ServiceCluster {
  const cat = (category || "").toLowerCase();
  const text = `${cat} ${description || ""}`.toLowerCase();

  // 1. Auto Pro / Bike / Mechanic domain
  if (
    cat.includes("bike") ||
    cat.includes("mechanic") ||
    cat.includes("puncture") ||
    cat.includes("car wash") ||
    cat.includes("roadside") ||
    cat.includes("car repair") ||
    cat.includes("two wheeler") ||
    cat.includes("scooter") ||
    cat.includes("motorcycle") ||
    /\b(bike|mechanic|puncture|auto|towing|scooter|activa|motorcycle)\b/i.test(
      cat,
    ) ||
    /\b(bike repair|mechanic|puncture repair|tubeless|bike servicing)\b/i.test(
      text,
    )
  ) {
    return SERVICE_CLUSTERS.AUTO;
  }

  // 2. Glam domain
  if (
    cat.includes("makeup") ||
    cat.includes("bridal") ||
    cat.includes("facial") ||
    cat.includes("mehendi") ||
    cat.includes("hair") ||
    cat.includes("nail") ||
    cat.includes("wax") ||
    cat.includes("glam") ||
    cat.includes("salon") ||
    cat.includes("beauty")
  ) {
    return SERVICE_CLUSTERS.GLAM;
  }

  // 3. Home Help domain
  if (
    cat.includes("clean") ||
    cat.includes("cook") ||
    cat.includes("tiffin") ||
    cat.includes("maid") ||
    cat.includes("pest") ||
    cat.includes("moving") ||
    cat.includes("packers")
  ) {
    return SERVICE_CLUSTERS.HOME;
  }

  // 4. If existing cluster is valid and non-fix, keep it
  if (
    existingCluster &&
    existingCluster !== SERVICE_CLUSTERS.FIX &&
    ["auto", "glam", "home"].includes(existingCluster.toLowerCase())
  ) {
    return existingCluster.toLowerCase() as ServiceCluster;
  }

  // 5. Default technicians/fix
  return SERVICE_CLUSTERS.FIX;
}

/**
 * Unified entity for all local services and doorstep experts:
 * - Table: "local_services"
 * - Technicians: electricians, plumbers, AC repair, carpenters, TV/appliance repair
 * - Beauty & Grooming: bridal makeup, facials, waxing, mehendi, hair styling
 * - Home Helpers: deep cleaning, maids, home cooks/tiffin, pest control, movers
 * - Auto Pros: bike repair, mechanics, puncture, car repair, car wash, roadside help
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

  // Professional / Agency Name (e.g., "Ramesh Electricals", "Rajesh Auto Works")
  @Column({ type: "varchar", length: 150 })
  name!: string;

  // Title compatibility getter/setter
  get title(): string {
    return this.name;
  }
  set title(val: string) {
    this.name = val;
  }

  // Cluster grouping: "auto" (mechanics/bike/puncture), "fix" (technicians), "glam" (beauty), "home" (cleaning/cooks)
  @Index()
  @Column({ type: "varchar", length: 50, default: "auto" })
  cluster!: ServiceCluster;

  // Specific service category (e.g., "Bike repair", "Electrician", "Bridal makeup", "Deep cleaning")
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

  @BeforeInsert()
  @BeforeUpdate()
  normalizeCluster() {
    this.cluster = resolveServiceCluster(
      this.category,
      this.description,
      this.cluster,
    );
    if (!this.name && (this as any).title) {
      this.name = (this as any).title;
    }
  }
}

// ServiceProvider alias pointing directly to LocalService
export const ServiceProvider = LocalService;
export type ServiceProvider = LocalService;
