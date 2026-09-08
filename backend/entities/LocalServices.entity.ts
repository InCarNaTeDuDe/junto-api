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

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "varchar" })
  category!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ type: "varchar", nullable: true })
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

  @Column({ type: "varchar", nullable: true })
  phone?: string;

  @Column({ type: "varchar", nullable: true })
  experience?: string;

  @Column({ type: "varchar", nullable: true })
  rate?: string;

  @Column({ type: "varchar", nullable: true })
  avatarBg?: string;

  @Column({ type: "varchar", nullable: true })
  categoryIcon?: string;

  @Column({ type: "boolean", default: true })
  availableToday?: boolean;

  @Column({ type: "boolean", default: true })
  verified?: boolean;

  @Column({ type: "decimal", precision: 3, scale: 1, default: 5.0 })
  rating?: number;

  @Column({ type: "int", default: 1 })
  reviewsCount?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
