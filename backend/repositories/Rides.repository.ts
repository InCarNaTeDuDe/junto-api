import { BaseRepository } from "./Base.repository";
import { Ride } from "../entities/Rides.entity";

export interface RideRecord {
  id: string;

  userId: string;

  driverName: string;
  driverRating: number;
  driverAvatar?: string;

  from: string;
  to: string;
  time: string;

  vehicleType: "car" | "bike";

  seatsLeft: number;
  totalSeats: number;

  price: number;
  verified: boolean;
  notes?: string;

  locationName?: string;
  locationState?: string;
  latitude?: number;
  longitude?: number;

  status: "active" | "in_progress" | "completed" | "cancelled";

  passengers: Array<{
    id?: string;
    userId: string;
    userName: string;
    seats: number;
    pickupPoint?: string;
    passengerPhone?: string;
    status?: "pending" | "confirmed" | "declined";
    joinedAt: string;
  }>;

  // Safety & Vehicle details
  vehicleModel?: string;
  registrationNumber?: string;
  pickupLocation?: string;
  dropLocation?: string;

  // Live GPS Tracking
  currentLatitude?: number;
  currentLongitude?: number;
  lastGpsUpdatedAt?: string;
  isGpsActive?: boolean;

  // Ratings & Reports
  ratings?: Array<{
    id?: string;
    fromUserId: string;
    fromUserName: string;
    toRole?: "driver" | "passenger";
    rating: number;
    review?: string;
    tags?: string[];
    createdAt: string;
  }>;
  reports?: Array<{
    id?: string;
    reportedByUserId: string;
    reportedByName: string;
    category: string;
    description: string;
    createdAt: string;
  }>;

  createdAt: string;
  updatedAt: string;
}

export class RideRepository extends BaseRepository<Ride> {
  constructor() {
    super(Ride);
  }

  /**
   * Convert TypeORM Ride entity into application RideRecord.
   *
   * Keep this conversion inside the repository.
   */
  private toRideRecord(ride: Ride): RideRecord {
    return {
      id: ride.id,

      userId: ride.userId,
      driverName: ride.driverName,
      driverRating: ride.driverRating,
      driverAvatar: ride.driverAvatar,

      from: ride.from,
      to: ride.to,
      time: ride.time,

      vehicleType: ride.vehicleType,

      seatsLeft: ride.seatsLeft,
      totalSeats: ride.totalSeats || (ride.vehicleType === "bike" ? 1 : 2),

      price:
        typeof ride.price === "number"
          ? ride.price
          : parseFloat(String(ride.price || "0").replace(/[^0-9.]/g, "")) || 0,
      verified: ride.verified,
      notes: ride.notes,

      locationName: ride.locationName,
      locationState: ride.locationState,
      latitude: ride.latitude,
      longitude: ride.longitude,

      status: ride.status,

      passengers: (ride.passengers || []).map((passenger: any) => ({
        id: passenger.id,
        userId: passenger.userId,
        userName: passenger.userName,
        seats: passenger.seats,
        pickupPoint: passenger.pickupPoint,
        passengerPhone: passenger.passengerPhone,
        status: passenger.status || "pending",
        joinedAt: passenger.joinedAt,
      })),

      vehicleModel:
        ride.vehicleModel ||
        (ride.vehicleType === "car"
          ? "Maruti Swift (Silver)"
          : "Honda Activa (Black)"),
      registrationNumber: ride.registrationNumber || "TS-09-EA-4521",
      pickupLocation: ride.pickupLocation || ride.from,
      dropLocation: ride.dropLocation || ride.to,

      currentLatitude: ride.currentLatitude ?? ride.latitude,
      currentLongitude: ride.currentLongitude ?? ride.longitude,
      lastGpsUpdatedAt: ride.lastGpsUpdatedAt,
      isGpsActive: ride.isGpsActive ?? false,

      ratings: Array.isArray(ride.ratings) ? ride.ratings : [],
      reports: Array.isArray(ride.reports) ? ride.reports : [],

      createdAt: ride.createdAt.toISOString(),
      updatedAt: ride.updatedAt.toISOString(),
    };
  }

  /**
   * Create ride
   */
  async createRide(data: {
    driverId: string;
    driverName: string;
    driverRating?: number;
    driverAvatar?: string;
    driverAvatarBg?: string;

    from: string;
    to: string;
    time: string;

    vehicleType: "car" | "bike";

    seatsLeft: number;
    totalSeats: number;

    price: number | string;
    verified?: boolean;
    notes?: string;

    locationName?: string;
    locationState?: string;
    latitude?: number;
    longitude?: number;

    vehicleModel?: string;
    registrationNumber?: string;
    pickupLocation?: string;
    dropLocation?: string;
  }): Promise<RideRecord> {
    const numericPrice =
      typeof data.price === "string"
        ? parseFloat(data.price.replace(/[^0-9.]/g, "")) || 0
        : Number(data.price) || 0;

    const ride = this.repo.create({
      userId: data.driverId,

      driverName: data.driverName,
      driverRating: data.driverRating ?? 5.0,

      driverAvatar: data.driverAvatar,
      driverAvatarBg: data.driverAvatarBg ?? "#2563EB",

      from: data.from,
      to: data.to,
      time: data.time,

      vehicleType: data.vehicleType,

      seatsLeft: data.seatsLeft,
      totalSeats: data.totalSeats,

      price: numericPrice,
      verified: data.verified ?? true,
      notes: data.notes,

      locationName: data.locationName,
      locationState: data.locationState,
      latitude: data.latitude,
      longitude: data.longitude,

      vehicleModel:
        data.vehicleModel ||
        (data.vehicleType === "car"
          ? "Maruti Swift (Silver)"
          : "Honda Activa (Black)"),
      registrationNumber:
        data.registrationNumber ||
        `TS-${Math.floor(10 + Math.random() * 89)}-EA-${Math.floor(1000 + Math.random() * 9000)}`,
      pickupLocation: data.pickupLocation || data.from,
      dropLocation: data.dropLocation || data.to,
      currentLatitude: data.latitude,
      currentLongitude: data.longitude,
      isGpsActive: false,

      status: "active",

      passengers: [],
      ratings: [],
      reports: [],
    } as any);

    const savedRide = await this.repo.save(ride as any);

    return this.toRideRecord(savedRide as Ride);
  }

  /**
   * Find all active rides
   */
  override async findAll<R = RideRecord>(options?: any): Promise<R[]> {
    if (
      options &&
      typeof options === "object" &&
      ("where" in options || "relations" in options || "order" in options)
    ) {
      const rides = await this.repo.find(options);
      return rides.map((ride) => this.toRideRecord(ride)) as unknown as R[];
    }
    const rides = await this.repo.find({
      where: [{ status: "active" }, { status: "in_progress" }],
      order: {
        createdAt: "DESC",
      },
    });

    return rides.map((ride) => this.toRideRecord(ride)) as unknown as R[];
  }

  /**
   * Find ride by ID
   */
  override async findById<R = RideRecord>(
    id: string | number,
    options?: any,
  ): Promise<R | null> {
    const ride = await this.repo.findOne({
      where: {
        id: String(id),
      },
      ...(options || {}),
    });

    if (!ride) {
      return null;
    }

    return this.toRideRecord(ride) as unknown as R;
  }

  /**
   * Find rides created by driver
   */
  async findByDriverId(driverId: string): Promise<RideRecord[]> {
    const rides = await this.repo.find({
      where: {
        userId: driverId,
      },
      order: {
        createdAt: "DESC",
      },
    });

    return rides.map((ride) => this.toRideRecord(ride));
  }

  /**
   * Find active rides by location
   */
  async findActiveRidesByLocation(locationName: string): Promise<RideRecord[]> {
    const rides = await this.repo.find({
      where: {
        locationName,
        status: "active",
      },
      order: {
        createdAt: "DESC",
      },
    });

    return rides.map((ride) => this.toRideRecord(ride));
  }

  /**
   * Join ride / request seat
   */
  async joinRide(
    id: string,
    passenger: {
      userId: string;
      userName: string;
      seats: number;
      pickupPoint?: string;
      passengerPhone?: string;
    },
  ): Promise<RideRecord> {
    const ride = await this.repo.findOne({
      where: {
        id,
      },
    });

    if (!ride) {
      throw new Error("Ride not found");
    }

    if (ride.status !== "active") {
      throw new Error("Ride is no longer active");
    }

    const currentPassengers = Array.isArray(ride.passengers)
      ? [...ride.passengers]
      : [];

    // Check if user already requested
    const alreadyRequested = currentPassengers.find(
      (p) => p.userId === passenger.userId,
    );
    if (alreadyRequested) {
      throw new Error("You have already requested a seat for this ride.");
    }

    if (ride.seatsLeft < passenger.seats) {
      throw new Error(
        `Only ${ride.seatsLeft} seat(s) remaining for this ride.`,
      );
    }

    currentPassengers.push({
      userId: passenger.userId,
      userName: passenger.userName,
      seats: passenger.seats,
      pickupPoint: passenger.pickupPoint,
      passengerPhone: passenger.passengerPhone,
      status: "pending",
      joinedAt: new Date().toISOString(),
    });

    ride.passengers = currentPassengers;
    ride.updatedAt = new Date();

    const savedRide = await this.repo.save(ride);

    return this.toRideRecord(savedRide);
  }

  /**
   * Confirm or select a passenger for a ride
   */
  async confirmPassenger(
    rideId: string,
    driverId: string,
    passengerUserId: string,
  ): Promise<RideRecord> {
    const ride = await this.repo.findOne({
      where: { id: rideId },
    });

    if (!ride) {
      throw new Error("Ride not found");
    }

    if (ride.userId !== driverId) {
      throw new Error(
        "Only the ride creator can select and confirm passengers.",
      );
    }

    const currentPassengers = Array.isArray(ride.passengers)
      ? [...ride.passengers]
      : [];
    const targetPassenger = currentPassengers.find(
      (p) => p.userId === passengerUserId,
    );
    if (!targetPassenger) {
      throw new Error("Passenger request not found.");
    }

    if (targetPassenger.status !== "confirmed") {
      const seatsToDeduct = targetPassenger.seats || 1;
      if (ride.seatsLeft < seatsToDeduct) {
        throw new Error(
          "Not enough remaining seats to confirm this passenger.",
        );
      }
      targetPassenger.status = "confirmed";
      ride.seatsLeft = Math.max(0, ride.seatsLeft - seatsToDeduct);
    }

    ride.passengers = currentPassengers;
    ride.updatedAt = new Date();

    const savedRide = await this.repo.save(ride);
    return this.toRideRecord(savedRide);
  }

  /**
   * Cancel passenger seat request or booking
   */
  async cancelSeatRequest(
    rideId: string,
    userId: string,
    userName?: string,
  ): Promise<RideRecord> {
    const ride = await this.repo.findOne({
      where: { id: rideId },
    });

    if (!ride) {
      throw new Error("Ride not found");
    }

    const currentPassengers = Array.isArray(ride.passengers)
      ? [...ride.passengers]
      : [];

    const index = currentPassengers.findIndex(
      (p) =>
        (userId && p.userId === userId) ||
        (userName &&
          p.userName?.trim().toLowerCase() === userName.trim().toLowerCase()),
    );

    if (index === -1) {
      throw new Error("You do not have an active seat request for this ride.");
    }

    const targetPassenger = currentPassengers[index];
    // If the seat was already confirmed, restore the seats
    if (targetPassenger.status === "confirmed") {
      const seatsToRestore = targetPassenger.seats || 1;
      const maxSeats = ride.totalSeats || (ride.vehicleType === "bike" ? 1 : 2);
      ride.seatsLeft = Math.min(maxSeats, ride.seatsLeft + seatsToRestore);
    }

    // Remove passenger request
    currentPassengers.splice(index, 1);
    ride.passengers = currentPassengers;
    ride.updatedAt = new Date();

    const savedRide = await this.repo.save(ride);
    return this.toRideRecord(savedRide);
  }

  /**
   * Update ride
   */
  async updateRide(
    id: string,
    data: Partial<{
      from: string;
      to: string;
      time: string;
      vehicleType: "car" | "bike";
      seatsLeft: number;
      price: number | string;
      verified: boolean;
      notes: string;
      status: "active" | "in_progress" | "completed" | "cancelled";
      locationName: string;
      locationState: string;
      latitude: number;
      longitude: number;
    }>,
  ): Promise<RideRecord | null> {
    const updateData: any = { ...data };
    if (updateData.price !== undefined) {
      updateData.price =
        typeof updateData.price === "string"
          ? parseFloat(updateData.price.replace(/[^0-9.]/g, "")) || 0
          : Number(updateData.price) || 0;
    }
    await this.repo.update(id, updateData);

    const updatedRide = await this.repo.findOne({
      where: {
        id,
      },
    });

    if (!updatedRide) {
      return null;
    }

    return this.toRideRecord(updatedRide);
  }

  /**
   * Update live GPS location
   */
  async updateLocation(
    id: string,
    latitude: number,
    longitude: number,
  ): Promise<RideRecord | null> {
    const ride = await this.repo.findOne({ where: { id } });
    if (!ride) return null;
    ride.currentLatitude = latitude;
    ride.currentLongitude = longitude;
    ride.lastGpsUpdatedAt = new Date().toISOString();
    ride.isGpsActive = true;
    ride.updatedAt = new Date();
    const saved = await this.repo.save(ride);
    return this.toRideRecord(saved);
  }

  /**
   * Add passenger or driver rating and review
   */
  async addRating(
    id: string,
    ratingData: {
      fromUserId: string;
      fromUserName: string;
      toRole?: "driver" | "passenger";
      rating: number;
      review?: string;
      tags?: string[];
    },
  ): Promise<RideRecord> {
    const ride = await this.repo.findOne({ where: { id } });
    if (!ride) throw new Error("Ride not found");
    const currentRatings = Array.isArray(ride.ratings) ? [...ride.ratings] : [];
    const newRating = {
      id: "rate_" + Date.now(),
      fromUserId: ratingData.fromUserId,
      fromUserName: ratingData.fromUserName,
      toRole: ratingData.toRole || "driver",
      rating: ratingData.rating,
      review: ratingData.review,
      tags: ratingData.tags || [],
      createdAt: new Date().toISOString(),
    };
    currentRatings.push(newRating);
    ride.ratings = currentRatings;

    // Recalculate driver rating if rated to driver
    if (ratingData.toRole !== "passenger") {
      const driverRatings = currentRatings.filter(
        (r) => r.toRole !== "passenger",
      );
      if (driverRatings.length > 0) {
        const sum = driverRatings.reduce((acc, curr) => acc + curr.rating, 0);
        ride.driverRating = Number((sum / driverRatings.length).toFixed(1));
      }
    }

    ride.updatedAt = new Date();
    const saved = await this.repo.save(ride);
    return this.toRideRecord(saved);
  }

  /**
   * Report problem
   */
  async addReport(
    id: string,
    reportData: {
      reportedByUserId: string;
      reportedByName: string;
      category: string;
      description: string;
    },
  ): Promise<RideRecord> {
    const ride = await this.repo.findOne({ where: { id } });
    if (!ride) throw new Error("Ride not found");
    const currentReports = Array.isArray(ride.reports) ? [...ride.reports] : [];
    currentReports.push({
      id: "rep_" + Date.now(),
      reportedByUserId: reportData.reportedByUserId,
      reportedByName: reportData.reportedByName,
      category: reportData.category,
      description: reportData.description,
      createdAt: new Date().toISOString(),
    });
    ride.reports = currentReports;
    ride.updatedAt = new Date();
    const saved = await this.repo.save(ride);
    return this.toRideRecord(saved);
  }

  /**
   * Delete ride
   */
  async deleteRide(id: string) {
    return this.repo.delete(id);
  }

  /**
   * Find rides where user is the passenger.
   *
   * Currently max one passenger per ride.
   */
  async findByPassengerId(userId: string): Promise<RideRecord[]> {
    const rides = await this.repo.find({
      order: {
        createdAt: "DESC",
      },
    });

    const passengerRides = rides.filter((ride) =>
      ride.passengers?.some((passenger) => passenger.userId === userId),
    );

    return passengerRides.map((ride) => this.toRideRecord(ride));
  }
}

export const rideRepository = new RideRepository();
