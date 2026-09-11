import { localServicesRepository } from "../repositories/LocalServices.repository";
import { rideRepository } from "../repositories/Rides.repository";
import { ticketRepository } from "../repositories/Ticket.repository";
import { dealsRepository } from "../repositories/Deals.repository";
import { activityRepository } from "../repositories/Activity.repository";
import { ActivityCategory } from "../entities/Activity.entity";
import { routeUserIntent } from "./aiRouter";

export interface UniversalNeedResultItem {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  badge: string;
  price?: string;
  actionText: string;
  route: string;
  phone?: string;
  entityType: "LocalService" | "Ride" | "Ticket" | "LocalDeal" | "Activity";
  meta?: Record<string, any>;
}

export interface UniversalNeedResponse {
  query: string;
  module: "services" | "rides" | "tickets" | "deals" | "helpme" | "daymates";
  moduleName: string;
  badge: string;
  headline: string;
  explanation: string;
  source: "database";
  entityCount: number;
  instantResults: UniversalNeedResultItem[];
}

export async function queryUniversalNeedFromDb(
  rawQuery: string,
): Promise<UniversalNeedResponse> {
  const query = (rawQuery || "").trim();
  const q = query.toLowerCase();

  // AI Intent Router (OpenRouter -> Gemini -> Entity Code Logic)
  const intent = await routeUserIntent(query);

  // 1. Check for Rides intent
  if (
    intent.module === "rides" ||
    q.includes("vijayawada") ||
    q.includes("bengaluru") ||
    q.includes("bangalore") ||
    q.includes("airport") ||
    q.includes("carpool") ||
    q.includes("ride") ||
    q.includes("go to") ||
    q.includes("travel to") ||
    q.includes("drive to")
  ) {
    const rides = await rideRepository.findAll();
    let matchedRides = rides;

    if (q.includes("vijayawada")) {
      matchedRides = rides.filter((r) =>
        r.to.toLowerCase().includes("vijayawada"),
      );
    } else if (q.includes("bengaluru") || q.includes("bangalore")) {
      matchedRides = rides.filter(
        (r) =>
          r.to.toLowerCase().includes("bengaluru") ||
          r.to.toLowerCase().includes("bangalore"),
      );
    } else if (q.includes("airport")) {
      matchedRides = rides.filter((r) =>
        r.to.toLowerCase().includes("airport"),
      );
    }

    const instantResults: UniversalNeedResultItem[] = matchedRides
      .slice(0, 3)
      .map((ride) => ({
        id: ride.id,
        title: `${ride.from} ➔ ${ride.to}`,
        subtitle: `${ride.time} • Driver: ${ride.driverName} (★ ${ride.driverRating})`,
        detail: ride.notes || `Available ${ride.vehicleType} carpool.`,
        badge: `${ride.seatsLeft} Seats Left`,
        price: ride.price,
        actionText: "Join Ride",
        route: "/(tabs)/rides",
        entityType: "Ride",
        meta: {
          driverName: ride.driverName,
          vehicleType: ride.vehicleType,
          seatsLeft: ride.seatsLeft,
        },
      }));

    return {
      query,
      module: "rides",
      moduleName: "RideMate Carpool",
      badge: "🚗 Verified Carpools",
      headline:
        instantResults.length > 0
          ? `Found ${instantResults.length} Active Verified Rides in Database`
          : "No Matching Rides Found in Database",
      explanation:
        instantResults.length > 0
          ? "Retrieved real-time active ride shares and carpools matching your destination."
          : "No carpools currently match your specific destination in the database.",
      source: "database",
      entityCount: matchedRides.length,
      instantResults,
    };
  }

  // 2. Check for Tickets intent
  if (
    q.includes("ticket") ||
    q.includes("movie") ||
    q.includes("kalki") ||
    q.includes("devara") ||
    q.includes("sunburn") ||
    q.includes("concert") ||
    q.includes("ipl") ||
    q.includes("show") ||
    q.includes("cinema") ||
    q.includes("pvr")
  ) {
    const tickets = await ticketRepository.findAll();
    let matchedTickets = tickets;

    if (q.includes("kalki")) {
      matchedTickets = tickets.filter((t) =>
        t.eventName.toLowerCase().includes("kalki"),
      );
    } else if (q.includes("devara")) {
      matchedTickets = tickets.filter((t) =>
        t.eventName.toLowerCase().includes("devara"),
      );
    } else if (q.includes("concert") || q.includes("sunburn")) {
      matchedTickets = tickets.filter(
        (t) =>
          t.category.toLowerCase().includes("concert") ||
          t.eventName.toLowerCase().includes("sunburn"),
      );
    } else if (q.includes("ipl") || q.includes("cricket")) {
      matchedTickets = tickets.filter(
        (t) =>
          t.category.toLowerCase().includes("sports") ||
          t.eventName.toLowerCase().includes("ipl"),
      );
    }

    // Tickets matching (no fallback to unrelated categories)
    const instantResults: UniversalNeedResultItem[] = matchedTickets
      .slice(0, 3)
      .map((t) => ({
        id: t.id,
        title: t.eventName,
        subtitle: `${t.category} • ${t.section || "General Seating"} • Tonight / Live`,
        detail:
          t.description ||
          "Direct digital ticket transfer with secure escrow check.",
        badge: "Instant Transfer",
        price: `₹${t.price}`,
        actionText: "Swap Ticket",
        route: "/(tabs)/tickets",
        entityType: "Ticket",
        meta: {
          category: t.category,
          section: t.section,
        },
      }));

    return {
      query,
      module: "tickets",
      moduleName: "TicketSwap Marketplace",
      badge: "🎟️ Verified Ticket Inventory",
      headline:
        instantResults.length > 0
          ? `Found ${instantResults.length} Available Tickets in Database`
          : "No Matching Tickets Found in Database",
      explanation:
        instantResults.length > 0
          ? "Retrieved verified digital event tickets directly from registered community sellers."
          : "No event tickets currently match your query in the database.",
      source: "database",
      entityCount: matchedTickets.length,
      instantResults,
    };
  }

  // 3. Check for Deals / Buy & Sell intent
  if (
    q.includes("cycle") ||
    q.includes("bicycle") ||
    q.includes("used") ||
    q.includes("buy") ||
    q.includes("sell") ||
    q.includes("second hand") ||
    q.includes("headphones") ||
    q.includes("gadget") ||
    q.includes("deals")
  ) {
    const deals = await dealsRepository.findAll();
    let matchedDeals = deals;

    if (q.includes("cycle") || q.includes("bicycle")) {
      matchedDeals = deals.filter(
        (d) =>
          d.title.toLowerCase().includes("cycle") ||
          d.category?.toLowerCase().includes("cycle"),
      );
    } else if (q.includes("headphone") || q.includes("sony")) {
      matchedDeals = deals.filter(
        (d) =>
          d.title.toLowerCase().includes("headphone") ||
          d.title.toLowerCase().includes("sony"),
      );
    }

    const instantResults: UniversalNeedResultItem[] = matchedDeals
      .slice(0, 3)
      .map((deal) => {
        const discount =
          deal.originalPrice > deal.dealPrice
            ? `${Math.round(((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100)}% Off`
            : "Verified Deal";
        return {
          id: deal.id,
          title: deal.title,
          subtitle: `${deal.businessName} • ${deal.locationName}`,
          detail: deal.description,
          badge: discount,
          price: `₹${deal.dealPrice.toLocaleString("en-IN")}`,
          actionText: "View Deal",
          route: "/(tabs)/deals",
          entityType: "LocalDeal",
          meta: {
            category: deal.category,
            originalPrice: deal.originalPrice,
          },
        };
      });

    return {
      query,
      module: "deals",
      moduleName: "Local Deals & Marketplace",
      badge: "🏷️ Verified Community Deals",
      headline:
        instantResults.length > 0
          ? `Found ${instantResults.length} Items Listed in Database`
          : "No Matching Deals Found in Database",
      explanation:
        instantResults.length > 0
          ? "Retrieved active pre-owned listings and local community deals."
          : "No marketplace listings currently match your query in the database.",
      source: "database",
      entityCount: matchedDeals.length,
      instantResults,
    };
  }

  // 4. Check for Lost & Found / Emergency / Ask Nearby intent
  if (
    q.includes("lost") ||
    q.includes("wallet") ||
    q.includes("emergency") ||
    q.includes("blood") ||
    q.includes("missing") ||
    q.includes("help")
  ) {
    const activities = await activityRepository.findAll();
    const askNearbyItems = activities.filter(
      (a) =>
        a.category === ActivityCategory.ASK_NEARBY ||
        (a.tags &&
          a.tags.some(
            (t) =>
              t.toLowerCase().includes("wallet") ||
              t.toLowerCase().includes("lost") ||
              t.toLowerCase().includes("urgent"),
          )),
    );

    const instantResults: UniversalNeedResultItem[] = askNearbyItems
      .slice(0, 3)
      .map((act) => ({
        id: act.id,
        title: act.title,
        subtitle: `${act.locationName} • Broadcasted to active neighbors`,
        detail: act.description,
        badge: "Urgent Nearby",
        price: "Community Help",
        actionText: "Help Out",
        route: "/(tabs)/activities",
        entityType: "Activity",
        meta: {
          category: act.category,
          locationName: act.locationName,
        },
      }));

    return {
      query,
      module: "helpme",
      moduleName: "Ask Nearby & Community Help",
      badge: "🚨 Community Broadcast",
      headline:
        instantResults.length > 0
          ? `Found ${instantResults.length} Active Local Alerts in Database`
          : "No Active Community Alerts Found",
      explanation:
        instantResults.length > 0
          ? "Connected to community broadcast network for urgent and lost-and-found items."
          : "No urgent alerts or lost-and-found posts currently match your search in the database.",
      source: "database",
      entityCount: askNearbyItems.length,
      instantResults,
    };
  }

  // 5. Check for DayMates / Sports / Activity / City Explore intent
  if (
    q.includes("badminton") ||
    q.includes("partner") ||
    q.includes("visiting") ||
    q.includes("hyderabad") ||
    q.includes("tomorrow") ||
    q.includes("sports") ||
    q.includes("walk") ||
    q.includes("heritage") ||
    q.includes("food tour")
  ) {
    const activities = await activityRepository.findAll();
    let matchedActivities: typeof activities = [];

    if (q.includes("badminton")) {
      matchedActivities = activities.filter(
        (a) =>
          a.category === ActivityCategory.SPORTS ||
          a.title.toLowerCase().includes("badminton") ||
          (a.tags && a.tags.some((t) => t.toLowerCase().includes("badminton"))),
      );
    } else if (q.includes("visiting") || q.includes("hyderabad")) {
      matchedActivities = activities.filter(
        (a) =>
          a.category === ActivityCategory.DAY_MATES ||
          a.title.toLowerCase().includes("hyderabad") ||
          a.title.toLowerCase().includes("walk"),
      );
    } else {
      matchedActivities = activities;
    }

    const instantResults: UniversalNeedResultItem[] = matchedActivities
      .slice(0, 3)
      .map((act) => ({
        id: act.id,
        title: act.title,
        subtitle: `${act.locationName} • ${act.remainingSeats || 2} spots open`,
        detail: act.description,
        badge:
          act.category === ActivityCategory.SPORTS
            ? "Sports Match"
            : "Social Meetup",
        price: act.cost > 0 ? `₹${act.cost} share` : "Free Entry",
        actionText: "Join Activity",
        route: "/(tabs)/activities",
        entityType: "Activity",
        meta: {
          category: act.category,
          seats: act.remainingSeats,
        },
      }));

    return {
      query,
      module: "daymates",
      moduleName: "DayMates Social & Sports",
      badge: "👥 Active Activity Buddies",
      headline:
        instantResults.length > 0
          ? `Found ${instantResults.length} Open Activities in Database`
          : "No Matching Activities Found in Database",
      explanation:
        instantResults.length > 0
          ? "Retrieved live activity groups and partner requests from the community database."
          : "No active social or sports activities currently match your query in the database.",
      source: "database",
      entityCount: matchedActivities.length,
      instantResults,
    };
  }

  // 6. Local Services & Repairs
  // Uses cluster ("auto" | "fix" | "glam" | "home") and categories from LocalServices.entity.ts
  const services = await localServicesRepository.findAllServices();
  const targetCluster = intent.cluster;
  const targetCategory = (intent.category || "").toLowerCase();
  const intentKeywords = (intent.keywords || []).map((k) => k.toLowerCase());

  // Score each service for maximum semantic relevance
  const scored = services.map((s) => {
    let score = 0;
    const cat = (s.category || "").toLowerCase();
    const name = (s.name || s.title || "").toLowerCase();
    const desc = (s.description || "").toLowerCase();
    const cluster = (s.cluster || "").toLowerCase();
    const text = `${cat} ${name} ${desc} ${cluster}`;

    // Cluster constraint: if targetCluster is identified, require cluster match or strong category match
    if (targetCluster) {
      if (cluster === targetCluster) {
        score += 50;
      } else if (
        targetCategory &&
        (cat === targetCategory || cat.includes(targetCategory))
      ) {
        score += 40;
      } else {
        // Different cluster without category match -> exclude
        return { service: s, score: 0 };
      }
    }

    // Exact or partial category match
    if (targetCategory) {
      if (cat === targetCategory) score += 60;
      else if (cat.includes(targetCategory) || targetCategory.includes(cat)) {
        score += 45;
      }
    }

    // Auto / Bike / Mechanic domain signals
    if (
      q.includes("bike") ||
      q.includes("mechanic") ||
      q.includes("puncture") ||
      q.includes("motorcycle") ||
      q.includes("two wheeler") ||
      q.includes("scooter") ||
      q.includes("activa")
    ) {
      if (
        cat.includes("bike") ||
        cat.includes("puncture") ||
        cat.includes("auto") ||
        cluster === "auto"
      ) {
        score += 60;
      }
      if (
        name.includes("auto") ||
        name.includes("mech") ||
        name.includes("puncture") ||
        name.includes("rajesh")
      ) {
        score += 40;
      }
      if (
        desc.includes("bike") ||
        desc.includes("puncture") ||
        desc.includes("tubeless") ||
        desc.includes("servicing")
      ) {
        score += 30;
      }
    } else if (
      q.includes("tiffin") ||
      q.includes("cook") ||
      q.includes("meal")
    ) {
      if (
        cat.includes("cook") ||
        text.includes("tiffin") ||
        text.includes("meal") ||
        cluster === "home"
      ) {
        score += 50;
      }
    } else if (q.includes("electric") || q.includes("wiring")) {
      if (
        cat.includes("electric") ||
        text.includes("electric") ||
        cluster === "fix"
      ) {
        score += 50;
      }
    } else if (
      q.includes("plumb") ||
      q.includes("leak") ||
      q.includes("pipe")
    ) {
      if (
        cat.includes("plumb") ||
        text.includes("pipe") ||
        text.includes("leak") ||
        cluster === "fix"
      ) {
        score += 50;
      }
    } else if (q.includes("ac") || q.includes("cool")) {
      if (cat.includes("ac") || text.includes("cooling") || cluster === "fix") {
        score += 50;
      }
    } else if (q.includes("clean")) {
      if (
        cat.includes("clean") ||
        text.includes("cleaning") ||
        cluster === "home"
      ) {
        score += 50;
      }
    } else if (
      q.includes("makeup") ||
      q.includes("bridal") ||
      q.includes("glam")
    ) {
      if (
        cat.includes("makeup") ||
        cat.includes("bridal") ||
        cluster === "glam"
      ) {
        score += 50;
      }
    }

    // Specific domain keyword tokens (excluding generic words like "service", "repair", "clinic", "near", "need")
    const genericWords = new Set([
      "need",
      "near",
      "want",
      "looking",
      "for",
      "the",
      "and",
      "please",
      "some",
      "service",
      "services",
      "repair",
      "repairs",
      "clinic",
    ]);
    for (const kw of intentKeywords) {
      if (kw.length >= 3 && !genericWords.has(kw)) {
        if (cat.includes(kw)) score += 25;
        if (name.includes(kw)) score += 20;
        if (desc.includes(kw)) score += 10;
      }
    }

    return { service: s, score };
  });

  const matchedServices = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.service);

  const instantResults: UniversalNeedResultItem[] = matchedServices
    .slice(0, 3)
    .map((s) => {
      const record = localServicesRepository.toRecord(s);
      return {
        id: record.id,
        title: record.name,
        subtitle: `${record.category} • ${record.distance || "Nearby"} • ★ ${record.rating} (${record.reviewsCount} reviews)`,
        detail:
          record.description ||
          "Licensed, vetted and available for doorstep service.",
        badge: record.verified ? "Verified Pro" : "Available Today",
        price: record.rate,
        actionText: "Call Pro",
        route: "/localservices",
        phone: record.phone,
        entityType: "LocalService",
        meta: {
          rating: record.rating,
          phone: record.phone,
          category: record.category,
        },
      };
    });

  const specificLabel =
    targetCluster === "auto" || q.includes("bike") || q.includes("mechanic")
      ? "Bike Mechanics"
      : targetCluster === "glam" || q.includes("makeup")
        ? "Beauty & Glam Experts"
        : targetCluster === "home" || q.includes("clean") || q.includes("cook")
          ? "Home Food & Helpers"
          : targetCluster === "fix" ||
              q.includes("electric") ||
              q.includes("plumb")
            ? "Technicians & Pros"
            : "Verified Professionals";

  return {
    query,
    module: "services",
    moduleName: "Local Pro Services & Repairs",
    badge: "⚡ Verified Direct Pros",
    headline:
      instantResults.length > 0
        ? `Found ${instantResults.length} ${specificLabel} in Database`
        : `No ${specificLabel} Found in Database`,
    explanation:
      instantResults.length > 0
        ? `Connected directly to local services database: verified professionals ready for on-demand dispatch.`
        : `No registered ${specificLabel.toLowerCase()} currently match your query in the database.`,
    source: "database",
    entityCount: matchedServices.length,
    instantResults,
  };
}
