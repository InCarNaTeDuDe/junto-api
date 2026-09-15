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

@Entity("local_deals")
export class LocalDeal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "varchar", length: 150, default: "" })
  businessName!: string;

  @Column({ type: "varchar", length: 150, default: "" })
  sellerName!: string;

  @Column({ type: "varchar", length: 50, default: "" })
  sellerPhone!: string;

  @Column({ type: "varchar", length: 20, default: "#3B82F6" })
  sellerAvatarBg!: string;

  @Column({ type: "decimal", precision: 2, scale: 1, default: 5.0 })
  sellerRating!: number;

  @Column({ type: "varchar", length: 80, nullable: true })
  category?: string;

  @Column({ type: "varchar", length: 50, default: "" })
  price!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  dealPrice?: number;

  @Column({ type: "varchar", length: 50, default: "Like New" })
  condition!: string;

  @Column({ type: "timestamp", nullable: true })
  validFrom?: Date;

  @Column({ type: "timestamp", nullable: true })
  validUntil?: Date;

  @Column({ type: "varchar", length: 150, default: "" })
  locationName!: string;

  @Column({ type: "varchar", length: 100, nullable: true, default: "" })
  distance?: string;

  @Index()
  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude?: number;

  @Index()
  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude?: number;

  @Column({
    type: "text",
    default:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
  })
  image!: string;

  @Column({ type: "boolean", default: true })
  verified!: boolean;

  @Column({ type: "int", default: 1 })
  views!: number;

  @Column({ type: "varchar", length: 30, default: "available" })
  status!: "available" | "reserved" | "sold";

  @Column({
    type: "jsonb",
    default: () => "'[]'",
  })
  inquiries!: Array<{
    id: string;
    buyerId: string;
    buyerName: string;
    buyerPhone: string;
    buyerAvatar?: string;
    message: string;
    offeredPrice?: string;
    createdAt: string;
  }>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
