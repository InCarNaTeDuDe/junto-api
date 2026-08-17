import { User } from "../db/entities/User.entity";
import {
  CreateRideInput,
  QueryRideInput,
  JoinRideInput,
  UpdateRideInput,
} from "./rides.schema";
import { io } from "../socket/socket";
import { sendExpoPushNotification } from "../notifications/notifications.service";

export interface RideRecord {
  id: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  driverAvatarBg: string;
  driverAvatar?: string;
  from: string;
  to: string;
  time: string;
  vehicleType: "car" | "bike";
  seatsLeft: number;
  totalSeats: number;
  price: string;
  verified: boolean;
  notes?: string;
  status: "active" | "in_progress" | "completed" | "cancelled";
  passengers: Array<{
    userId: string;
    userName: string;
    seats: number;
    pickupPoint?: string;
    passengerPhone?: string;
    joinedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Initial realistic active neighborhood routes
let ridesStore: RideRecord[] = [
  {
    id: "r1",
    driverId: "user_vikram",
    driverName: "Vikram R.",
    driverRating: 4.9,
    driverAvatarBg: "#3B82F6",
    driverAvatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    from: "Madhapur (Mindspace)",
    to: "Gachibowli (DLF)",
    time: "Leaving in 10 mins",
    vehicleType: "car",
    seatsLeft: 2,
    totalSeats: 3,
    price: "₹40",
    verified: true,
    notes: "AC on • Music ok • UPI split",
    status: "active",
    passengers: [
      {
        userId: "user_p1",
        userName: "Sunil M.",
        seats: 1,
        pickupPoint: "Raheja Circle",
        joinedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "r2",
    driverId: "user_ananya",
    driverName: "Ananya S.",
    driverRating: 4.8,
    driverAvatarBg: "#EC4899",
    driverAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    from: "Hitec City Metro",
    to: "Financial District",
    time: "Leaving in 20 mins",
    vehicleType: "car",
    seatsLeft: 3,
    totalSeats: 4,
    price: "₹50",
    verified: true,
    notes: "Women passengers preferred/friendly",
    status: "active",
    passengers: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "r3",
    driverId: "user_karthik",
    driverName: "Karthik K.",
    driverRating: 5.0,
    driverAvatarBg: "#10B981",
    driverAvatar:
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    from: "Kondapur RTO",
    to: "Jubilee Hills Checkpost",
    time: "5:45 PM Today",
    vehicleType: "bike",
    seatsLeft: 1,
    totalSeats: 1,
    price: "Free",
    verified: true,
    notes: "Helmet provided • Quick commute",
    status: "active",
    passengers: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "r4",
    driverId: "user_rohit",
    driverName: "Rohit V.",
    driverRating: 4.7,
    driverAvatarBg: "#8B5CF6",
    driverAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    from: "Kukatpally Housing Board",
    to: "Inorbit Mall",
    time: "6:15 PM Today",
    vehicleType: "car",
    seatsLeft: 1,
    totalSeats: 3,
    price: "₹30",
    verified: false,
    notes: "Daily office route",
    status: "active",
    passengers: [
      {
        userId: "user_p2",
        userName: "Deepak T.",
        seats: 2,
        joinedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function listRides(query: QueryRideInput) {
  let result = [...ridesStore].filter(
    (r) => r.status === "active" || r.status === "in_progress",
  );

  if (query.vehicleType && query.vehicleType !== "all") {
    result = result.filter((r) => r.vehicleType === query.vehicleType);
  }

  if (query.search) {
    const term = query.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.from.toLowerCase().includes(term) ||
        r.to.toLowerCase().includes(term) ||
        r.driverName.toLowerCase().includes(term) ||
        (r.notes && r.notes.toLowerCase().includes(term)),
    );
  }

  if (query.from) {
    const fromTerm = query.from.toLowerCase();
    result = result.filter((r) => r.from.toLowerCase().includes(fromTerm));
  }

  if (query.to) {
    const toTerm = query.to.toLowerCase();
    result = result.filter((r) => r.to.toLowerCase().includes(toTerm));
  }

  if (query.availableOnly === "true") {
    result = result.filter((r) => r.seatsLeft > 0);
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getRideById(id: string): Promise<RideRecord | null> {
  const ride = ridesStore.find((r) => r.id === id);
  return ride || null;
}

export async function createRide(
  input: CreateRideInput,
  user: User | any,
): Promise<RideRecord> {
  const newRide: RideRecord = {
    id: `ride_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    driverId: user?.id || `guest_${Date.now()}`,
    driverName: user?.name || "Neighbor Driver",
    driverRating: 5.0,
    driverAvatarBg: "#2563EB",
    driverAvatar:
      user?.avatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    from: input.from,
    to: input.to,
    time: input.time,
    vehicleType: input.vehicleType,
    seatsLeft: input.seatsLeft,
    totalSeats: input.seatsLeft,
    price: input.price,
    verified: input.verified ?? true,
    notes: input.notes,
    status: "active",
    passengers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  ridesStore.unshift(newRide);

  // Broadcast real-time Socket.IO event to all active clients
  if (io) {
    io.emit("ride_created", newRide);
    io.emit("rides_updated", ridesStore);
  }

  return newRide;
}

export async function joinRide(
  rideId: string,
  input: JoinRideInput,
  user: User | any,
): Promise<{ success: boolean; message: string; ride: RideRecord }> {
  const rideIndex = ridesStore.findIndex((r) => r.id === rideId);
  if (rideIndex === -1) {
    throw new Error("Ride not found");
  }

  const ride = ridesStore[rideIndex];

  if (ride.seatsLeft < input.seatsRequested) {
    throw new Error(`Only ${ride.seatsLeft} seat(s) remaining for this ride.`);
  }

  const passengerId = user?.id || `passenger_${Date.now()}`;
  const passengerName = user?.name || "Fellow Commuter";

  ride.seatsLeft -= input.seatsRequested;
  ride.passengers.push({
    userId: passengerId,
    userName: passengerName,
    seats: input.seatsRequested,
    pickupPoint: input.pickupPoint,
    passengerPhone: input.passengerPhone,
    joinedAt: new Date().toISOString(),
  });
  ride.updatedAt = new Date().toISOString();

  ridesStore[rideIndex] = ride;

  // Real-time broadcast
  if (io) {
    io.emit("ride_updated", ride);
    io.to(`user:${ride.driverId}`).emit("ride_booked", {
      rideId: ride.id,
      passengerName,
      seats: input.seatsRequested,
      from: ride.from,
      to: ride.to,
    });
  }

  // Push notification to driver if available
  if (
    ride.driverId &&
    !ride.driverId.startsWith("guest_") &&
    !ride.driverId.startsWith("user_")
  ) {
    sendExpoPushNotification(
      ride.driverId,
      "🚗 Ride Booking Request",
      `${passengerName} booked ${input.seatsRequested} seat(s) for ${ride.from} ➔ ${ride.to}`,
      { rideId: ride.id, type: "ride_booked" },
    ).catch(() => {});
  }

  return {
    success: true,
    message: `Successfully booked ${input.seatsRequested} seat(s) with ${ride.driverName}!`,
    ride,
  };
}

export async function updateRide(
  rideId: string,
  input: UpdateRideInput,
  user: User | any,
): Promise<RideRecord> {
  const rideIndex = ridesStore.findIndex((r) => r.id === rideId);
  if (rideIndex === -1) {
    throw new Error("Ride not found");
  }

  const ride = ridesStore[rideIndex];
  if (ride.driverId !== user.id && !user.id?.includes("admin")) {
    throw new Error("Unauthorized to modify this ride");
  }

  if (input.status) ride.status = input.status;
  if (input.seatsLeft !== undefined) ride.seatsLeft = input.seatsLeft;
  if (input.notes) ride.notes = input.notes;
  ride.updatedAt = new Date().toISOString();

  ridesStore[rideIndex] = ride;

  if (io) {
    io.emit("ride_updated", ride);
  }

  return ride;
}

export async function getMyRides(userId: string) {
  const driving = ridesStore.filter((r) => r.driverId === userId);
  const riding = ridesStore.filter((r) =>
    r.passengers.some((p) => p.userId === userId),
  );
  return { driving, riding };
}
