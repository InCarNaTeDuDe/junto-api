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

let serviceProsStore: ServiceProRecord[] = [
  {
    id: "p1",
    name: "Ramesh Electric Works",
    category: "Electrician",
    categoryIcon: "flash",
    rating: 4.9,
    reviewsCount: 38,
    experience: "7+ yrs exp",
    distance: "0.8 km away",
    rate: "From ₹150 visit",
    verified: true,
    avatarBg: "#EA580C",
    phone: "+91 98480 12345",
    description:
      "Doorstep fan, switchboard, fuse, short circuit and inverter wiring repair.",
    availableToday: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "p2",
    name: "Sri Balaji Plumbing Services",
    category: "Plumber",
    categoryIcon: "water",
    rating: 4.8,
    reviewsCount: 52,
    experience: "5+ yrs exp",
    distance: "1.2 km away",
    rate: "From ₹199 visit",
    verified: true,
    avatarBg: "#0284C7",
    phone: "+91 99887 65432",
    description:
      "Tap leakage, blockage removal, pipe fitting, water tank float valve fixing.",
    availableToday: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: "p3",
    name: "CoolPoint AC Deep Clean & Gas",
    category: "AC Repair",
    categoryIcon: "snow",
    rating: 4.9,
    reviewsCount: 84,
    experience: "8+ yrs exp",
    distance: "1.5 km away",
    rate: "From ₹399 service",
    verified: true,
    avatarBg: "#059669",
    phone: "+91 97000 88990",
    description:
      "Split & window AC power jet cleaning, gas charging (R32/R410), PCB diagnosis.",
    availableToday: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "p4",
    name: "QuickFix Two-Wheeler Doorstep",
    category: "Bike & Car",
    categoryIcon: "construct",
    rating: 4.7,
    reviewsCount: 29,
    experience: "4+ yrs exp",
    distance: "2.1 km away",
    rate: "From ₹250 puncher/oil",
    verified: true,
    avatarBg: "#9333EA",
    phone: "+91 91234 56789",
    description:
      "Doorstep bike puncture, battery jumpstart, clutch cable and general service.",
    availableToday: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
  },
  {
    id: "p5",
    name: "ShineClean House Deep Cleaning",
    category: "Home Clean",
    categoryIcon: "sparkles",
    rating: 4.8,
    reviewsCount: 41,
    experience: "6+ yrs exp",
    distance: "2.8 km away",
    rate: "From ₹699 / room",
    verified: true,
    avatarBg: "#E11D48",
    phone: "+91 93456 78901",
    description:
      "Bathroom descaling, kitchen deep degreasing, sofa shampooing and full home cleaning.",
    availableToday: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "p6",
    name: "Master Woodcraft & Furniture Fix",
    category: "Carpenter",
    categoryIcon: "hammer",
    rating: 4.9,
    reviewsCount: 19,
    experience: "10+ yrs exp",
    distance: "3.2 km away",
    rate: "From ₹299 visit",
    verified: true,
    avatarBg: "#D97706",
    phone: "+91 94567 89012",
    description:
      "Door hinge alignment, bed repair, modular kitchen drawer slides, lock replacement.",
    availableToday: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

let bookingsStore: ServiceBookingRecord[] = [
  {
    id: "bk_1",
    serviceProId: "p1",
    serviceProName: "Ramesh Electric Works",
    serviceCategory: "Electrician",
    clientId: "guest_demo",
    clientName: "Rahul Sharma",
    clientPhone: "+91 98765 43210",
    clientAddress: "Flat 304, Green Heights, Madhapur",
    preferredTime: "Today at 3:00 PM",
    issueDescription: "Main MCB tripping repeatedly when geyser turns on",
    urgency: "emergency",
    status: "accepted",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

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
