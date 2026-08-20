import { AppDataSource } from "../db/data-source";
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

  price: string;
  verified: boolean;
  notes?: string;

  locationName?: string;
  locationState?: string;
  latitude?: number;
  longitude?: number;

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

export class RideRepository {
  private get repo() {
    return AppDataSource.getRepository(Ride);
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
      totalSeats: ride.totalSeats,

      price: ride.price,
      verified: ride.verified,
      notes: ride.notes,

      locationName: ride.locationName,
      locationState: ride.locationState,
      latitude: ride.latitude,
      longitude: ride.longitude,

      status: ride.status,

      passengers: (ride.passengers || []).map((passenger) => ({
        userId: passenger.userId,
        userName: passenger.userName,
        seats: passenger.seats,
        pickupPoint: passenger.pickupPoint,
        passengerPhone: passenger.passengerPhone,
        joinedAt: passenger.joinedAt,
      })),

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

    price: string;
    verified?: boolean;
    notes?: string;

    locationName?: string;
    locationState?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<RideRecord> {
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

      price: data.price,
      verified: data.verified ?? true,
      notes: data.notes,

      locationName: data.locationName,
      locationState: data.locationState,
      latitude: data.latitude,
      longitude: data.longitude,

      status: "active",

      passengers: [],
    });

    const savedRide = await this.repo.save(ride);

    return this.toRideRecord(savedRide);
  }

  /**
   * Find all active rides
   */
  async findAll(): Promise<RideRecord[]> {
    const rides = await this.repo.find({
      where: {
        status: "active",
      },
      order: {
        createdAt: "DESC",
      },
    });

    return rides.map((ride) => this.toRideRecord(ride));
  }

  /**
   * Find ride by ID
   */
  async findById(id: string): Promise<RideRecord | null> {
    const ride = await this.repo.findOne({
      where: {
        id,
      },
    });

    if (!ride) {
      return null;
    }

    return this.toRideRecord(ride);
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
   * Join ride.
   *
   * Currently only ONE passenger is allowed.
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

    // Only one passenger for now
    if (ride.passengers && ride.passengers.length > 0) {
      throw new Error(
        "This ride already has a passenger. Only one passenger is allowed for now.",
      );
    }

    if (ride.seatsLeft < passenger.seats) {
      throw new Error(
        `Only ${ride.seatsLeft} seat(s) remaining for this ride.`,
      );
    }

    ride.seatsLeft -= passenger.seats;

    ride.passengers = [
      {
        userId: passenger.userId,
        userName: passenger.userName,
        seats: passenger.seats,
        pickupPoint: passenger.pickupPoint,
        passengerPhone: passenger.passengerPhone,
        joinedAt: new Date().toISOString(),
      },
    ];

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
      price: string;
      verified: boolean;
      notes: string;
      status: "active" | "in_progress" | "completed" | "cancelled";
      locationName: string;
      locationState: string;
      latitude: number;
      longitude: number;
    }>,
  ): Promise<RideRecord | null> {
    await this.repo.update(id, data);

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
