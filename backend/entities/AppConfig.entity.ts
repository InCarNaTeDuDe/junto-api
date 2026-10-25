import "reflect-metadata";
import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("app_config")
export class AppConfig {
  @PrimaryColumn({ type: "varchar", length: 64, default: "default" })
  id!: string;

  @Column({ type: "boolean", default: true })
  enableRides!: boolean;

  @Column({ type: "boolean", default: true })
  enableTicketSelling!: boolean;

  @Column({ type: "boolean", default: true })
  enableDaymates!: boolean;

  @Column({ type: "boolean", default: true })
  enableServices!: boolean;

  @Column({ type: "boolean", default: true })
  enableGlamup!: boolean;

  @Column({ type: "boolean", default: true })
  enableDeals!: boolean;

  @Column({ type: "boolean", default: true })
  enableAskNearby!: boolean;

  @Column({ type: "boolean", default: true })
  enableChats!: boolean;

  @Column({ type: "boolean", default: true })
  enableUniversalNeed!: boolean;

  @Column({ type: "boolean", default: false })
  maintenanceMode!: boolean;

  @Column({
    type: "text",
    default:
      "We are currently performing scheduled maintenance to improve your experience. We will be back shortly!",
  })
  maintenanceMessage!: string;

  @Column({ type: "varchar", length: 32, default: "1.0.0" })
  minAppVersion!: string;

  @Column({ type: "varchar", length: 32, default: "1.0.0" })
  latestAppVersion!: string;

  @Column({ type: "boolean", default: true })
  otaUpdateEnabled!: boolean;

  @Column({ type: "text", nullable: true })
  noticeBanner!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
