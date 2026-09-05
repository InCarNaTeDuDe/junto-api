import { User } from "../entities/User.entity";
import {
  CreateRideInput,
  QueryRideInput,
  JoinRideInput,
  UpdateRideInput,
} from "./rides.schema";
import { io } from "../socket/socket";
import { sendExpoPushNotification } from "../notifications/notifications.service";
import { rideRepository, RideRecord } from "../repositories/Rides.repository";

/**
 * List rides
 */
export async function listRides(query: QueryRideInput): Promise<RideRecord[]> {
  const rides = await rideRepository.findAll();
  const search = query.search?.toLowerCase();
  const from = query.from?.toLowerCase();
  const to = query.to?.toLowerCase();
  const vehicleType =
    query.vehicleType && query.vehicleType !== "all" ? query.vehicleType : null;
  const availableOnly = query.availableOnly === "true";

  if (!search && !from && !to && !vehicleType && !availableOnly) {
    return rides;
  }

  return rides.filter((ride) => {
    if (vehicleType && ride.vehicleType !== vehicleType) return false;
    if (availableOnly && ride.seatsLeft <= 0) return false;
    if (from && !ride.from.toLowerCase().includes(from)) return false;
    if (to && !ride.to.toLowerCase().includes(to)) return false;
    if (
      search &&
      !ride.from.toLowerCase().includes(search) &&
      !ride.to.toLowerCase().includes(search) &&
      !ride.driverName.toLowerCase().includes(search) &&
      !ride.notes?.toLowerCase().includes(search)
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Get one ride by ID
 */
export async function getRideById(id: string): Promise<RideRecord | null> {
  return rideRepository.findById(id);
}

/**
 * Create a new ride
 */
export async function createRide(
  input: CreateRideInput,
  user: User,
): Promise<RideRecord> {
  if (!user?.id) {
    throw new Error("Authenticated user is required to create a ride.");
  }

  const ride = await rideRepository.createRide({
    driverId: user.id,

    driverName: user.name || "Neighbor Driver",

    driverRating: 5.0,

    driverAvatar:
      user.avatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",

    driverAvatarBg: "#2563EB",

    from: input.from,
    to: input.to,
    time: input.time,

    vehicleType: input.vehicleType,

    seatsLeft: input.seatsLeft,
    totalSeats: input.seatsLeft,

    price: input.price,

    verified: input.verified ?? true,

    notes: input.notes,

    locationName: input.locationName,
    locationState: input.locationState,
    latitude: input.latitude,
    longitude: input.longitude,
  });

  // Notify connected clients
  if (io) {
    io.emit("ride_created", ride);

    const rides = await rideRepository.findAll();

    io.emit("rides_updated", rides);
  }

  return ride;
}

/**
 * Join / book a ride
 *
 * Currently only ONE passenger is allowed per ride.
 */
export async function joinRide(
  rideId: string,
  input: JoinRideInput,
  user: User,
): Promise<{
  success: boolean;
  message: string;
  ride: RideRecord;
}> {
  if (!user?.id) {
    throw new Error("Authenticated user is required to join a ride.");
  }

  const ride = await rideRepository.findById(rideId);

  if (!ride) {
    throw new Error("Ride not found");
  }

  // Only active rides can be joined
  if (ride.status !== "active") {
    throw new Error("This ride is no longer available.");
  }

  // Driver cannot join own ride
  if (ride.userId === user.id) {
    throw new Error("You cannot join your own ride.");
  }

  // Only ONE passenger for now
  if (ride.passengers && ride.passengers.length > 0) {
    throw new Error(
      "This ride already has a passenger. Only one passenger is allowed for now.",
    );
  }

  // Validate requested seats
  if (input.seatsRequested < 1) {
    throw new Error("At least one seat must be requested.");
  }

  if (ride.seatsLeft < input.seatsRequested) {
    throw new Error(`Only ${ride.seatsLeft} seat(s) remaining for this ride.`);
  }

  const passengerName = user.name || "Fellow Commuter";

  const updatedRide = await rideRepository.joinRide(rideId, {
    userId: user.id,
    userName: passengerName,
    seats: input.seatsRequested,
    pickupPoint: input.pickupPoint,
    passengerPhone: input.passengerPhone,
  });

  if (!updatedRide) {
    throw new Error("Unable to join ride.");
  }

  // Notify connected clients
  if (io) {
    io.emit("ride_updated", updatedRide);

    io.to(`user:${updatedRide.userId}`).emit("ride_booked", {
      rideId: updatedRide.id,
      passengerName,
      seats: input.seatsRequested,
      from: updatedRide.from,
      to: updatedRide.to,
    });

    const rides = await rideRepository.findAll();

    io.emit("rides_updated", rides);
  }

  // Push notification to driver
  if (updatedRide.userId) {
    sendExpoPushNotification(
      updatedRide.userId,
      "🚗 Ride Booking Request",
      `${passengerName} booked ${input.seatsRequested} seat(s) for ${updatedRide.from} ➔ ${updatedRide.to}`,
      {
        rideId: updatedRide.id,
        type: "ride_booked",
      },
    ).catch(() => {});
  }

  return {
    success: true,
    message: `Successfully booked ${input.seatsRequested} seat(s) with ${updatedRide.driverName}!`,
    ride: updatedRide,
  };
}

/**
 * Update a ride
 */
export async function updateRide(
  rideId: string,
  input: UpdateRideInput,
  user: User,
): Promise<RideRecord> {
  if (!user?.id) {
    throw new Error("Authenticated user is required.");
  }

  const ride = await rideRepository.findById(rideId);

  if (!ride) {
    throw new Error("Ride not found");
  }

  // Only the driver can update the ride
  if (ride.userId !== user.id) {
    throw new Error("Unauthorized to modify this ride");
  }

  const updatedRide = await rideRepository.updateRide(rideId, input);

  if (!updatedRide) {
    throw new Error("Unable to update ride");
  }

  // Notify connected clients
  if (io) {
    io.emit("ride_updated", updatedRide);

    const rides = await rideRepository.findAll();

    io.emit("rides_updated", rides);
  }

  return updatedRide;
}

/**
 * Get rides belonging to a user
 *
 * driving = rides created by the user
 * riding  = rides joined by the user
 */
export async function getMyRides(userId: string): Promise<{
  driving: RideRecord[];
  riding: RideRecord[];
}> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const driving = await rideRepository.findByDriverId(userId);

  const riding = await rideRepository.findByPassengerId(userId);

  return {
    driving,
    riding,
  };
}
