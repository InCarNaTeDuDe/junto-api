export interface RidePassenger {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  seats: number;
  pickupPoint?: string;
  passengerPhone?: string;
  phone?: string;
  status?: "pending" | "confirmed" | "declined" | "rejected" | "cancelled";
  joinedAt: string;
  isTravelling?: boolean;
  otp?: string;
  otpVerified?: boolean;
}

export interface RideItem {
  id: string;
  userId?: string;
  driverId?: string;
  driverName: string;
  driverPhone?: string;
  driverRating?: number | string;
  driverAvatar?: string;
  from: string;
  to: string;
  time: string;
  vehicleType: "car" | "bike" | "other";
  seatsLeft: number;
  totalSeats?: number;
  price: number | string;
  verified: boolean;
  notes?: string;
  date?: string;
  passengers?: RidePassenger[];
  vehicleModel?: string;
  registrationNumber?: string;
  pickupLocation?: string;
  dropLocation?: string;
  status?:
    | "active"
    | "both_travelling"
    | "in_progress"
    | "completed"
    | "cancelled";
  currentLatitude?: number;
  currentLongitude?: number;
  lastGpsUpdatedAt?: string;
  isGpsActive?: boolean;
  locationUpdateIntervalSeconds?: number;
  reviewsCount?: number;
  isPopular?: boolean;
  isEcoFriendly?: boolean;
  departureTimeFormatted?: string;
  arrivalTimeFormatted?: string;
  isDriverTravelling?: boolean;
  ratings?: Array<{
    id?: string;
    fromUserId?: string;
    fromUserName?: string;
    rating?: number;
    review?: string;
    [key: string]: any;
  }>;
}
