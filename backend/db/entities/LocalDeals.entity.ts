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
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "varchar" })
  businessName!: string;

  @Column({ type: "varchar", nullable: true })
  category?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  dealPrice?: number;

  @Column({ type: "timestamp", nullable: true })
  validFrom?: Date;

  @Column({ type: "timestamp", nullable: true })
  validUntil?: Date;

  @Column({ type: "varchar" })
  locationName!: string;

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
