import "reflect-metadata";
import { DataSource } from "typeorm";

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
  entities: [__dirname + "/entities/*.{ts,js}"],

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

    // const userRepo = AppDataSource.getRepository(User);

    // if ((await userRepo.count()) === 0) {
    //   console.log("TypeORM: Seeding initial mock data...");

    //   await userRepo.save(inMemoryStore.users);

    //   await AppDataSource.getRepository(Activity).save(
    //     inMemoryStore.activities,
    //   );

    //   await AppDataSource.getRepository(Ticket).save(inMemoryStore.tickets);

    //   await AppDataSource.getRepository(Message).save(inMemoryStore.messages);

    //   await AppDataSource.getRepository(Notification).save(
    //     inMemoryStore.notifications,
    //   );

    //   await AppDataSource.getRepository(DeviceSession).save(
    //     inMemoryStore.devices,
    //   );

    //   await AppDataSource.getRepository(LoginHistory).save(
    //     inMemoryStore.loginHistories,
    //   );

    //   await AppDataSource.getRepository(AuditLog).save(inMemoryStore.auditLogs);
    // }
  } catch (err) {
    console.error(
      "TypeORM: Failed to connect. Falling back to in-memory database.",
      err,
    );

    isConnectedToPostgres = false;
  }
}
