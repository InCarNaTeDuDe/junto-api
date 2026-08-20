import { User } from "../db/entities/User.entity";
import {
  CreateServiceProInput,
  QueryServicesInput,
  BookServiceInput,
  UpdateBookingStatusInput,
} from "./localservices.schema";
import { io } from "../socket/socket";
import { sendExpoPushNotification } from "../notifications/notifications.service";

export interface ServiceProRecord {
  id: string;
  name: string;
  category: string;
  categoryIcon: string;
  rating: number;
  reviewsCount: number;
  experience: string;
  distance: string;
  rate: string;
  verified: boolean;
  avatarBg: string;
  phone: string;
  description?: string;
  availableToday: boolean;
  createdAt: string;
}

export interface ServiceBookingRecord {
  id: string;
  serviceProId: string;
  serviceProName: string;
  serviceCategory: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  preferredTime: string;
  issueDescription?: string;
  urgency: "emergency" | "today" | "scheduled";
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

let serviceProsStore: ServiceProRecord[] = [];

let bookingsStore: ServiceBookingRecord[] = [];

export async function listServicePros(query: QueryServicesInput) {
  let result = [...serviceProsStore];

  if (query.category && query.category !== "all") {
    const catLower = query.category.toLowerCase();
    result = result.filter(
      (p) =>
        p.category.toLowerCase().includes(catLower) ||
        (catLower === "ac" && p.category.toLowerCase().includes("ac")) ||
        (catLower === "mechanic" &&
          p.category.toLowerCase().includes("bike")) ||
        (catLower === "cleaning" && p.category.toLowerCase().includes("clean")),
    );
  }

  if (query.search) {
    const term = query.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)),
    );
  }

  if (query.verifiedOnly === "true") {
    result = result.filter((p) => p.verified);
  }

  if (query.minRating) {
    result = result.filter((p) => p.rating >= query.minRating!);
  }

  return result;
}

export async function getServiceProById(
  id: string,
): Promise<ServiceProRecord | null> {
  return serviceProsStore.find((p) => p.id === id) || null;
}

export async function createServicePro(
  input: CreateServiceProInput,
  user?: User | any,
): Promise<ServiceProRecord> {
  const newPro: ServiceProRecord = {
    id: `pro_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: input.name,
    category: input.category,
    categoryIcon: input.categoryIcon || "construct",
    rating: 5.0,
    reviewsCount: 1,
    experience: input.experience || "3+ yrs exp",
    distance: input.distance || "Near you",
    rate: input.rate || "From ₹150 visit",
    verified: input.verified ?? true,
    avatarBg: input.avatarBg || "#EA580C",
    phone: input.phone,
    description: input.description,
    availableToday: input.availableToday ?? true,
    createdAt: new Date().toISOString(),
  };

  serviceProsStore.unshift(newPro);

  if (io) {
    io.emit("service_pro_created", newPro);
    io.emit("service_pros_updated", serviceProsStore);
  }

  return newPro;
}

export async function bookService(
  serviceProId: string,
  input: BookServiceInput,
  user?: User | any,
): Promise<ServiceBookingRecord> {
  const pro = serviceProsStore.find((p) => p.id === serviceProId);
  if (!pro) {
    throw new Error("Service provider not found");
  }

  const newBooking: ServiceBookingRecord = {
    id: `bk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    serviceProId: pro.id,
    serviceProName: pro.name,
    serviceCategory: pro.category,
    clientId: user?.id || `client_${Date.now()}`,
    clientName: input.clientName,
    clientPhone: input.clientPhone,
    clientAddress: input.clientAddress,
    preferredTime: input.preferredTime,
    issueDescription: input.issueDescription,
    urgency: input.urgency || "today",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  bookingsStore.unshift(newBooking);

  // Real-time broadcast
  if (io) {
    io.emit("service_booking_created", newBooking);
  }

  return newBooking;
}

export async function listBookings(clientId?: string) {
  if (clientId) {
    return bookingsStore.filter((b) => b.clientId === clientId);
  }
  return bookingsStore;
}

export async function updateBookingStatus(
  bookingId: string,
  input: UpdateBookingStatusInput,
) {
  const bookingIndex = bookingsStore.findIndex((b) => b.id === bookingId);
  if (bookingIndex === -1) {
    throw new Error("Booking not found");
  }

  const booking = bookingsStore[bookingIndex];
  booking.status = input.status;
  booking.updatedAt = new Date().toISOString();
  bookingsStore[bookingIndex] = booking;

  if (io) {
    io.emit("service_booking_updated", booking);
  }

  return booking;
}
