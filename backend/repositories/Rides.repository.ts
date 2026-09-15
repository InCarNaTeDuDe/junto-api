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

  status:
    | "active"
    | "both_travelling"
    | "in_progress"
    | "completed"
    | "cancelled";
  isDriverTravelling?: boolean;

  passengers: Array<{
    id?: string;
    userId: string;
    userName: string;
    seats: number;
    pickupPoint?: string;
    passengerPhone?: string;
    status?: "pending" | "confirmed" | "declined";
    isTravelling?: boolean;
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
    imageUrl?: string;
    createdAt: string;
  }>;
  reports?: Array<{
    id?: string;
    reportedByUserId: string;
    reportedByName: string;
    category: string;
    description: string;
    imageUrl?: string;
    createdAt: string;
  }>;

  createdAt: string;
  updatedAt: string;
}

// In-memory fallback store when PostgreSQL is not configured or offline
const inMemoryRides = new Map<string, RideRecord>();

const initialSeedRides: RideRecord[] = [];

for (const r of initialSeedRides) {
  inMemoryRides.set(r.id, r);
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

    const id = `ride-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const fallbackRecord: RideRecord = {
      id,
      userId: data.driverId,
      driverName: data.driverName,
      driverRating: data.driverRating ?? 5.0,
      driverAvatar:
        data.driverAvatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!this.isConnected) {
      inMemoryRides.set(id, fallbackRecord);
      return fallbackRecord;
    }

    try {
      const ride = this.repo.create({
        ...fallbackRecord,
        userId: data.driverId,
        price: numericPrice,
      } as any);
      const savedRide = await this.repo.save(ride as any);
      const rec = this.toRideRecord(savedRide as Ride);
      inMemoryRides.set(rec.id, rec);
      return rec;
    } catch {
      inMemoryRides.set(id, fallbackRecord);
      return fallbackRecord;
    }
  }

  /**
   * Find all active rides
   */
  override async findAll<R = RideRecord>(options?: any): Promise<R[]> {
    if (!this.isConnected) {
      return Array.from(inMemoryRides.values()) as unknown as R[];
    }
    try {
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
    } catch {
      return Array.from(inMemoryRides.values()) as unknown as R[];
    }
  }

  /**
   * Find ride by ID
   */
  override async findById<R = RideRecord>(
    id: string | number,
    options?: any,
  ): Promise<R | null> {
    const stringId = String(id);
    if (!this.isConnected) {
      return (inMemoryRides.get(stringId) || null) as unknown as R | null;
    }
    try {
      const ride = await this.repo.findOne({
        where: { id: stringId },
        ...(options || {}),
      });

      if (!ride) {
        return (inMemoryRides.get(stringId) || null) as unknown as R | null;
      }

      return this.toRideRecord(ride) as unknown as R;
    } catch {
      return (inMemoryRides.get(stringId) || null) as unknown as R | null;
    }
  }

  /**
   * Find rides created by driver
   */
  async findByDriverId(driverId: string): Promise<RideRecord[]> {
    if (!this.isConnected) {
      return Array.from(inMemoryRides.values()).filter(
        (r) => r.userId === driverId,
      );
    }
    try {
      const rides = await this.repo.find({
        where: { userId: driverId },
        order: { createdAt: "DESC" },
      });
      return rides.map((ride) => this.toRideRecord(ride));
    } catch {
      return Array.from(inMemoryRides.values()).filter(
        (r) => r.userId === driverId,
      );
    }
  }

  /**
   * Find active rides by location
   */
  async findActiveRidesByLocation(locationName: string): Promise<RideRecord[]> {
    if (!this.isConnected) {
      return Array.from(inMemoryRides.values()).filter(
        (r) =>
          r.status === "active" &&
          (r.locationName?.toLowerCase().includes(locationName.toLowerCase()) ||
            r.from.toLowerCase().includes(locationName.toLowerCase()) ||
            r.to.toLowerCase().includes(locationName.toLowerCase())),
      );
    }
    try {
      const rides = await this.repo.find({
        where: { locationName, status: "active" },
        order: { createdAt: "DESC" },
      });
      return rides.map((ride) => this.toRideRecord(ride));
    } catch {
      return Array.from(inMemoryRides.values()).filter(
        (r) =>
          r.status === "active" &&
          (r.locationName?.toLowerCase().includes(locationName.toLowerCase()) ||
            r.from.toLowerCase().includes(locationName.toLowerCase()) ||
            r.to.toLowerCase().includes(locationName.toLowerCase())),
      );
    }
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
    if (!this.isConnected) {
      const ride = inMemoryRides.get(id);
      if (!ride) throw new Error("Ride not found");
      if (ride.status !== "active") throw new Error("Ride is no longer active");
      const currentPassengers = Array.isArray(ride.passengers)
        ? [...ride.passengers]
        : [];
      if (currentPassengers.some((p) => p.userId === passenger.userId)) {
        throw new Error("You have already requested a seat for this ride.");
      }
      if (ride.seatsLeft < passenger.seats) {
        throw new Error(`Only ${ride.seatsLeft} seat(s) remaining.`);
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
      ride.updatedAt = new Date().toISOString();
      return ride;
    }

    try {
      const ride = await this.repo.findOne({ where: { id } });
      if (!ride) throw new Error("Ride not found");
      if (ride.status !== "active") throw new Error("Ride is no longer active");
      const currentPassengers = Array.isArray(ride.passengers)
        ? [...ride.passengers]
        : [];
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
      const rec = this.toRideRecord(savedRide);
      inMemoryRides.set(rec.id, rec);
      return rec;
    } catch (e: any) {
      const inMem = inMemoryRides.get(id);
      if (inMem) return inMem;
      throw e;
    }
  }

  /**
   * Confirm or select a passenger for a ride
   */
  async confirmPassenger(
    rideId: string,
    driverId: string,
    passengerUserId: string,
  ): Promise<RideRecord> {
    if (!this.isConnected) {
      const ride = inMemoryRides.get(rideId);
      if (!ride) throw new Error("Ride not found");
      const currentPassengers = Array.isArray(ride.passengers)
        ? [...ride.passengers]
        : [];
      const target = currentPassengers.find(
        (p) => p.userId === passengerUserId,
      );
      if (!target) throw new Error("Passenger request not found.");
      if (target.status !== "confirmed") {
        const seatsToDeduct = target.seats || 1;
        ride.seatsLeft = Math.max(0, ride.seatsLeft - seatsToDeduct);
        target.status = "confirmed";
      }
      ride.passengers = currentPassengers;
      ride.updatedAt = new Date().toISOString();
      return ride;
    }

    try {
      const ride = await this.repo.findOne({ where: { id: rideId } });
      if (!ride) throw new Error("Ride not found");
      const currentPassengers = Array.isArray(ride.passengers)
        ? [...ride.passengers]
        : [];
      const targetPassenger = currentPassengers.find(
        (p) => p.userId === passengerUserId,
      );
      if (!targetPassenger) throw new Error("Passenger request not found.");
      if (targetPassenger.status !== "confirmed") {
        const seatsToDeduct = targetPassenger.seats || 1;
        ride.seatsLeft = Math.max(0, ride.seatsLeft - seatsToDeduct);
        targetPassenger.status = "confirmed";
      }
      ride.passengers = currentPassengers;
      ride.updatedAt = new Date();
      const savedRide = await this.repo.save(ride);
      const rec = this.toRideRecord(savedRide);
      inMemoryRides.set(rec.id, rec);
      return rec;
    } catch (e: any) {
      const inMem = inMemoryRides.get(rideId);
      if (inMem) return inMem;
      throw e;
    }
  }

  /**
   * Decline a passenger request for a ride
   */
  async declinePassenger(
    rideId: string,
    driverId: string,
    passengerUserId: string,
  ): Promise<RideRecord> {
    if (!this.isConnected) {
      const ride = inMemoryRides.get(rideId);
      if (!ride) throw new Error("Ride not found");
      const currentPassengers = Array.isArray(ride.passengers)
        ? [...ride.passengers]
        : [];
      const target = currentPassengers.find(
        (p) => p.userId === passengerUserId,
      );
      if (!target) throw new Error("Passenger request not found.");
      if (target.status === "confirmed") {
        const maxSeats =
          ride.totalSeats || (ride.vehicleType === "bike" ? 1 : 3);
        ride.seatsLeft = Math.min(
          maxSeats,
          ride.seatsLeft + (target.seats || 1),
        );
      }
      target.status = "declined";
      ride.passengers = currentPassengers;
      ride.updatedAt = new Date().toISOString();
      return ride;
    }

    try {
      const ride = await this.repo.findOne({ where: { id: rideId } });
      if (!ride) throw new Error("Ride not found");
      const currentPassengers = Array.isArray(ride.passengers)
        ? [...ride.passengers]
        : [];
      const targetPassenger = currentPassengers.find(
        (p) => p.userId === passengerUserId,
      );
      if (!targetPassenger) throw new Error("Passenger request not found.");
      if (targetPassenger.status === "confirmed") {
        const maxSeats =
          ride.totalSeats || (ride.vehicleType === "bike" ? 1 : 3);
        ride.seatsLeft = Math.min(
          maxSeats,
          ride.seatsLeft + (targetPassenger.seats || 1),
        );
      }
      targetPassenger.status = "declined";
      ride.passengers = currentPassengers;
      ride.updatedAt = new Date();
      const savedRide = await this.repo.save(ride);
      const rec = this.toRideRecord(savedRide);
      inMemoryRides.set(rec.id, rec);
      return rec;
    } catch (e: any) {
      const inMem = inMemoryRides.get(rideId);
      if (inMem) return inMem;
      throw e;
    }
  }

  /**
   * Cancel passenger seat request or booking
   */
  async cancelSeatRequest(
    rideId: string,
    userId: string,
    userName?: string,
  ): Promise<RideRecord> {
    if (!this.isConnected) {
      const ride = inMemoryRides.get(rideId);
      if (!ride) throw new Error("Ride not found");
      const currentPassengers = Array.isArray(ride.passengers)
        ? [...ride.passengers]
        : [];
      const index = currentPassengers.findIndex(
        (p) =>
          (userId && p.userId === userId) ||
          (userName &&
            p.userName?.trim().toLowerCase() === userName.trim().toLowerCase()),
      );
      if (index !== -1) {
        const target = currentPassengers[index];
        if (target.status === "confirmed") {
          const maxSeats =
            ride.totalSeats || (ride.vehicleType === "bike" ? 1 : 2);
          ride.seatsLeft = Math.min(
            maxSeats,
            ride.seatsLeft + (target.seats || 1),
          );
        }
        currentPassengers.splice(index, 1);
        ride.passengers = currentPassengers;
        ride.updatedAt = new Date().toISOString();
      }
      return ride;
    }

    try {
      const ride = await this.repo.findOne({ where: { id: rideId } });
      if (!ride) throw new Error("Ride not found");
      const currentPassengers = Array.isArray(ride.passengers)
        ? [...ride.passengers]
        : [];
      const index = currentPassengers.findIndex(
        (p) =>
          (userId && p.userId === userId) ||
          (userName &&
            p.userName?.trim().toLowerCase() === userName.trim().toLowerCase()),
      );
      if (index !== -1) {
        const targetPassenger = currentPassengers[index];
        if (targetPassenger.status === "confirmed") {
          const seatsToRestore = targetPassenger.seats || 1;
          const maxSeats =
            ride.totalSeats || (ride.vehicleType === "bike" ? 1 : 2);
          ride.seatsLeft = Math.min(maxSeats, ride.seatsLeft + seatsToRestore);
        }
        currentPassengers.splice(index, 1);
        ride.passengers = currentPassengers;
        ride.updatedAt = new Date();
        const saved = await this.repo.save(ride);
        const rec = this.toRideRecord(saved);
        inMemoryRides.set(rec.id, rec);
        return rec;
      }
      return this.toRideRecord(ride);
    } catch {
      const inMem = inMemoryRides.get(rideId);
      if (inMem) return inMem;
      throw new Error("Ride not found");
    }
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
      status:
        | "active"
        | "both_travelling"
        | "in_progress"
        | "completed"
        | "cancelled";
      locationName: string;
      locationState: string;
      latitude: number;
      longitude: number;
      isDriverTravelling: boolean;
      isGpsActive: boolean;
      currentLatitude: number;
      currentLongitude: number;
      lastGpsUpdatedAt: string;
      vehicleModel: string;
      registrationNumber: string;
      pickupLocation: string;
      dropLocation: string;
      passengers: any[];
    }>,
  ): Promise<RideRecord | null> {
    const inMem = inMemoryRides.get(id);
    if (inMem) {
      Object.assign(inMem, data);
      inMem.updatedAt = new Date().toISOString();
    }
    if (!this.isConnected) {
      return inMem || null;
    }

    try {
      const updateData: any = { ...data };
      if (updateData.price !== undefined) {
        updateData.price =
          typeof updateData.price === "string"
            ? parseFloat(updateData.price.replace(/[^0-9.]/g, "")) || 0
            : Number(updateData.price) || 0;
      }
      await this.repo.update(id, updateData);
      const updatedRide = await this.repo.findOne({ where: { id } });
      if (!updatedRide) return inMem || null;
      const rec = this.toRideRecord(updatedRide);
      inMemoryRides.set(rec.id, rec);
      return rec;
    } catch {
      return inMem || null;
    }
  }

  /**
   * Update live GPS location
   */
  async updateLocation(
    id: string,
    latitude: number,
    longitude: number,
  ): Promise<RideRecord | null> {
    let inMem = inMemoryRides.get(id);
    if (!inMem) {
      inMem = {
        id,
        userId: "usr-commuter-default",
        driverName: "You (Host Driver)",
        driverRating: 5.0,
        from: "Hitec City",
        to: "Gachibowli",
        time: "Today",
        vehicleType: "car",
        seatsLeft: 3,
        totalSeats: 3,
        price: 40,
        verified: true,
        status: "in_progress",
        passengers: [],
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastGpsUpdatedAt: new Date().toISOString(),
        isGpsActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryRides.set(id, inMem);
    } else {
      inMem.currentLatitude = latitude;
      inMem.currentLongitude = longitude;
      inMem.lastGpsUpdatedAt = new Date().toISOString();
      inMem.isGpsActive = true;
      inMem.updatedAt = new Date().toISOString();
    }

    if (!this.isConnected) {
      return inMem;
    }

    try {
      const ride = await this.repo.findOne({ where: { id } });
      if (!ride) return inMem;
      ride.currentLatitude = latitude;
      ride.currentLongitude = longitude;
      ride.lastGpsUpdatedAt = new Date().toISOString();
      ride.isGpsActive = true;
      ride.updatedAt = new Date();
      const saved = await this.repo.save(ride);
      const rec = this.toRideRecord(saved);
      inMemoryRides.set(rec.id, rec);
      return rec;
    } catch {
      return inMem;
    }
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
      imageUrl?: string;
    },
  ): Promise<RideRecord> {
    const inMem = inMemoryRides.get(id);
    const newRating = {
      id: "rate_" + Date.now(),
      fromUserId: ratingData.fromUserId,
      fromUserName: ratingData.fromUserName,
      toRole: ratingData.toRole || "driver",
      rating: ratingData.rating,
      review: ratingData.review,
      tags: ratingData.tags || [],
      imageUrl: ratingData.imageUrl,
      createdAt: new Date().toISOString(),
    };
    if (inMem) {
      inMem.ratings = Array.isArray(inMem.ratings) ? inMem.ratings : [];
      inMem.ratings.push(newRating);
      inMem.updatedAt = new Date().toISOString();
    }
    if (!this.isConnected) {
      if (inMem) return inMem;
      throw new Error("Ride not found");
    }

    try {
      const ride = await this.repo.findOne({ where: { id } });
      if (!ride) return inMem || ({} as any);
      const currentRatings = Array.isArray(ride.ratings)
        ? [...ride.ratings]
        : [];
      currentRatings.push(newRating);
      ride.ratings = currentRatings;
      ride.updatedAt = new Date();
      const saved = await this.repo.save(ride);
      const rec = this.toRideRecord(saved);
      inMemoryRides.set(rec.id, rec);
      return rec;
    } catch {
      if (inMem) return inMem;
      throw new Error("Ride not found");
    }
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
      imageUrl?: string;
    },
  ): Promise<RideRecord> {
    const inMem = inMemoryRides.get(id);
    const newReport = {
      id: "rep_" + Date.now(),
      reportedByUserId: reportData.reportedByUserId,
      reportedByName: reportData.reportedByName,
      category: reportData.category,
      description: reportData.description,
      imageUrl: reportData.imageUrl,
      createdAt: new Date().toISOString(),
    };
    if (inMem) {
      inMem.reports = Array.isArray(inMem.reports) ? inMem.reports : [];
      inMem.reports.push(newReport);
      inMem.updatedAt = new Date().toISOString();
    }
    if (!this.isConnected) {
      if (inMem) return inMem;
      throw new Error("Ride not found");
    }

    try {
      const ride = await this.repo.findOne({ where: { id } });
      if (!ride) return inMem || ({} as any);
      const currentReports = Array.isArray(ride.reports)
        ? [...ride.reports]
        : [];
      currentReports.push(newReport);
      ride.reports = currentReports;
      ride.updatedAt = new Date();
      const saved = await this.repo.save(ride);
      const rec = this.toRideRecord(saved);
      inMemoryRides.set(rec.id, rec);
      return rec;
    } catch {
      if (inMem) return inMem;
      throw new Error("Ride not found");
    }
  }

  /**
   * Signal user has started travelling (driver or confirmed co-rider).
   * When both driver and confirmed co-rider are travelling, status switches to 'both_travelling'.
   */
  async startTravelling(
    rideId: string,
    userId: string,
    isDriver: boolean,
  ): Promise<RideRecord> {
    const ride = await this.findById(rideId);
    if (!ride) throw new Error("Ride not found");

    let isDriverTravelling = ride.isDriverTravelling || false;
    if (isDriver || ride.userId === userId) {
      isDriverTravelling = true;
    }

    const currentPassengers = Array.isArray(ride.passengers)
      ? [...ride.passengers]
      : [];

    let passengerStarted = false;
    for (const p of currentPassengers) {
      if (p.userId === userId) {
        p.isTravelling = true;
      }
      if (p.status === "confirmed" && p.isTravelling) {
        passengerStarted = true;
      }
    }

    const hasConfirmedPassengers = currentPassengers.some(
      (p) => p.status === "confirmed",
    );
    const bothTravelling =
      isDriverTravelling && (hasConfirmedPassengers ? passengerStarted : true);

    const updatePayload: any = {
      isDriverTravelling,
      passengers: currentPassengers,
    };

    if (
      bothTravelling &&
      ride.status !== "in_progress" &&
      ride.status !== "completed"
    ) {
      updatePayload.status = "both_travelling";
      updatePayload.isGpsActive = true;
    }

    const updated = await this.updateRide(rideId, updatePayload);
    if (!updated) throw new Error("Could not update ride travelling status");
    return updated;
  }

  /**
   * Delete ride
   */
  async deleteRide(id: string) {
    inMemoryRides.delete(id);
    if (!this.isConnected) {
      return { affected: 1 };
    }
    try {
      return await this.repo.delete(id);
    } catch {
      return { affected: 1 };
    }
  }

  /**
   * Find rides where user is the passenger.
   */
  async findByPassengerId(userId: string): Promise<RideRecord[]> {
    if (!this.isConnected) {
      return Array.from(inMemoryRides.values()).filter((r) =>
        r.passengers?.some((p) => p.userId === userId),
      );
    }
    try {
      const rides = await this.repo.find({
        order: {
          createdAt: "DESC",
        },
      });

      const passengerRides = rides.filter((ride) =>
        ride.passengers?.some((passenger) => passenger.userId === userId),
      );

      return passengerRides.map((ride) => this.toRideRecord(ride));
    } catch {
      return Array.from(inMemoryRides.values()).filter((r) =>
        r.passengers?.some((p) => p.userId === userId),
      );
    }
  }
}

export const rideRepository = new RideRepository();
