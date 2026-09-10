import "reflect-metadata";
import { DataSource } from "typeorm";

import { User } from "../entities/User.entity";
import { AuditLog } from "../entities/AuditLog.entity";
import { LoginHistory } from "../entities/LoginHistory.entity";
import { DeviceSession } from "../entities/DeviceSession.entity";
import { Ticket } from "../entities/Ticket.entity";
import { Activity } from "../entities/Activity.entity";
import { Message } from "../entities/Message.entity";
import { Notification } from "../entities/Notification.entity";
import { Ride } from "../entities/Rides.entity";
import { LocalDeal } from "../entities/LocalDeals.entity";
import { LocalService } from "../entities/LocalServices.entity";
import { SupportChat } from "../entities/SupportChat.entity";

// import { inMemoryStore } from "../db"; // <-- adjust path if needed

export let isConnectedToPostgres = false;

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true,
  // synchronize: process.env.NODE_ENV !== "production", // Dev Only
  // migrationsRun: process.env.NODE_ENV === "production",
  logging: false,
  // dropSchema: true,
  entities: [
    User,
    DeviceSession,
    LoginHistory,
    AuditLog,
    Activity,
    Ticket,
    Notification,
    Message,
    Ride,
    LocalDeal,
    LocalService,
    SupportChat,
  ],
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export async function initializeDatabase() {
  const hasPostgresConfig =
    process.env.DB_HOST &&
    process.env.DB_PORT &&
    process.env.DB_USERNAME &&
    process.env.DB_PASSWORD &&
    process.env.DB_DATABASE;

  if (!hasPostgresConfig) {
    console.log(
      "TypeORM: No PostgreSQL configuration found. Using in-memory database.",
    );
    return;
  }

  try {
    await AppDataSource.initialize();

    isConnectedToPostgres = true;

    console.log("TypeORM: Successfully connected to PostgreSQL.");
  } catch (err) {
    console.error("TypeORM: Failed to connect. ", err);

    isConnectedToPostgres = false;
  }
}
