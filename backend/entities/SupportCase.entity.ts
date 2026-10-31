import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User.entity";
import { SupportCaseMessage } from "./SupportCaseMessage.entity";
import { SupportAgent } from "./SupportAgent.entity";

export enum SupportCasePriority {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum SupportCaseStatus {
  OPEN = "OPEN",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  WAITING_FOR_USER = "WAITING_FOR_USER",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

@Entity("support_cases")
export class SupportCase {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({
    name: "caseNumber",
    type: "varchar",
    length: 50,
    unique: true,
  })
  caseNumber!: string;

  @Index()
  @Column({
    name: "userId",
    type: "uuid",
  })
  userId!: string;

  @ManyToOne(() => User, (user) => (user as any).supportCases, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "userId",
  })
  user!: User;

  @Index()
  @Column({
    name: "chatSessionId",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  chatSessionId?: string | null;

  @Column({
    type: "varchar",
    length: 100,
  })
  category!: string;

  @Column({
    name: "issueType",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  issueType?: string | null;

  @Column({
    type: "varchar",
    length: 200,
  })
  subject!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  description?: string | null;

  @Index()
  @Column({
    type: "varchar",
    length: 20,
    default: SupportCasePriority.MEDIUM,
  })
  priority!: SupportCasePriority;

  @Index()
  @Column({
    type: "varchar",
    length: 30,
    default: SupportCaseStatus.OPEN,
  })
  status!: SupportCaseStatus;

  @Index()
  @Column({
    name: "assignedAgentId",
    type: "uuid",
    nullable: true,
  })
  assignedAgentId?: string | null;

  @ManyToOne(() => SupportAgent, (agent) => agent.assignedCases, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({
    name: "assignedAgentId",
  })
  assignedAgent?: SupportAgent | null;

  @Column({
    name: "relatedEntityType",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  relatedEntityType?: string | null;

  @Index()
  @Column({
    name: "relatedEntityId",
    type: "uuid",
    nullable: true,
  })
  relatedEntityId?: string | null;

  @CreateDateColumn({
    name: "createdAt",
    type: "timestamp",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updatedAt",
    type: "timestamp",
  })
  updatedAt!: Date;

  @Column({
    name: "resolvedAt",
    type: "timestamp",
    nullable: true,
  })
  resolvedAt?: Date | null;

  @Column({
    name: "closedAt",
    type: "timestamp",
    nullable: true,
  })
  closedAt?: Date | null;

  @OneToMany(() => SupportCaseMessage, (msg) => msg.case)
  messages!: SupportCaseMessage[];
}
