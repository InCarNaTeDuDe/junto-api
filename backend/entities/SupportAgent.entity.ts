import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User.entity";
import { SupportCase } from "./SupportCase.entity";

export enum SupportAgentRole {
  OWNER = "OWNER",
  SUPPORT = "SUPPORT",
}

@Entity("support_agents")
export class SupportAgent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({
    name: "userId",
    type: "uuid",
    unique: true,
  })
  userId!: string;

  @OneToOne(() => User, (user) => (user as any).supportAgent, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "userId",
  })
  user!: User;

  @Column({
    type: "varchar",
    length: 20,
    default: SupportAgentRole.SUPPORT,
  })
  role!: SupportAgentRole;

  @Index()
  @Column({
    name: "isActive",
    type: "boolean",
    default: true,
  })
  isActive!: boolean;

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

  @OneToMany(() => SupportCase, (c) => c.assignedAgent)
  assignedCases!: SupportCase[];
}
