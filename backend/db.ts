import "reflect-metadata";
import {
  DataSource,
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./db/entities/User.entity";
import { Activity } from "./db/entities/Activity.entity";
import { DeviceSession } from "./db/entities/DeviceSession.entity";
import { Message } from "./db/entities/Message.entity";
import { Ticket } from "./db/entities/Ticket.entity";
import { uuidv4 } from "zod";

@Entity("users")
export class DbUser {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar" })
  email!: string;

  @Column({ type: "varchar" })
  avatar!: string;

  @Column({ type: "boolean", default: true })
  isVerified!: boolean;

  @Column({ type: "float", default: 5.0 })
  rating!: number;

  @Column({ type: "float", default: 0.0 })
  walletBalance!: number;
}

@Entity("activities")
export class DbActivity {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar" })
  category!: string;

  @Column({ type: "varchar" })
  organizerId!: string;

  @Column({ type: "varchar" })
  datetime!: string;

  @Column({ type: "varchar" })
  location!: string;

  @Column({ type: "float", default: 0.0 })
  cost!: number;

  @Column({ type: "int", default: 6 })
  maxParticipants!: number;

  @Column({ type: "int", default: 6 })
  remainingSeats!: number;

  @Column({ type: "simple-array", nullable: true })
  tags!: string[];

  @Column({ type: "varchar" })
  distance!: string;

  // Track joined user IDs as simple-array for simplicity and performance
  @Column({ type: "simple-array", nullable: true })
  participantIds!: string[];
}

@Entity("tickets")
export class DbTicket {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  eventName!: string;

  @Column({ type: "varchar" })
  date!: string;

  @Column({ type: "varchar" })
  category!: string;

  @Column({ type: "float" })
  price!: number;

  @Column({ type: "float", nullable: true })
  originalPrice?: number;

  @Column({ type: "varchar" })
  section!: string;

  @Column({ type: "varchar" })
  row!: string;

  @Column({ type: "varchar" })
  sellerId!: string;

  @Column({ type: "boolean", default: false })
  isSold!: boolean;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar" })
  qrCode!: string;
}

@Entity("messages")
export class DbMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  chatId!: string;

  @Column({ type: "varchar" })
  senderId!: string;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn()
  timestamp!: Date;
}

@Entity("notifications")
export class DbNotification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar" })
  type!: string; // 'activity' | 'ticket' | 'system'

  @Column({ type: "boolean", default: false })
  read!: boolean;

  @CreateDateColumn()
  timestamp!: Date;
}

@Entity("audit_logs")
export class DbAuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  userId!: string;

  @Column({ type: "varchar" })
  action!: string;

  @Column({ type: "text" })
  details!: string;

  @CreateDateColumn()
  timestamp!: Date;
}

@Entity("devices")
export class DbDevice {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  userId!: string;

  @Column({ type: "varchar" })
  deviceId!: string;

  @Column({ type: "varchar" })
  platform!: string;

  @Column({ type: "varchar" })
  deviceName!: string;

  @Column({ type: "varchar" })
  operatingSystem!: string;

  @Column({ type: "varchar" })
  browser!: string;

  @Column({ type: "varchar" })
  ipAddress!: string;

  @Column({ type: "varchar" })
  country!: string;

  @Column({ type: "varchar" })
  city!: string;

  @Column({ type: "boolean", default: true })
  activeSession!: boolean;

  @Column({ type: "varchar" })
  lastSeen!: string;
}

@Entity("login_history")
export class DbLoginHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  userId!: string;

  @Column({ type: "varchar" })
  loginTime!: string;

  @Column({ type: "varchar" })
  loginMethod!: string;

  @Column({ type: "varchar" })
  platform!: string;

  @Column({ type: "varchar" })
  ipAddress!: string;

  @Column({ type: "varchar" })
  country!: string;

  @Column({ type: "varchar" })
  city!: string;

  @Column({ type: "boolean", default: true })
  success!: boolean;
}

// Check environment settings to initialize the real PostgreSQL DataSource
const dbHost = process.env.PGHOST || process.env.DB_HOST;
const dbPort = parseInt(process.env.PGPORT || process.env.DB_PORT || "5432");
const dbUser = process.env.PGUSER || process.env.DB_USER;
const dbPassword = process.env.PGPASSWORD || process.env.DB_PASSWORD;
const dbName = process.env.PGDATABASE || process.env.DB_NAME;
const dbUrl = process.env.DATABASE_URL;

export let AppDataSource: DataSource | null = null;
let isConnectedToPostgres = false;

if (dbUrl || (dbHost && dbUser && dbPassword)) {
  try {
    AppDataSource = new DataSource({
      type: "postgres",
      url: dbUrl,
      host: dbHost,
      port: dbPort,
      username: dbUser,
      password: dbPassword,
      database: dbName,
      synchronize: true, // Auto create/update schema in sandbox/dev env
      logging: false,
      entities: [
        DbUser,
        DbActivity,
        DbTicket,
        DbMessage,
        DbNotification,
        DbAuditLog,
        DbDevice,
        DbLoginHistory,
      ],
    });
  } catch (err) {
    console.error("Failed to construct PostgreSQL DataSource:", err);
  }
}

// Users
const USER_1 = "11111111-1111-4111-8111-111111111111";
const USER_2 = "22222222-2222-4222-8222-222222222222";
const USER_3 = "33333333-3333-4333-8333-333333333333";
const USER_4 = "44444444-4444-4444-8444-444444444444";
const USER_5 = "55555555-5555-4555-8555-555555555555";
// Fallback dynamic database helper utilizing localized in-memory arrays when Postgres is not bound
class InMemoryDbStore {
  users: DbUser[] = [];
  activities: DbActivity[] = [];
  tickets: DbTicket[] = [];
  messages: DbMessage[] = [];
  notifications: DbNotification[] = [];
  auditLogs: DbAuditLog[] = [];
  devices: DbDevice[] = [];
  loginHistories: DbLoginHistory[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    this.users = [
      {
        id: USER_1,
        name: "Elena Vance",
        email: "elena@daymates.com",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        isVerified: true,
        rating: 4.9,
        walletBalance: 240.0,
      },
      {
        id: USER_2,
        name: "Rahul G.",
        email: "rahul@daymates.com",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        isVerified: true,
        rating: 4.8,
        walletBalance: 0.0,
      },
      {
        id: USER_3,
        name: "Marcus Chen",
        email: "marcus@daymates.com",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        isVerified: true,
        rating: 4.7,
        walletBalance: 0.0,
      },
      {
        id: USER_4,
        name: "Sarah Jenkins",
        email: "sarah@daymates.com",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        isVerified: true,
        rating: 4.9,
        walletBalance: 0.0,
      },
      {
        id: USER_5,
        name: "Alex Carter",
        email: "alex@daymates.com",
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        isVerified: true,
        rating: 4.9,
        walletBalance: 0.0,
      },
    ];

    this.activities = [
      {
        id: "act-1",
        title: "Cricket Match",
        description:
          "Need 2 more for a friendly match at Central Park Grounds.",
        category: "Sports",
        organizerId: USER_2,
        datetime: "2026-07-01T16:00:00-07:00",
        location: "Central Park Grounds",
        cost: 0.0,
        maxParticipants: 11,
        remainingSeats: 2,
        tags: ["Cricket", "Match", "Sports"],
        participantIds: [USER_1, USER_3, USER_4],
        distance: "0.4km away",
      },
      {
        id: "act-2",
        title: "Coffee & Networking",
        description: "At Blue Tokai. Talking about React 19 and AI startups.",
        category: "Coffee",
        organizerId: USER_1,
        datetime: "2026-07-01T11:00:00-07:00",
        location: "Blue Tokai",
        cost: 0.0,
        maxParticipants: 6,
        remainingSeats: 3,
        tags: ["Coffee", "Networking", "React", "AI"],
        participantIds: [USER_2, USER_3],
        distance: "1.2km away",
      },
      {
        id: "act-3",
        title: "Lunch Company",
        description: "Grabbing Pizza at Leo's. Open for 1 or 2 more people!",
        category: "Food",
        organizerId: USER_3,
        datetime: "2026-07-01T13:00:00-07:00",
        location: "Leo's Pizza",
        cost: 0.0,
        maxParticipants: 4,
        remainingSeats: 2,
        tags: ["Pizza", "Lunch", "Food"],
        participantIds: [USER_4],
        distance: "Near you",
      },
    ];

    this.tickets = [
      {
        id: "tkt-1",
        eventName: "Superman (IMAX)",
        date: "2026-07-02T19:30:00-07:00",
        category: "Movie",
        price: 180.0,
        originalPrice: 300.0,
        section: "Row F",
        row: "Seat 12",
        sellerId: USER_2,
        isSold: false,
        description: "1 Ticket • Row F, Seat 12",
        qrCode: "SUPERMAN-IMAX-0938-SECURE-SCAN",
      },
      {
        id: "tkt-2",
        eventName: "F1 Grand Prix (Zone A)",
        date: "2026-10-23T10:00:00-07:00",
        category: "Sports",
        price: 950.0,
        originalPrice: 1200.0,
        section: "Zone A",
        row: "Prime View",
        sellerId: USER_4,
        isSold: false,
        description: "2 Tickets • Prime View",
        qrCode: "F1-COTA-GP-ZONE-A-9238",
      },
      {
        id: "tkt-3",
        eventName: "Standup: Bassi Live",
        date: "2026-08-05T20:00:00-07:00",
        category: "Comedy",
        price: 400.0,
        originalPrice: 500.0,
        section: "Front Row Seat",
        row: "Starts 8 PM",
        sellerId: USER_3,
        isSold: false,
        description: "Front Row Seat • Starts 8 PM",
        qrCode: "BASSI-LIVE-8492",
      },
    ];

    this.messages = [
      {
        id: "msg-1",
        chatId: "act-1",
        senderId: USER_1,
        content:
          "Welcome everyone! Super excited for this pour-over tasting. I will stand near the coffee brewing counter wearing a teal shirt.",
        timestamp: new Date("2026-06-29T10:15:00-07:00"),
      },
      {
        id: "msg-2",
        chatId: "act-1",
        senderId: USER_2,
        content:
          "Awesome, Elena! I will be there at 2:35, looking forward to it.",
        timestamp: new Date("2026-06-29T10:20:00-07:00"),
      },
      {
        id: "msg-3",
        chatId: "tkt-1",
        senderId: USER_1,
        content:
          "Hi there! Yes, the Coldplay ticket is still available. Feel free to purchase it instantly, the funds will sit in trust until you scan the QR at entry.",
        timestamp: new Date("2026-06-29T09:30:00-07:00"),
      },
    ];

    this.notifications = [
      {
        id: "notif-1",
        title: "Activity Starting Soon",
        message:
          "Specialty Coffee Tasting starts in 3 hours! Head over to Mint Plaza.",
        timestamp: new Date("2026-06-29T11:30:00-07:00"),
        type: "activity",
        read: false,
      },
      {
        id: "notif-2",
        title: "New Ticket Available",
        message:
          "A new Coldplay - Music of the Spheres ticket listing has been created in Concerts.",
        timestamp: new Date("2026-06-29T08:00:00-07:00"),
        type: "ticket",
        read: true,
      },
    ];

    this.devices = [
      {
        id: "dev-1",
        userId: USER_1,
        deviceId: "web-chrome-sf",
        platform: "WEB",
        deviceName: "Chrome on macOS (Current)",
        operatingSystem: "macOS Sonoma",
        browser: "Chrome",
        ipAddress: "192.168.1.104",
        country: "United States",
        city: "San Francisco",
        activeSession: true,
        lastSeen: new Date().toISOString(),
      },
    ];

    this.loginHistories = [];
  }
}

export const inMemoryStore = new InMemoryDbStore();

// Initialize TypeORM or fallback seamlessly
export async function initializeDatabase() {
  if (AppDataSource) {
    try {
      await AppDataSource.initialize();
      isConnectedToPostgres = true;
      console.log("TypeORM: Successfully connected to PostgreSQL Database!");

      // Auto seed default values if users table is empty
      const userRepo = AppDataSource.getRepository(User);
      const count = await userRepo.count();
      if (count === 0) {
        console.log(
          "TypeORM: Seeding default mock datasets into PostgreSQL...",
        );
        await userRepo.save(inMemoryStore.users);
        await AppDataSource.getRepository(Activity).save(
          inMemoryStore.activities,
        );
        await AppDataSource.getRepository(Ticket).save(inMemoryStore.tickets);
        await AppDataSource.getRepository(Message).save(inMemoryStore.messages);
        await AppDataSource.getRepository(Notification).save(
          inMemoryStore.notifications,
        );
        await AppDataSource.getRepository(DeviceSession).save(
          inMemoryStore.devices,
        );
      }
      return;
    } catch (err) {
      console.error(
        "TypeORM: Failed to connect to PostgreSQL. Using high-fidelity in-memory model fallback.",
        err,
      );
    }
  } else {
    console.log(
      "TypeORM: No PostgreSQL configuration environment variables found. Using high-fidelity in-memory fallback.",
    );
  }
}

// Database query proxy mapping to PostgreSQL (using TypeORM) or to the in-memory fallback
export const db = {
  getIsConnected: () => isConnectedToPostgres,

  users: {
    find: async () => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbUser).find();
      }
      return inMemoryStore.users;
    },
    findOne: async (id: string) => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbUser).findOneBy({ id });
      }
      return inMemoryStore.users.find((u) => u.id === id) || null;
    },
    save: async (user: DbUser) => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbUser).save(user);
      }
      const existingIdx = inMemoryStore.users.findIndex(
        (u) => u.id === user.id,
      );
      if (existingIdx >= 0) {
        inMemoryStore.users[existingIdx] = user;
      } else {
        inMemoryStore.users.push(user);
      }
      return user;
    },
  },

  activities: {
    find: async () => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbActivity).find();
      }
      return inMemoryStore.activities;
    },
    findOne: async (id: string) => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbActivity).findOneBy({ id });
      }
      return inMemoryStore.activities.find((a) => a.id === id) || null;
    },
    save: async (activity: DbActivity) => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbActivity).save(activity);
      }
      const existingIdx = inMemoryStore.activities.findIndex(
        (a) => a.id === activity.id,
      );
      if (existingIdx >= 0) {
        inMemoryStore.activities[existingIdx] = activity;
      } else {
        inMemoryStore.activities.push(activity);
      }
      return activity;
    },
  },

  tickets: {
    find: async () => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbTicket).find();
      }
      return inMemoryStore.tickets;
    },
    findOne: async (id: string) => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbTicket).findOneBy({ id });
      }
      return inMemoryStore.tickets.find((t) => t.id === id) || null;
    },
    save: async (ticket: DbTicket) => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbTicket).save(ticket);
      }
      const existingIdx = inMemoryStore.tickets.findIndex(
        (t) => t.id === ticket.id,
      );
      if (existingIdx >= 0) {
        inMemoryStore.tickets[existingIdx] = ticket;
      } else {
        inMemoryStore.tickets.push(ticket);
      }
      return ticket;
    },
  },

  messages: {
    find: async (chatId?: string) => {
      if (isConnectedToPostgres && AppDataSource) {
        const repo = AppDataSource.getRepository(DbMessage);
        return chatId ? await repo.findBy({ chatId }) : await repo.find();
      }
      return chatId
        ? inMemoryStore.messages.filter((m) => m.chatId === chatId)
        : inMemoryStore.messages;
    },
    save: async (msg: DbMessage) => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbMessage).save(msg);
      }
      inMemoryStore.messages.push(msg);
      return msg;
    },
  },

  notifications: {
    find: async () => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbNotification).find({
          order: { timestamp: "DESC" },
        });
      }
      return [...inMemoryStore.notifications].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );
    },
    save: async (notif: DbNotification) => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbNotification).save(notif);
      }
      inMemoryStore.notifications.push(notif);
      return notif;
    },
    markAllRead: async () => {
      if (isConnectedToPostgres && AppDataSource) {
        await AppDataSource.getRepository(DbNotification).update(
          {},
          { read: true },
        );
        return;
      }
      inMemoryStore.notifications.forEach((n) => (n.read = true));
    },
  },

  auditLogs: {
    find: async () => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbAuditLog).find({
          order: { timestamp: "DESC" },
        });
      }
      return [...inMemoryStore.auditLogs].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );
    },
    save: async (log: DbAuditLog) => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbAuditLog).save(log);
      }
      inMemoryStore.auditLogs.push(log);
      return log;
    },
  },

  devices: {
    find: async () => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbDevice).find();
      }
      return inMemoryStore.devices;
    },
    save: async (device: DbDevice) => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbDevice).save(device);
      }
      const existingIdx = inMemoryStore.devices.findIndex(
        (d) => d.deviceId === device.deviceId,
      );
      if (existingIdx >= 0) {
        inMemoryStore.devices[existingIdx] = device;
      } else {
        inMemoryStore.devices.push(device);
      }
      return device;
    },
    delete: async (id: string) => {
      if (isConnectedToPostgres && AppDataSource) {
        await AppDataSource.getRepository(DbDevice).delete(id);
        return;
      }
      inMemoryStore.devices = inMemoryStore.devices.filter((d) => d.id !== id);
    },
    clearAll: async () => {
      if (isConnectedToPostgres && AppDataSource) {
        await AppDataSource.getRepository(DbDevice).clear();
        return;
      }
      inMemoryStore.devices = [];
    },
  },

  loginHistories: {
    find: async () => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbLoginHistory).find({
          order: { loginTime: "DESC" },
        });
      }
      return inMemoryStore.loginHistories;
    },
    save: async (history: DbLoginHistory) => {
      if (isConnectedToPostgres && AppDataSource) {
        return await AppDataSource.getRepository(DbLoginHistory).save(history);
      }
      inMemoryStore.loginHistories.push(history);
      return history;
    },
  },
};
