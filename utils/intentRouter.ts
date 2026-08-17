export interface IntentMatch {
  id: string;
  module:
    | "services"
    | "rides"
    | "daymates"
    | "deals"
    | "helpme"
    | "tickets"
    | "roam"
    | "chats";
  moduleName: string;
  badge: string;
  icon: string;
  color: string;
  bg: string;
  headline: string;
  explanation: string;
  route: string;
  queryParams?: Record<string, string>;
  actionLabel: string;
  secondaryActionLabel?: string;
  secondaryRoute?: string;
  tags: string[];
  instantResults: Array<{
    id: string;
    title: string;
    subtitle: string;
    detail: string;
    badge?: string;
    icon?: string;
    avatarBg?: string;
    actionText?: string;
    rating?: number;
    price?: string;
  }>;
}

export interface SuggestedNeedPrompt {
  id: string;
  emoji: string;
  text: string;
  category: string;
  targetModule: string;
  color: string;
  bg: string;
}

export const SUGGESTED_NEED_PROMPTS: SuggestedNeedPrompt[] = [
  {
    id: "p-1",
    emoji: "🔧",
    text: "I need a bike mechanic near me",
    category: "Services",
    targetModule: "Local Services",
    color: "#EA580C",
    bg: "#FFEDD5",
  },
  {
    id: "p-2",
    emoji: "🚗",
    text: "I need someone to go to Vijayawada with",
    category: "RideMate",
    targetModule: "Rides & Travel",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
  {
    id: "p-3",
    emoji: "🎟️",
    text: "I need a movie ticket for tonight",
    category: "TicketSwap",
    targetModule: "Tickets & Shows",
    color: "#E11D48",
    bg: "#FFE4E6",
  },
  {
    id: "p-4",
    emoji: "🔍",
    text: "I lost my wallet in Hitec City",
    category: "HelpMe",
    targetModule: "Lost & Found",
    color: "#DC2626",
    bg: "#FEE2E2",
  },
  {
    id: "p-5",
    emoji: "🌆",
    text: "I'm visiting Hyderabad tomorrow",
    category: "Roam",
    targetModule: "City Guides",
    color: "#0284C7",
    bg: "#E0F2FE",
  },
  {
    id: "p-6",
    emoji: "🚲",
    text: "I want to buy a used cycle",
    category: "LocalDeals",
    targetModule: "Buy & Sell",
    color: "#D97706",
    bg: "#FEF3C7",
  },
  {
    id: "p-7",
    emoji: "🏸",
    text: "Need badminton partner at Kondapur",
    category: "DayMates",
    targetModule: "Sports & Hobbies",
    color: "#16A34A",
    bg: "#DCFCE7",
  },
  {
    id: "p-8",
    emoji: "🍲",
    text: "Looking for home tiffin & food service",
    category: "Services",
    targetModule: "Food & Cooking",
    color: "#CA8A04",
    bg: "#FEFCE8",
  },
  {
    id: "p-9",
    emoji: "🩸",
    text: "Emergency blood donor needed O+ve",
    category: "HelpMe",
    targetModule: "Emergency Broadcast",
    color: "#B91C1C",
    bg: "#FEE2E2",
  },
];

export function parseUserNeed(rawQuery: string): IntentMatch {
  const q = rawQuery.trim().toLowerCase();

  // 1. BIKE / CAR MECHANIC, ELECTRICIAN, PLUMBER, SERVICES, REPAIRS, TIFFIN
  if (
    q.includes("mechanic") ||
    q.includes("puncture") ||
    q.includes("bike repair") ||
    q.includes("car repair") ||
    q.includes("electrician") ||
    q.includes("plumber") ||
    q.includes("ac repair") ||
    q.includes("ac service") ||
    q.includes("cleaning") ||
    q.includes("carpenter") ||
    q.includes("tiffin") ||
    q.includes("cook") ||
    q.includes("pest control") ||
    q.includes("service") ||
    q.includes("repair")
  ) {
    let serviceType = "Verified Mechanics & Technicians";
    if (q.includes("electrician")) serviceType = "Electricians";
    if (q.includes("plumber")) serviceType = "Plumbers";
    if (q.includes("ac")) serviceType = "AC Repair & Cooling";
    if (q.includes("tiffin") || q.includes("cook"))
      serviceType = "Tiffin & Home Food";
    if (q.includes("clean")) serviceType = "Deep Home Cleaning";

    return {
      id: "intent-services",
      module: "services",
      moduleName: "Local Services",
      badge: "⚡ Direct Dispatch",
      icon: "construct",
      color: "#EA580C",
      bg: "#FFEDD5",
      headline: `Route to Local Services: ${serviceType}`,
      explanation: `JUNTO identified a service request. Connecting you to verified local providers in your radius.`,
      route: "/(screens)/services",
      queryParams: { q: rawQuery },
      actionLabel: "View Verified Providers",
      secondaryActionLabel: "Post Service Request",
      secondaryRoute: "/(screens)/services",
      tags: ["Doorstep in 20m", "Zero Commission", "Call Directly"],
      instantResults: [
        {
          id: "res-srv-1",
          title: "Suresh Express Bike Works & Mechanic",
          subtitle: "Madhapur Main Rd (0.8 km away) • 4.9 ★ (120+ jobs)",
          detail:
            "Doorstep bike servicing, engine tuning, puncture, brake repair.",
          badge: "Open Now",
          price: "Visiting ₹99",
          avatarBg: "#EA580C",
          actionText: "Call Now",
        },
        {
          id: "res-srv-2",
          title: "Apex 2-Wheeler Rescue & Towing",
          subtitle: "Hitec City Metro (1.4 km away) • 4.8 ★ (85 jobs)",
          detail:
            "On-spot puncture repair, battery jumpstart, clutch cable replacement.",
          badge: "15 min ETA",
          price: "Starts ₹149",
          avatarBg: "#F59E0B",
          actionText: "Book",
        },
        {
          id: "res-srv-3",
          title: "Ravi Multi-Brand Car & Bike Tech",
          subtitle: "Kondapur (2.1 km away) • 4.7 ★ (64 jobs)",
          detail: "Full service, oil change, electrical check, general tuneup.",
          badge: "Top Rated",
          price: "Free Quote",
          avatarBg: "#3B82F6",
          actionText: "Call",
        },
      ],
    };
  }

  // 2. RIDES, CARPOOL, TRAVEL TO VIJAYAWADA / BANGALORE / AIRPORT
  if (
    q.includes("vijayawada") ||
    q.includes("ride") ||
    q.includes("carpool") ||
    q.includes("bikepool") ||
    q.includes("travel with") ||
    q.includes("go to") ||
    q.includes("bangalore") ||
    q.includes("airport") ||
    q.includes("drive to") ||
    q.includes("cab share") ||
    q.includes("pool")
  ) {
    let dest = "Travel Destination";
    if (q.includes("vijayawada")) dest = "Vijayawada";
    else if (q.includes("bangalore") || q.includes("bengaluru"))
      dest = "Bengaluru";
    else if (q.includes("airport")) dest = "RGIA Airport";
    else if (q.includes("gachibowli")) dest = "Gachibowli";

    return {
      id: "intent-rides",
      module: "rides",
      moduleName: "RideMate & Travel",
      badge: "🚗 Instant Pool",
      icon: "car",
      color: "#7C3AED",
      bg: "#EDE9FE",
      headline: `Route to RideMate: Rides & Carpool to ${dest}`,
      explanation: `JUNTO routed to RideMate. Find drivers heading that way or share fuel costs with co-travelers.`,
      route: "/(screens)/rides",
      queryParams: { destination: dest },
      actionLabel: "View Matching Rides",
      secondaryActionLabel: "Offer a Ride",
      secondaryRoute: "/(screens)/rides",
      tags: ["Verified Drivers", "Fuel Split", "Live Tracking"],
      instantResults: [
        {
          id: "res-rd-1",
          title: `Hyderabad ➔ ${dest} (Honda City)`,
          subtitle: "Driver: Rajesh K. (5.0 ★) • Departs Tomorrow 6:00 AM",
          detail:
            "2 seats left. Pick up: Gachibowli ORR junction. AC, luggage space.",
          badge: "2 Seats Left",
          price: "₹450 / seat",
          avatarBg: "#7C3AED",
          actionText: "Join Ride",
        },
        {
          id: "res-rd-2",
          title: `Hyderabad ➔ ${dest} (Hyundai Creta)`,
          subtitle: "Driver: Priya M. (4.9 ★) • Departs Friday 4:30 PM",
          detail:
            "Women friendly pool. Trunk space for bags. Pick up from Jubilee Hills.",
          badge: "Verified Pool",
          price: "₹500 / seat",
          avatarBg: "#EC4899",
          actionText: "Request Seat",
        },
      ],
    };
  }

  // 3. MOVIE TICKET, CONCERT, EVENT PASS, TICKETSWAP
  if (
    q.includes("ticket") ||
    q.includes("movie") ||
    q.includes("kalki") ||
    q.includes("devara") ||
    q.includes("concert") ||
    q.includes("show") ||
    q.includes("cinema") ||
    q.includes("pass") ||
    q.includes("pvr") ||
    q.includes("inox") ||
    q.includes("ipl")
  ) {
    return {
      id: "intent-tickets",
      module: "tickets",
      moduleName: "TicketSwap",
      badge: "🎟️ Verified Swap",
      icon: "ticket",
      color: "#E11D48",
      bg: "#FFE4E6",
      headline: "Route to TicketSwap: Buy & Exchange Passes",
      explanation:
        "JUNTO routed to TicketSwap. Exchange extra cinema passes, standup show tickets, or IPL matches without scalper fees.",
      route: "/(screens)/add-ticket",
      queryParams: { q: rawQuery },
      actionLabel: "Browse Available Tickets",
      secondaryActionLabel: "List Extra Ticket",
      secondaryRoute: "/(screens)/add-ticket",
      tags: ["Face Value Cap", "Instant QR Transfer", "100% Scam-Free"],
      instantResults: [
        {
          id: "res-tk-1",
          title: "Devara / Kalki 3D (2 Corner Recliner Seats)",
          subtitle: "PVR Forum Mall, Kukatpally • Tonight 9:30 PM",
          detail:
            "Can't make it due to family event. Selling at exact box office price.",
          badge: "Original Price",
          price: "₹350 each",
          avatarBg: "#E11D48",
          actionText: "Claim Tickets",
        },
        {
          id: "res-tk-2",
          title: "Zakir Khan Live Comedy Tour (VIP Front)",
          subtitle: "Shilpakala Vedika • Saturday 7:00 PM",
          detail: "Single front row pass. Transfer via official BookMyShow QR.",
          badge: "Hot Show",
          price: "₹1,200",
          avatarBg: "#8B5CF6",
          actionText: "Chat Seller",
        },
      ],
    };
  }

  // 4. LOST & FOUND, WALLET, PET, KEYS, EMERGENCY, HELP
  if (
    q.includes("lost") ||
    q.includes("found") ||
    q.includes("wallet") ||
    q.includes("keys") ||
    q.includes("pet") ||
    q.includes("dog") ||
    q.includes("blood") ||
    q.includes("emergency") ||
    q.includes("help me") ||
    q.includes("stolen") ||
    q.includes("missing")
  ) {
    const isEmergency = q.includes("blood") || q.includes("emergency");
    return {
      id: "intent-helpme",
      module: "helpme",
      moduleName: isEmergency ? "Emergency Alert" : "HelpMe / Lost & Found",
      badge: isEmergency ? "🚨 Urgent Broadcast" : "📍 5km Local Beacon",
      icon: isEmergency ? "alert-circle" : "search",
      color: "#DC2626",
      bg: "#FEE2E2",
      headline: isEmergency
        ? "Emergency SOS & Blood Request"
        : "Route to HelpMe: Lost & Found Beacon",
      explanation: isEmergency
        ? "Alerts all registered donors and verified neighbors in your 10 km radius immediately."
        : "JUNTO broadcasts your item description to active residents and auto-checks nearby found item posts.",
      route: "/(screens)/ask-nearby",
      queryParams: { category: "lost-found", query: rawQuery },
      actionLabel: isEmergency
        ? "Broadcast SOS to 1,400+ Neighbors"
        : "Broadcast Lost Item Alert",
      secondaryActionLabel: "View Found Items Board",
      secondaryRoute: "/(screens)/ask-nearby",
      tags: ["Instant Beacon", "Community Verified", "Direct Notification"],
      instantResults: [
        {
          id: "res-lf-1",
          title: "Brown Leather Wallet found near Inorbit Starbucks",
          subtitle: "Found by: Vikram R. (1.2 km away) • 45m ago",
          detail:
            "Contains SBI Card and Driving License with name starting with 'R'. Safe with cafe manager.",
          badge: "Potential Match",
          avatarBg: "#059669",
          actionText: "Verify & Claim",
        },
        {
          id: "res-lf-2",
          title: "Active Broadcast: Black Leather Cardholder Lost",
          subtitle: "Reported around Cyber Towers walkway • Reward ₹1,000",
          detail: "32 neighbors currently looking in the area.",
          badge: "Active Search",
          avatarBg: "#DC2626",
          actionText: "Share Info",
        },
      ],
    };
  }

  // 5. VISITING HYDERABAD, ROAM, CITY GUIDE, FOOD SPOTS, TOURIST
  if (
    q.includes("visiting") ||
    q.includes("roam") ||
    q.includes("tourist") ||
    q.includes("travel") ||
    q.includes("places to visit") ||
    q.includes("hyderabad") ||
    q.includes("biryani") ||
    q.includes("charminar") ||
    q.includes("new to city") ||
    q.includes("monument") ||
    q.includes("explore") ||
    q.includes("weekend trip")
  ) {
    return {
      id: "intent-roam",
      module: "roam",
      moduleName: "Roam / City Guide",
      badge: "🌆 Local Insider",
      icon: "compass",
      color: "#0284C7",
      bg: "#E0F2FE",
      headline: "Route to Roam: Hyderabad Insider City Guide",
      explanation:
        "Curated itineraries, authentic food trails, metro navigation, and local host meetups for newcomers and travelers.",
      route: "/(tabs)/explore",
      queryParams: { tab: "roam", q: rawQuery },
      actionLabel: "Explore City Guides & Trails",
      secondaryActionLabel: "Connect with Local Buddy",
      secondaryRoute: "/(screens)/add-daymate",
      tags: ["Curated Food Trails", "Metro Map Included", "Local Host Meetups"],
      instantResults: [
        {
          id: "res-roam-1",
          title: "The Iconic Old City Biryani & Irani Chai Trail",
          subtitle: "Charminar ➔ Nimrah Cafe ➔ Shadab • 4.5 hrs",
          detail:
            "Best timings: 6:00 AM for Osmania biscuits or 8:00 PM for late night haleem & biryani.",
          badge: "Must Try",
          price: "Self-Guided",
          avatarBg: "#0284C7",
          actionText: "View Itinerary",
        },
        {
          id: "res-roam-2",
          title: "Heritage Walk & Golconda Fort Sunset",
          subtitle: "Guided by Hyderabad History Club • Sunday 4:00 PM",
          detail:
            "Meet 14 travelers & locals exploring the acoustic whispers and royal tombs.",
          badge: "Group Meetup",
          price: "Free Entry",
          avatarBg: "#8B5CF6",
          actionText: "Join Walk",
        },
      ],
    };
  }

  // 6. BUY / SELL, DEALS, CYCLE, MOBILE, FURNITURE, IPHONE, GADGETS
  if (
    q.includes("cycle") ||
    q.includes("bicycle") ||
    q.includes("sell") ||
    q.includes("buy") ||
    q.includes("iphone") ||
    q.includes("phone") ||
    q.includes("mobile") ||
    q.includes("furniture") ||
    q.includes("table") ||
    q.includes("laptop") ||
    q.includes("monitor") ||
    q.includes("used") ||
    q.includes("second hand") ||
    q.includes("deals") ||
    q.includes("sofa") ||
    q.includes("fridge") ||
    q.includes("tv")
  ) {
    return {
      id: "intent-deals",
      module: "deals",
      moduleName: "Local Deals",
      badge: "💰 Verified Buy/Sell",
      icon: "pricetag",
      color: "#D97706",
      bg: "#FEF3C7",
      headline: "Route to Local Deals: Nearby Marketplace",
      explanation:
        "JUNTO connected to the verified neighborhood marketplace. Zero listing fees, in-person inspection.",
      route: "/(screens)/deals",
      queryParams: { q: rawQuery },
      actionLabel: "Explore Listed Items",
      secondaryActionLabel: "Sell Your Item (Voice Assist)",
      secondaryRoute: "/(screens)/deals",
      tags: ["In-person Pick up", "Direct Phone / WhatsApp", "Zero Commission"],
      instantResults: [
        {
          id: "res-dl-1",
          title: "Firefox 21-Speed Hybrid Cycle with Shimano Gears",
          subtitle: "Madhapur (1.2 km away) • Seller: Aditya V. (4.9 ★)",
          detail: "Bought 6 months ago. Dual disc brakes, lock & helmet free.",
          badge: "Like New",
          price: "₹6,500",
          avatarBg: "#3B82F6",
          actionText: "Chat / Call",
        },
        {
          id: "res-dl-2",
          title: "Ergonomic Mesh Office Chair (Green Soul)",
          subtitle: "Kondapur (1.8 km away) • Seller: Sneha R. (4.8 ★)",
          detail: "Adjustable lumbar support & armrests. Pristine condition.",
          badge: "Good Deal",
          price: "₹3,200",
          avatarBg: "#10B981",
          actionText: "Make Offer",
        },
      ],
    };
  }

  // 7. DAYMATES, SPORTS, BADMINTON, STUDY PARTNER, CAFE COWORKING, GYM
  if (
    q.includes("partner") ||
    q.includes("buddy") ||
    q.includes("mate") ||
    q.includes("badminton") ||
    q.includes("cricket") ||
    q.includes("football") ||
    q.includes("gym") ||
    q.includes("study") ||
    q.includes("upsc") ||
    q.includes("code") ||
    q.includes("cowork") ||
    q.includes("coffee") ||
    q.includes("someone to") ||
    q.includes("hangout")
  ) {
    return {
      id: "intent-daymates",
      module: "daymates",
      moduleName: "DayMates",
      badge: "🤝 Activity Companion",
      icon: "people",
      color: "#16A34A",
      bg: "#DCFCE7",
      headline: "Route to DayMates: Activity & Hobby Buddies",
      explanation:
        "Find like-minded people nearby for badminton games, weekend cycling, study sessions, or cafe co-working.",
      route: "/(screens)/add-daymate",
      queryParams: { q: rawQuery },
      actionLabel: "Find DayMates Nearby",
      secondaryActionLabel: "Create DayMate Request",
      secondaryRoute: "/(screens)/add-daymate",
      tags: ["Interest Match", "Verified Profiles", "Safe Public Spots"],
      instantResults: [
        {
          id: "res-dm-1",
          title: "Badminton Doubles (Intermediate / Advanced)",
          subtitle: "Flying Lotus Arena, Kondapur • Today 7:30 PM",
          detail: "Need 1 player to complete our 4-player slot. Court booked.",
          badge: "Slot Open",
          price: "Split ₹150",
          avatarBg: "#16A34A",
          actionText: "Join Game",
        },
        {
          id: "res-dm-2",
          title: "Quiet Cafe Co-working & Coding Session",
          subtitle: "Roastery Coffee House, Jubilee Hills • Tomorrow 10:00 AM",
          detail:
            "Working on React / Flutter apps. Great coffee & productive vibes.",
          badge: "2 Attending",
          price: "Free",
          avatarBg: "#8B5CF6",
          actionText: "Connect",
        },
      ],
    };
  }

  // DEFAULT / GENERAL SMART EXPLORER
  return {
    id: "intent-general",
    module: "chats",
    moduleName: "Universal Assistant",
    badge: "✨ Smart Router",
    icon: "sparkles",
    color: "#6366F1",
    bg: "#EEF2FF",
    headline: `Smart Routing for: "${rawQuery}"`,
    explanation:
      "JUNTO analyzed your query. Browse matched community threads, ask neighbors, or view trending activities.",
    route: "/(screens)/ask-nearby",
    queryParams: { q: rawQuery },
    actionLabel: "Ask 1,400+ Nearby Neighbors",
    secondaryActionLabel: "Explore All Modules",
    secondaryRoute: "/(tabs)/explore",
    tags: ["Community Powered", "Fast Answers", "Local Context"],
    instantResults: [
      {
        id: "res-gen-1",
        title: `Community Discussion: "${rawQuery}"`,
        subtitle: "Active in Madhapur & Hitec City • 8 replies",
        detail:
          "Neighbors regularly share recommendations and live updates on this topic.",
        badge: "Active",
        avatarBg: "#6366F1",
        actionText: "View Post",
      },
    ],
  };
}
