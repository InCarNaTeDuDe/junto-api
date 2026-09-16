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
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // ⚠️ Prefer false in production and migrations instead.
  // synchronize: process.env.NODE_ENV !== "production",
  synchronize: true,

  logging: false,

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

  // --------------------------------------------------
  // CONNECTION TIMEOUT
  // --------------------------------------------------
  // Maximum time to establish a PostgreSQL connection.
  // 5 seconds is reasonable for a cloud-hosted API.
  connectTimeoutMS: 5000,

  // --------------------------------------------------
  // TYPEORM SLOW QUERY DETECTION
  // --------------------------------------------------
  // Logs queries taking > 2 seconds.
  //
  // IMPORTANT:
  // This does NOT terminate the query.
  maxQueryExecutionTime: 2000,

  // --------------------------------------------------
  // CONNECTION POOL
  // --------------------------------------------------
  poolSize: 10,

  // --------------------------------------------------
  // POSTGRES / pg OPTIONS
  // --------------------------------------------------
  extra: {
    // How long pg waits to establish a connection.
    connectionTimeoutMillis: 5000,

    // Actually TERMINATE a PostgreSQL statement
    // running longer than 30 seconds.
    statement_timeout: 30000,

    // Kill transactions that remain idle for 60 seconds.
    idle_in_transaction_session_timeout: 60000,

    // Keep TCP connections alive.
    keepAlive: true,

    // Start TCP keepalive after 10 seconds.
    keepAliveInitialDelayMillis: 10000,

    // Useful when diagnosing connections in PostgreSQL.
    application_name: "junto-api",
  },
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
