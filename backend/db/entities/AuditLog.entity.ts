import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "varchar" })
  action!: string;

  @Column({ type: "text" })
  details!: string;

  @CreateDateColumn({
    type: "timestamp",
  })
  timestamp!: Date;
}
