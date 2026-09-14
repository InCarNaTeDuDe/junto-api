import { Ionicons } from "@expo/vector-icons";

export interface RidePassenger {
  id?: string;
  userId: string;
  userName: string;
  seats: number;
  pickupPoint?: string;
  passengerPhone?: string;
  status?: "pending" | "confirmed" | "declined";
  joinedAt: string;
}

export interface RideRatingItem {
  id?: string;
  fromUserId: string;
  fromUserName: string;
  toRole?: "driver" | "passenger";
  rating: number;
  review?: string;
  tags?: string[];
  createdAt: string;
}

export interface RideItem {
  id: string;
  userId?: string;
  driverId?: string;
  driverName: string;
  driverRating: number;
  driverAvatar: string;
  from: string;
  to: string;
  time: string;
  vehicleType: "car" | "bike";
  seatsLeft: number;
  totalSeats?: number;
  price: number | string;
  verified: boolean;
  notes?: string;
  passengers?: RidePassenger[];
  vehicleModel?: string;
  registrationNumber?: string;
  pickupLocation?: string;
  dropLocation?: string;
  status?: "active" | "in_progress" | "completed" | "cancelled";
  currentLatitude?: number;
  currentLongitude?: number;
  lastGpsUpdatedAt?: string;
  isGpsActive?: boolean;
  ratings?: RideRatingItem[];
  reports?: Array<{
    id?: string;
    reportedByUserId: string;
    reportedByName: string;
    category: string;
    description: string;
    createdAt: string;
  }>;
}

export interface StepMeta {
  step: number;
  title: string;
  subtitle: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  speechText: string;
}

export const STEP_DEFINITIONS: StepMeta[] = [
  {
    step: 1,
    title: "Ride Details",
    subtitle: "Route, schedule, pickup/drop location & seats",
    shortLabel: "1. Details",
    icon: "map-outline",
    speechText:
      "Step 1: Enter your ride details. Set your starting point, destination, date and time, pickup and drop landmarks, and available seats.",
  },
  {
    step: 2,
    title: "Driver & Vehicle",
    subtitle: "Driver profile, vehicle registration number & details",
    shortLabel: "2. Driver & Vehicle",
    icon: "car-sport-outline",
    speechText:
      "Step 2: Enter your vehicle registration number and optional vehicle details.",
  },
  {
    step: 3,
    title: "Review & Publish",
    subtitle: "Confirm trip details and publish to Junto",
    shortLabel: "3. Publish",
    icon: "checkmark-done-circle-outline",
    speechText:
      "Step 3: Review and publish. Double check all trip details and confirm to make your ride live for co-riders.",
  },
  {
    step: 4,
    title: "Seat Requests",
    subtitle: "Receive interested co-rider requests to Accept or Decline",
    shortLabel: "4. Requests",
    icon: "people-outline",
    speechText:
      "Step 4: Seat requests. Review incoming requests from co-riders and tap Accept or Decline. You need at least one confirmed rider to start.",
  },
  {
    step: 5,
    title: "Ride Confirmed",
    subtitle: "Confirmed co-riders, trip details, Junto chat & share trip",
    shortLabel: "5. Confirmed",
    icon: "checkmark-circle-outline",
    speechText:
      "Step 5: Ride confirmed. View confirmed co-riders, coordinate through Junto chat, or share your trip with family.",
  },
  {
    step: 6,
    title: "Ride Started",
    subtitle: "Live GPS (15-30s updates), Safety tools, Emergency call & chat",
    shortLabel: "6. Started",
    icon: "navigate-outline",
    speechText:
      "Step 6: Ride started. Live GPS tracking is active with location broadcasting every 20 seconds. Use safety tools or emergency call if needed.",
  },
  {
    step: 7,
    title: "Ride Completed",
    subtitle: "GPS stopped, mutual ⭐ ratings & report problem",
    shortLabel: "7. Completed",
    icon: "ribbon-outline",
    speechText:
      "Step 7: Ride completed. Live GPS has stopped automatically. Please rate your co-rider and report any issues if necessary.",
  },
];

export const PRESET_ROUTES = [
  {
    from: "Hitec City",
    to: "Gachibowli",
    pickup: "Pillar 14 Cyber Towers",
    drop: "Wipro Circle Gate 2",
  },
  {
    from: "Madhapur",
    to: "Financial District",
    pickup: "Madhapur Metro Gate 1",
    drop: "WaveRock SEZ Main Entrance",
  },
  {
    from: "Kondapur",
    to: "Jubilee Hills",
    pickup: "Botanical Garden Main Gate",
    drop: "Checkpost Metro Station",
  },
  {
    from: "Kukatpally",
    to: "Hitec City",
    pickup: "KPHB Colony Pillar 780",
    drop: "Mindspace Circle",
  },
  {
    from: "Secunderabad",
    to: "Begumpet",
    pickup: "Secunderabad Railway Station Gate 3",
    drop: "Prakash Nagar Metro",
  },
];
