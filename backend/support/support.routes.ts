import express from "express";
import { verifyAccessToken } from "../auth/jwt.service";
import { supportChatRepository } from "../repositories/SupportChat.repository";
import { rideRepository } from "../repositories/Rides.repository";
import { activityRepository } from "../repositories/Activity.repository";
import { ticketRepository } from "../repositories/Ticket.repository";
import { dealsRepository } from "../repositories/Deals.repository";
import { localServicesRepository } from "../repositories/LocalServices.repository";
import { auditRepository } from "../repositories/Audit.repository";
import { ActivityCategory } from "../entities/Activity.entity";

const router = express.Router();

function getUserIdFromAuth(req: express.Request): string | null {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      return payload?.uid || null;
    }
  } catch {
    // invalid or missing token
  }
  return null;
}

// In-memory store for support cases / requests
export interface SupportCase {
  caseNumber: string;
  userId: string;
  sessionId?: string;
  category: string;
  issueType: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntitySummary?: string;
  summary: string;
  details?: string;
  status: "Under Review" | "In Progress" | "Resolved";
  createdAt: string;
  estimatedResponseTime: string;
  urgentSafety?: boolean;
}

const supportCasesStore = new Map<string, SupportCase>();

// Dynamic Category & Issue Configuration
export const SUPPORT_CONFIG = {
  greeting:
    "Hi! 👋 Welcome to Junto Support.\n\nWhat can I help you with today?",
  categories: [
    {
      id: "rides",
      label: "Rides",
      icon: "car-sport",
      emoji: "🚗",
      color: "#10B981",
      prompt: "Sure! What do you need help with regarding rides?",
      issues: [
        {
          id: "offer_ride",
          label: "I want to offer a ride.",
          actionType: "navigate",
          route: "app://rides?tab=offer",
          actionLabel: "Open Offer Ride",
          botResponse:
            "You can offer a ride directly from Junto!\n\nTap below to share your route, choose car or bike, set your available seats and price per seat.",
        },
        {
          id: "requested_seat",
          label: "I requested a seat.",
          actionType: "select_record",
          entityType: "ride",
          filter: "requested",
          botPrompt: "Got it! Which ride did you request a seat for?",
        },
        {
          id: "ride_confirmed",
          label: "My ride is confirmed.",
          actionType: "select_record",
          entityType: "ride",
          filter: "confirmed",
          botPrompt: "Okay! Which ride are you referring to?",
        },
        {
          id: "select_ride",
          label: "Select a specific ride.",
          actionType: "select_record",
          entityType: "ride",
          filter: "all",
          botPrompt: "Which ride would you like help with?",
        },
        {
          id: "driver_no_show",
          label: "Driver didn't arrive.",
          actionType: "select_record",
          entityType: "ride",
          filter: "all",
          botPrompt: "Sorry about that! Which ride did this happen with?",
        },
        {
          id: "cancel_ride",
          label: "I want to cancel my ride.",
          actionType: "select_record",
          entityType: "ride",
          filter: "active",
          botPrompt:
            "I can help with that. Which ride would you like to cancel?",
        },
        {
          id: "payment_issue",
          label: "Payment-related issue.",
          actionType: "select_record",
          entityType: "ride",
          filter: "all",
          botPrompt: "Which ride had a payment-related issue?",
        },
        {
          id: "rides_other",
          label: "Something else.",
          actionType: "chat_input",
          botPrompt:
            "Please describe what's going on with your ride, and I'll assist you right away.",
        },
      ],
    },
    {
      id: "daymates",
      label: "DayMates",
      icon: "people",
      emoji: "🤝",
      color: "#8B5CF6",
      prompt: "Sure! What do you need help with regarding DayMates?",
      issues: [
        {
          id: "finding_people",
          label: "Finding people nearby.",
          actionType: "navigate",
          route: "app://explore",
          actionLabel: "Explore DayMates",
          botResponse:
            "You can discover companions for walking, coffee, gym, and movies on the Explore tab!",
        },
        {
          id: "creating_activity",
          label: "Creating an activity.",
          actionType: "navigate",
          route: "app://add-daymate",
          actionLabel: "Create DayMate Activity",
          botResponse:
            "Creating an activity takes less than a minute! Set your activity type, location, and date to find companion buddies.",
        },
        {
          id: "someone_no_show",
          label: "Someone didn't attend.",
          actionType: "select_record",
          entityType: "activity",
          botPrompt:
            "We're sorry that happened! Which activity did someone not attend?",
        },
        {
          id: "inappropriate_behaviour",
          label: "Inappropriate behaviour.",
          actionType: "escalate_safety",
          entityType: "activity",
          botPrompt:
            "Community safety is our highest priority. Which activity or member is this regarding?",
        },
        {
          id: "activity_issue",
          label: "Activity-related issue.",
          actionType: "select_record",
          entityType: "activity",
          botPrompt: "Which activity are you experiencing an issue with?",
        },
        {
          id: "daymates_other",
          label: "Something else.",
          actionType: "chat_input",
          botPrompt:
            "Please tell me what you need assistance with regarding DayMates.",
        },
      ],
    },
    {
      id: "services",
      label: "Services",
      icon: "construct",
      emoji: "💇",
      color: "#3B82F6",
      prompt: "Sure! What do you need help with regarding services?",
      issues: [
        {
          id: "finding_provider",
          label: "Finding a service provider.",
          actionType: "navigate",
          route: "app://services",
          actionLabel: "Browse Local Services",
          botResponse:
            "You can browse verified local electricians, plumbers, repair technicians, and beauty professionals directly on Junto Services!",
        },
        {
          id: "existing_booking",
          label: "Existing booking.",
          actionType: "chat_input",
          botPrompt:
            "Which service booking or technician do you have questions about?",
        },
        {
          id: "provider_no_show",
          label: "Provider didn't arrive.",
          actionType: "escalate",
          entityType: "service",
          botPrompt:
            "We apologize for the inconvenience. Which scheduled service appointment had a no-show?",
        },
        {
          id: "cancellation",
          label: "Cancellation.",
          actionType: "chat_input",
          botPrompt:
            "Which service booking would you like to cancel or reschedule?",
        },
        {
          id: "service_quality",
          label: "Service quality issue.",
          actionType: "escalate",
          entityType: "service",
          botPrompt:
            "We hold service partners to strict standards. Which service was unsatisfactory?",
        },
        {
          id: "services_other",
          label: "Something else.",
          actionType: "chat_input",
          botPrompt:
            "Please let us know how we can help with your service request.",
        },
      ],
    },
    {
      id: "tickets",
      label: "Movie Tickets",
      icon: "ticket",
      emoji: "🎟️",
      color: "#F97316",
      prompt: "Sure! What do you need help with regarding movie tickets?",
      issues: [
        {
          id: "buying_ticket",
          label: "Buying a ticket.",
          actionType: "navigate",
          route: "app://explore",
          actionLabel: "Browse Ticket Deals",
          botResponse:
            "Looking to grab movie or event tickets? Check out direct listings from fellow users on the Explore tab!",
        },
        {
          id: "selling_ticket",
          label: "Selling a ticket.",
          actionType: "navigate",
          route: "app://add-ticket",
          actionLabel: "Sell / Swap Ticket",
          botResponse:
            "Plans changed? Avoid complete loss by posting your spare movie or event tickets directly on Junto!",
        },
        {
          id: "ticket_transfer",
          label: "Ticket transfer problem.",
          actionType: "select_record",
          entityType: "ticket",
          botPrompt:
            "Which ticket listing or transfer are you experiencing an issue with?",
        },
        {
          id: "payment_issue",
          label: "Payment issue.",
          actionType: "select_record",
          entityType: "ticket",
          botPrompt: "Which ticket transaction has a payment issue?",
        },
        {
          id: "ticket_not_received",
          label: "Ticket not received.",
          actionType: "escalate",
          entityType: "ticket",
          botPrompt: "Which ticket did you purchase that was not received?",
        },
        {
          id: "tickets_other",
          label: "Something else.",
          actionType: "chat_input",
          botPrompt: "Please describe your ticket-related question or problem.",
        },
      ],
    },
    {
      id: "deals",
      label: "LocalDeals",
      icon: "pricetag",
      emoji: "🏷️",
      color: "#F59E0B",
      prompt: "Sure! What do you need help with regarding LocalDeals?",
      issues: [
        {
          id: "finding_deals",
          label: "Finding deals.",
          actionType: "navigate",
          route: "app://deals",
          actionLabel: "Open Local Deals",
          botResponse:
            "Discover pre-owned electronics, furniture, books, and gear in your immediate neighborhood with verified neighbors!",
        },
        {
          id: "purchasing_deal",
          label: "Purchasing a deal.",
          actionType: "chat_input",
          botPrompt:
            "To buy a deal, open the item on the Deals marketplace and tap 'Make Deal' or message the seller directly. How can I help?",
        },
        {
          id: "redemption_problem",
          label: "Redemption problem.",
          actionType: "select_record",
          entityType: "deal",
          botPrompt:
            "Which deal listing or seller is this redemption issue related to?",
        },
        {
          id: "deal_unavailable",
          label: "Deal unavailable.",
          actionType: "select_record",
          entityType: "deal",
          botPrompt: "Which deal listing was reported unavailable?",
        },
        {
          id: "deals_other",
          label: "Something else.",
          actionType: "chat_input",
          botPrompt: "Please describe your question or issue with Local Deals.",
        },
      ],
    },
    {
      id: "helpme",
      label: "HelpMe",
      icon: "megaphone",
      emoji: "🆘",
      color: "#EC4899",
      prompt: "Sure! What do you need help with regarding HelpMe (Ask Nearby)?",
      issues: [
        {
          id: "immediate_help",
          label: "I need immediate nearby help.",
          actionType: "navigate",
          route: "app://ask-nearby",
          actionLabel: "Ask Nearby Broadcast",
          botResponse:
            "If you need immediate neighborhood assistance (such as blood donation, lost keys, or urgent medicine), broadcast a request on Ask Nearby!",
        },
        {
          id: "requested_help",
          label: "I requested help.",
          actionType: "select_record",
          entityType: "asknearby",
          botPrompt: "Which help request did you broadcast?",
        },
        {
          id: "nobody_responded",
          label: "Nobody responded.",
          actionType: "select_record",
          entityType: "asknearby",
          botPrompt:
            "We're sorry nobody has responded yet. Which request was it? I can help boost or resolve it.",
        },
        {
          id: "safety_concern",
          label: "I have a safety concern.",
          actionType: "escalate_safety",
          botPrompt:
            "Your safety is our urgent concern. Please describe what happened so our trust & safety team can take action immediately.",
        },
        {
          id: "helpme_other",
          label: "Something else.",
          actionType: "chat_input",
          botPrompt: "Please share what you need help with on Ask Nearby.",
        },
      ],
    },
    {
      id: "account",
      label: "Account & General",
      icon: "person",
      emoji: "👤",
      color: "#6366F1",
      prompt: "Sure! What account or general question do you have?",
      issues: [
        {
          id: "login_problem",
          label: "Login problem.",
          actionType: "chat_input",
          botPrompt:
            "Are you having trouble with Google Sign-In, session expiration, or switching accounts?",
        },
        {
          id: "profile_problem",
          label: "Profile problem.",
          actionType: "navigate",
          route: "app://profile",
          actionLabel: "Manage Profile",
          botResponse:
            "You can update your name, avatar, bio, and settings directly in Profile -> Edit Profile.",
        },
        {
          id: "notifications",
          label: "Notifications.",
          actionType: "chat_input",
          botPrompt:
            "Are you missing push notifications or having trouble with message alerts?",
        },
        {
          id: "app_not_working",
          label: "App not working.",
          actionType: "escalate",
          botPrompt:
            "What issues are you seeing (e.g. app freezing, blank screen, or error popup)? Let us know and we'll escalate a technical ticket.",
        },
        {
          id: "general_question",
          label: "General question.",
          actionType: "chat_input",
          botPrompt: "Ask me anything about Junto, and I'll be glad to help!",
        },
        {
          id: "account_other",
          label: "Something else.",
          actionType: "chat_input",
          botPrompt: "Please describe your question or issue.",
        },
      ],
    },
  ],
};

const PROJECT_KNOWLEDGE_BASE = `
DayMates (formerly Junto) App Knowledge Base & Customer Support Guidelines:

1. ABOUT DAYMATES (JUNTO):
Junto is a direct community connection platform for finding activity companions ("DayMates"), discovering local events, asking nearby locals real-time questions, arranging peer carpool rides ("RideMate"), finding verified local technicians & doorstep services, and buying/selling/swapping event or movie tickets directly between buyers and sellers.

2. KEY FEATURES & HOW THEY WORK:
- **DayMates (Social Activities)**: Users can post or join activities like grabbing coffee, gym sessions, walking, sports, games, lunch, or dining out. Users can delete their activities anytime from Profile -> Activities.
- **Ticket Swap & Marketplace**: Users can buy, sell, or swap tickets for movies, concerts, and events. If someone drops plans to watch a movie or attend an event, they can avoid complete loss and offer the ticket to someone else, so buyer and seller mutually benefit through direct peer connection.
- **RideMate (Carpool & Bike Pool)**:
  - Connect directly with drivers or riders heading your way.
  - Active Vehicle Protection: If a vehicle is in transit or in ride progress state, the user cannot create another ride with the same vehicle number.
  - Pickup Travel Sequence: Only after the ride owner clicks "I'm traveling to pickup location" will the button be enabled for the co-rider to start travelling to pickup.
  - OTP Verification & Status: Co-riders receive a unique 4-digit OTP displayed directly on their screen. When meeting at the pickup point, the driver verifies the OTP.
- **Local Services (Technicians)**: Verified local technicians register on Junto.
- **Local Deals Marketplace**: Discover and offer deals for pre-owned items.
- **Ask Nearby**: Broadcast real-time urgent queries to nearby locals (blood donation, lost keys/mobile/bag, medicine emergencies) with Urgency levels (Urgent, Soon, Not urgent).
- **Safety & Verification**: Verified profiles, Trust Scores, and public meetup safety guidelines.

3. IN-APP DEEP LINKS FOR USER NAVIGATION:
- Post / Offer a Ride: [🚗 Open Offer Ride](app://rides?tab=offer)
- Find / Search a Ride: [🔍 Find Available Rides](app://rides?tab=find)
- Sell / Swap Ticket: [🎟️ Sell / Swap Ticket](app://add-ticket)
- Create Social Activity / Hangout: [👥 Create DayMate Activity](app://add-daymate)
- Ask Nearby Neighbors / Emergency: [📢 Broadcast Request](app://ask-nearby)
- Local Deals Marketplace: [🏷️ Open Local Deals](app://deals)
- Local Services & Technicians: [🔧 Browse Local Services](app://services)
- Explore Hub: [🧭 Explore Junto](app://explore)
- User Profile: [👤 My Profile](app://profile)

4. ASSISTANT GUIDELINES:
- Greet warmly and concisely.
- Be empathetic and proactive. Ask only ONE question at a time.
- If user provides specific ride or activity context, reference it directly.
- If unable to resolve automatically or if human investigation is needed, offer:
  "I couldn't resolve this automatically. Would you like me to raise a support request for our team?"

5. HUMAN COMMON SENSE & CRITICAL REASONING (ACT AS A SMART, LOGICAL HUMAN AGENT):
- You must always think and reason like an intelligent, observant human customer support specialist, NOT a mindless script.
- Always check the status and details of any selected record before responding.
- RIDE STATUS LOGIC (CRITICAL):
  * When a user references or selects a ride whose status is 'completed' (or 'ended'/'finished') and states or selects "Driver didn't arrive", "driver didn't come", "driver didn't show", "no show", etc.:
    ACT LIKE A REAL HUMAN: A driver cannot fail to arrive for a ride that has already concluded and is marked as 'completed'! That claim is obsolete and contradictory for a completed ride.
    Do NOT blindly apologize that the driver didn't arrive. Instead, politely and naturally point out the logical contradiction:
    "Wait a moment—looking at your trip history, this ride from [From] to [To] is already marked as Completed. How could the driver not have arrived for a completed ride? Once a trip is completed, it has already concluded. Did you select this ride by mistake instead of an upcoming one, or did the driver falsely mark the ride as completed without actually picking you up? Please let me know so I can investigate properly!"
  * If the user clarifies that the driver falsely marked it completed without picking them up (fraud/misconduct), take it seriously as a severe violation and offer an immediate urgent Trust & Safety escalation.
  * If the user selected the wrong ride by mistake, guide them to specify or select the correct ride.
  * Driver no-show is only valid for scheduled or active rides (status: 'active', 'confirmed', 'both_travelling').
- Always apply this common-sense check to any contradictory user inputs across all categories.

6. HANDLING UNUSUAL, SILLY, CURIOUS, OR "DUMB" QUESTIONS:
- The agent must ALWAYS respond with grace, warmth, patience, and professional courtesy. NEVER insult, scold, mock, or dismiss the user.
- A user may ask playful, bizarre, or impossible questions (e.g., "can my dog drive?", "can I carpool to the moon?", "are you a human or AI?", "give me free money", "can you marry me?", "is this Uber?"):
  * Respond with a polite, good-humored, and friendly tone, acknowledging their question with a warm smile, while gently bringing them back to how Junto helps in the real world.
  * Example: "Haha, as much as our team loves space exploration, trips to the moon are still in development! 😄 Right here on Earth, Junto connects verified neighbors for daily carpools, local activities, and home services. How can I help you with a real ride or booking today?"
- If the question is very basic, repetitive, or obvious (e.g. "what is a car?", "why do I need an OTP?", "what does this button do?"):
  * Answer simply, clearly, and encouragingly without condescension.
  * Example: "Great question! On Junto, the 4-digit OTP ensures that both rider and driver meet safely at the pickup point before the ride begins. It protects both parties. Let me know if you'd like more details on how trips work!"
- If the question is gibberish, sarcastic, or tests the AI:
  * Remain completely calm, polite, and helpful: "I want to make sure I understand you correctly! Could you rephrase your query or let me know what you'd like to do on Junto? I'm here 24/7 to help."
`;

function generateFallbackSupportAnswer(
  userMessage: string,
  context?: any,
): string {
  const query = userMessage.toLowerCase();

  // Helper to extract selected record from context or history
  const record = context?.selectedRecord;
  const rawStatus = (
    record?.status ||
    record?.details?.status ||
    ""
  ).toLowerCase();
  const isRideCompleted =
    rawStatus === "completed" ||
    rawStatus === "ended" ||
    rawStatus === "finished";
  const isRideCancelled = rawStatus === "cancelled" || rawStatus === "canceled";

  // 1. Contextual Ride Scenarios
  if (
    context?.category === "rides" ||
    query.includes("ride") ||
    query.includes("carpool") ||
    record?.type === "ride"
  ) {
    // A. Driver didn't arrive / no-show queries
    if (
      context?.issueType === "Driver didn't arrive." ||
      query.includes("driver didn't arrive") ||
      query.includes("driver didn't show") ||
      query.includes("driver didnt arrive") ||
      query.includes("driver didnt show") ||
      query.includes("driver didn't come") ||
      query.includes("driver didnt come") ||
      query.includes("driver not arrive") ||
      query.includes("driver not arrived") ||
      query.includes("driver no show") ||
      query.includes("driver never came") ||
      query.includes("driver never arrived")
    ) {
      if (record) {
        if (isRideCompleted) {
          const fromLoc =
            record.details?.from ||
            record.title?.split("➔")[0]?.trim() ||
            "your pickup location";
          const toLoc =
            record.details?.to || record.title?.split("➔")[1]?.trim() || "";
          const routeStr = toLoc
            ? `from **${fromLoc}** to **${toLoc}**`
            : `**${fromLoc}**`;

          return `Wait a moment—looking at your trip history, this ride ${routeStr} is already marked as **Completed**.\n\nHow could the driver have not arrived for a completed ride? Once a trip is marked completed, the ride has already concluded. Claiming the driver didn't arrive for a completed trip doesn't add up.\n\nDid you select this ride by mistake instead of an upcoming or active one? Or did the driver dishonestly mark it as completed without actually picking you up? Please let me know so I can investigate the right issue!`;
        }

        if (isRideCancelled) {
          return `Looking at your trip records, this ride is marked as **Cancelled**.\n\nSince this ride was already cancelled, the trip was not active. If the driver cancelled on you last minute or if you need help finding another ride, please let me know!`;
        }

        return `I'm really sorry to hear that your driver (${record.details?.driverName || "the driver"}) didn't arrive for your ride from **${record.details?.from || record.title}** on **${record.details?.time || "scheduled time"}**.\n\nDid the driver answer any phone calls or in-app messages?\n\nIf they didn't show up, I can immediately raise an urgent support request for our team to investigate and follow up with you.`;
      }
      return "Sorry about that! Which ride did this happen with? Please select your ride from the list or tell me the route, and I'll help resolve this or raise a support ticket.";
    }

    // B. Follow-up: Driver falsely marked completed without picking up
    if (
      query.includes("without picking") ||
      query.includes("falsely") ||
      query.includes("dishonestly") ||
      query.includes("lied") ||
      query.includes("never picked") ||
      query.includes("cheated") ||
      query.includes("scam") ||
      query.includes("marked completed without") ||
      query.includes("marked it complete without") ||
      (query.includes("marked") && query.includes("complete"))
    ) {
      return `🚨 **Driver Misconduct Alert**: Marking a ride completed without picking up the passenger is a severe violation of Junto's community trust and safety rules.\n\nI can immediately raise an urgent priority support request for our Trust & Safety team to review the driver's GPS logs, verify the pickup timestamp, and initiate a full investigation and refund.\n\nWould you like me to create this urgent support request now?`;
    }

    // C. Follow-up: User selected the wrong ride by mistake
    if (
      query.includes("wrong ride") ||
      query.includes("wrong one") ||
      query.includes("mistake") ||
      query.includes("different ride") ||
      query.includes("another ride")
    ) {
      return `Understood! Which active or upcoming ride did you mean? Please share the route or scheduled departure time, and I will assist you with the correct trip right away.`;
    }

    // D. User selecting a specific completed ride initially
    if (
      context?.issueType === "Select a specific ride." ||
      (query.startsWith("selected:") &&
        (context?.category === "rides" ||
          query.includes("car") ||
          query.includes("bike")))
    ) {
      if (record && isRideCompleted) {
        return `I found your completed ride from **${record.details?.from || record.title}** on **${record.details?.time || record.date}**.\n\nSince this trip is already marked **Completed**, what would you like assistance with?\n- Driver falsely marked ride completed (they didn't pick you up)\n- Payment or fare dispute\n- Lost an item in vehicle\n- Driver feedback or misconduct\n\nIf you meant an upcoming or active ride instead, please let me know!`;
      }
    }

    if (
      context?.issueType === "My ride is confirmed." ||
      query.includes("ride is confirmed")
    ) {
      const record = context?.selectedRecord;
      if (record) {
        return `Your ride on **${record.details?.time || record.date}** from **${record.details?.from || record.title}** is confirmed!\n\n**Driver**: ${record.details?.driverName || "Verified Driver"}\n**Vehicle**: ${record.details?.vehicleModel || "Vehicle"}\n\nWhen meeting at the pickup point, your unique 4-digit OTP will be verified by the driver to start the trip. How can I help you with this ride?`;
      }
      return "Great! Which confirmed ride are you referring to? Please select it above so I can assist you with specific trip details.";
    }

    if (
      context?.issueType === "I want to offer a ride." ||
      query.includes("offer a ride") ||
      query.includes("post a ride")
    ) {
      return "You can offer a ride directly from Junto!\n\n👉 **[🚗 Open Offer Ride](app://rides?tab=offer)**\n\nTap the button above to enter your pickup and drop locations, departure time, and available seats.";
    }

    if (
      context?.issueType === "I want to cancel my ride." ||
      query.includes("cancel")
    ) {
      return "To cancel your seat or ride:\n1. Go to **My Rides** tab in Rides.\n2. Tap on your ride card and choose **Cancel Seat** or **Delete Ride**.\n\nWould you like me to open your rides or raise a support request?";
    }

    if (
      context?.issueType === "Payment-related issue." ||
      query.includes("payment") ||
      query.includes("fare") ||
      query.includes("price")
    ) {
      return "Junto does not take commission or process escrow fees—ride cost shares are arranged directly between co-riders for petrol/fuel sharing.\n\nDid you experience a fare dispute or incorrect charge? Let me know, and I can raise a support request for our safety team.";
    }
  }

  // 2. DayMates Scenarios
  if (
    context?.category === "daymates" ||
    query.includes("daymate") ||
    query.includes("activity") ||
    query.includes("buddy")
  ) {
    if (
      context?.issueType === "Creating an activity." ||
      query.includes("create") ||
      query.includes("post activity")
    ) {
      return "You can create a DayMate activity in just a few taps!\n\n👉 **[👥 Create DayMate Activity](app://add-daymate)**\n\nChoose coffee, gym, walking, sports, or movies, set your time & location, and connect with people nearby.";
    }
    if (
      context?.issueType === "Finding people nearby." ||
      query.includes("find people") ||
      query.includes("nearby")
    ) {
      return "Discover neighbors hosting hangouts on the Explore tab:\n\n👉 **[🧭 Explore DayMates](app://explore)**";
    }
    if (
      context?.issueType === "Someone didn't attend." ||
      query.includes("didn't attend") ||
      query.includes("no show")
    ) {
      const record = context?.selectedRecord;
      const actTitle = record?.title || "your activity";
      return `We're sorry a companion didn't attend **${actTitle}**.\n\nYou can leave feedback on their profile or remove them from the activity. Would you like me to raise a support request for our community team to review?`;
    }
    if (
      context?.issueType === "Inappropriate behaviour." ||
      query.includes("inappropriate") ||
      query.includes("harass") ||
      query.includes("safety")
    ) {
      return "🚨 **Safety Alert**: Junto has a zero-tolerance policy for harassment or inappropriate behaviour. Your safety is our highest priority.\n\nWould you like me to immediately raise an urgent support request for our Trust & Safety team?";
    }
  }

  // 3. Movie Tickets Scenarios
  if (
    context?.category === "tickets" ||
    query.includes("ticket") ||
    query.includes("movie") ||
    query.includes("cinema")
  ) {
    if (
      context?.issueType === "Selling a ticket." ||
      query.includes("sell") ||
      query.includes("swap ticket")
    ) {
      return "If your plans changed, avoid complete loss by posting your spare tickets on Junto:\n\n👉 **[🎟️ Sell / Swap Ticket](app://add-ticket)**";
    }
    if (context?.issueType === "Buying a ticket." || query.includes("buy")) {
      return "Looking for movie or concert tickets? Check out active listings from peers:\n\n👉 **[🎟️ Browse Ticket Deals](app://explore)**";
    }
    if (
      context?.issueType === "Ticket not received." ||
      query.includes("not received")
    ) {
      return "We take ticket transfer issues very seriously.\n\nDid the seller fail to transfer the digital movie ticket? I can immediately raise a priority support ticket for our verification team.";
    }
  }

  // 4. Services Scenarios
  if (
    context?.category === "services" ||
    query.includes("service") ||
    query.includes("technician") ||
    query.includes("electrician")
  ) {
    if (
      context?.issueType === "Finding a service provider." ||
      query.includes("find")
    ) {
      return "Browse verified local technicians and home service pros in your neighborhood:\n\n👉 **[🔧 Browse Local Services](app://services)**";
    }
    if (
      context?.issueType === "Provider didn't arrive." ||
      query.includes("provider didn't arrive") ||
      query.includes("not arrived")
    ) {
      return "We apologize for the inconvenience with your service provider. Let us know the details or tap below to raise a priority support request.";
    }
  }

  // 5. HelpMe Scenarios
  if (
    context?.category === "helpme" ||
    query.includes("helpme") ||
    query.includes("emergency") ||
    query.includes("lost") ||
    query.includes("blood")
  ) {
    if (
      context?.issueType === "I need immediate nearby help." ||
      query.includes("immediate")
    ) {
      return "Need urgent neighborhood assistance? Broadcast your emergency request to locals nearby:\n\n👉 **[📢 Broadcast Request](app://ask-nearby)**";
    }
    if (
      context?.issueType === "I have a safety concern." ||
      query.includes("safety")
    ) {
      return "🛡️ Your safety is our absolute priority. If you are in immediate physical danger, please contact local authorities (112). For app-related safety concerns, I can immediately raise an urgent safety escalation.";
    }
  }

  // 6. Account & General Scenarios
  if (
    context?.category === "account" ||
    query.includes("login") ||
    query.includes("profile") ||
    query.includes("account")
  ) {
    if (
      context?.issueType === "Profile problem." ||
      query.includes("profile")
    ) {
      return "You can manage your bio, photo, ratings, and settings from your profile:\n\n👉 **[👤 My Profile](app://profile)**";
    }
    if (
      context?.issueType === "Login problem." ||
      query.includes("login") ||
      query.includes("signin")
    ) {
      return "Junto uses secure Google Single Sign-On (SSO). If you have trouble signing in, try clearing your browser cache or tapping 'Sign In with Google' again.";
    }
  }

  // 7. General Resolution or Escalation offer
  if (
    query.includes("human") ||
    query.includes("agent") ||
    query.includes("support request") ||
    query.includes("raise a ticket") ||
    query.includes("contact")
  ) {
    return "I can raise a support request directly with our human customer care team right now!\n\nTap **Create Support Request** below, or let me know the details and I'll log it for you.";
  }

  // 8. Polite and courteous handling for silly, curious, or "dumb" questions
  if (
    query.includes("moon") ||
    query.includes("mars") ||
    query.includes("space") ||
    query.includes("fly") ||
    query.includes("alien") ||
    query.includes("dinosaur") ||
    query.includes("elephant") ||
    query.includes("dog drive") ||
    query.includes("cat drive") ||
    query.includes("can my pet") ||
    query.includes("free money") ||
    query.includes("millionaire") ||
    query.includes("marry me") ||
    query.includes("love you") ||
    query.includes("kill") ||
    query.includes("joke")
  ) {
    if (query.includes("marry") || query.includes("love")) {
      return "That's very sweet of you! 😄 While I'm dedicated 24/7 to helping you on Junto, I'm purely your digital support companion. If you're looking for great human connections or coffee buddies, definitely explore the **DayMates** tab in the app!";
    }
    if (query.includes("joke")) {
      return "Here's one for your commute: Why did the traffic light turn red? Because it had to change in the middle of the street! 😄 Now, how can I genuinely assist you with your rides, activities, or services today?";
    }
    return "Haha, that's quite an adventurous idea! 😄 While our Junto drivers and members are pretty extraordinary, space expeditions, flying vehicles, and pet drivers aren't quite on our route map yet.\n\nRight here on Earth, Junto connects you with verified neighbors for real carpools, hangout activities, trusted local services, and ticket swaps. How can I help you with a real trip or booking today?";
  }

  // 9. Identity & Assistant questions
  if (
    query.includes("who are you") ||
    query.includes("are you human") ||
    query.includes("are you ai") ||
    query.includes("are you a bot") ||
    query.includes("are you real")
  ) {
    return "I'm Junto's AI Support Assistant! 🤖\n\nI'm available 24/7 to answer questions, guide your bookings, and resolve trip issues in real-time. Whenever something requires hands-on investigation, our human customer care team is always standing by to step in. How can I help you today?";
  }

  // 10. Basic / Explanatory questions (What is Junto, What is OTP, How carpool works)
  if (
    query.includes("what is junto") ||
    query.includes("what does this app do") ||
    query.includes("how does this work")
  ) {
    return "Welcome to **Junto**! 🌟 Junto is a local community platform designed to make daily life simpler and safer:\n\n1. 🚗 **Rides**: Share empty seats on daily carpool or bike trips to split fuel costs.\n2. 🤝 **DayMates**: Discover companion buddies for walking, coffee, movies, or sports.\n3. 🔧 **Local Services**: Find verified local technicians and repair specialists.\n4. 🎟️ **Ticket Deals**: Sell or buy spare movie and event tickets safely.\n5. 📢 **Ask Nearby**: Broadcast urgent community queries to neighbors.\n\nWhat would you like to explore first?";
  }

  if (
    query.includes("what is otp") ||
    query.includes("why otp") ||
    query.includes("how otp works")
  ) {
    return "Great question! 🔐 In Junto rides, the **4-digit OTP** is a safety verification code.\n\nWhen meeting at the pickup location, the co-rider displays their unique OTP on screen. The driver enters this OTP to officially confirm pickup and start the ride. This ensures passengers and drivers only ride with verified, matched peers.";
  }

  // 11. Polite handling for gibberish, very short nonsense, or unclear messages
  const cleanQ = query.trim().replace(/[^a-z0-9]/g, "");
  const isGibberish =
    cleanQ.length > 5 &&
    (!/[aeiou]/.test(cleanQ) ||
      /^(.)\1+$/.test(cleanQ) ||
      /(asdf|qwer|zxcv)/.test(cleanQ));

  if (isGibberish || query === "???" || query === "..." || query.length === 1) {
    return "I want to make sure I understand you properly! 😊 Could you please rephrase your question, or let me know what you'd like help with regarding your rides, activities, or bookings?";
  }

  return "I'm here to help you with **Rides**, **DayMates**, **Services**, **Movie Tickets**, **LocalDeals**, and **HelpMe**.\n\nPlease feel free to describe what's going on or pick an option above, and I'll assist you with a smile!";
}

async function callOpenRouter(
  messagesHistory: any[],
  userMessage: string,
  context?: any,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set.");
  }

  const model =
    process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

  let contextualSystem = PROJECT_KNOWLEDGE_BASE;
  if (context) {
    contextualSystem += `\n\nCURRENT CONVERSATION CONTEXT:\n- Category: ${context.category || "None"}\n- Issue Type: ${context.issueType || "None"}`;
    if (context.selectedRecord) {
      contextualSystem += `\n- Selected Record: ${JSON.stringify(context.selectedRecord)}`;
      const rawStatus = (
        context.selectedRecord.status ||
        context.selectedRecord.details?.status ||
        ""
      ).toLowerCase();
      if (
        rawStatus === "completed" ||
        rawStatus === "ended" ||
        rawStatus === "finished"
      ) {
        contextualSystem += `\n\nCRITICAL LOGICAL RULE FOR THIS TURN:
The user has selected a ride that is ALREADY marked as '${rawStatus}'.
If the user claims, selects, or asks about "driver didn't arrive", "driver didn't come", or "driver no-show", REASON LIKE A HUMAN AGENT:
A driver cannot have failed to arrive for a ride that has already been completed and concluded! That is contradictory and obsolete for a completed ride.
Politely point out this contradiction with human common sense (e.g., 'Looking at your records, this ride is marked as completed—did you pick this ride by mistake, or did the driver dishonestly mark it completed without picking you up?').
Do NOT blindly accept or apologize for a driver no-show on a completed trip!`;
      }
    }
    contextualSystem += `\nKeep your response friendly, polite, empathetic, and under 3 short paragraphs. Ask only one question at a time. Include actionable app:// markdown links when relevant.`;
  }

  const formattedMessages = [
    { role: "system", content: contextualSystem },
    ...messagesHistory.map((m: any) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text || m.message || "",
    })),
    { role: "user", content: userMessage },
  ];

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer":
          process.env.EXPO_PUBLIC_API_URL || "https://daymates.app",
        "X-Title": "DayMates AI Customer Support",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return (
    data?.choices?.[0]?.message?.content ||
    "How can I assist you with Junto today?"
  );
}

// GET /api/support/config - Dynamic configuration of categories and issues
router.get("/config", (_req, res) => {
  return res.json({
    success: true,
    ...SUPPORT_CONFIG,
  });
});

// GET /api/support/user-records - Fetch real records belonging to authenticated user
router.get("/user-records", async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required to fetch user records",
        records: [],
      });
    }

    const recordType = (req.query.type as string) || "ride";
    const filter = (req.query.filter as string) || "all";

    if (recordType === "ride") {
      let driving: any[] = [];
      let riding: any[] = [];

      try {
        if (typeof rideRepository.findByDriverId === "function") {
          driving = await rideRepository.findByDriverId(userId);
        }
      } catch (err) {
        console.warn("Error finding rides by driver ID:", err);
      }

      try {
        if (typeof rideRepository.findByPassengerId === "function") {
          riding = await rideRepository.findByPassengerId(userId);
        }
      } catch (err) {
        console.warn("Error finding rides by passenger ID:", err);
      }

      const rideMap = new Map<string, any>();
      driving.forEach((r) => rideMap.set(r.id, r));
      riding.forEach((r) => rideMap.set(r.id, r));
      const allRides = Array.from(rideMap.values());

      let filtered = allRides;
      if (filter === "confirmed") {
        filtered = allRides.filter((r) => {
          if (r.userId === userId) return r.status === "active";
          return r.passengers?.some(
            (p) => p.userId === userId && p.status === "confirmed",
          );
        });
      } else if (filter === "requested") {
        filtered = allRides.filter((r) =>
          r.passengers?.some(
            (p) => p.userId === userId && p.status === "pending",
          ),
        );
      } else if (filter === "active") {
        filtered = allRides.filter(
          (r) => r.status === "active" || r.status === "both_travelling",
        );
      }

      const records = filtered.map((r) => {
        const isDriver = r.userId === userId;
        return {
          id: r.id,
          type: "ride",
          title: `${r.from} ➔ ${r.to}`,
          subtitle: `${r.vehicleType === "bike" ? "🏍️ Bike" : "🚗 Car"} • ${r.time} • ₹${r.price}/seat`,
          date: r.time,
          status: r.status,
          role: isDriver ? "Driver" : "Passenger",
          details: {
            from: r.from,
            to: r.to,
            time: r.time,
            status: r.status,
            driverName: r.driverName,
            vehicleModel: r.vehicleModel,
            registrationNumber: r.registrationNumber,
            price: r.price,
            vehicleType: r.vehicleType,
          },
        };
      });

      return res.json({ success: true, records });
    }

    if (recordType === "activity") {
      const activities = await activityRepository.find({
        where: { organizerId: userId, isDeleted: 0 },
        order: { createdAt: "DESC" },
      });

      const records = activities.map((act) => ({
        id: act.id,
        type: "activity",
        title: act.title,
        subtitle: `${act.category} • ${act.locationName || "Local"}`,
        date: act.createdAt
          ? new Date(act.createdAt).toLocaleDateString()
          : "Active",
        status: act.status || "active",
        role: "Organizer",
        details: {
          title: act.title,
          category: act.category,
          location: act.locationName,
        },
      }));

      return res.json({ success: true, records });
    }

    if (recordType === "ticket") {
      const tickets = await ticketRepository.findBySellerId(userId);

      const records = tickets.map((t) => ({
        id: t.id,
        type: "ticket",
        title: t.eventName,
        subtitle: `${t.category} • ${t.venue} • ₹${t.price}`,
        date: t.eventDate || "Active",
        status: t.isSold ? "Sold" : "Available",
        role: "Seller",
        details: {
          eventName: t.eventName,
          venue: t.venue,
          price: t.price,
          quantity: t.quantity,
          isSold: t.isSold,
        },
      }));

      return res.json({ success: true, records });
    }

    if (recordType === "deal") {
      const deals = await dealsRepository.find({
        where: { userId },
        order: { createdAt: "DESC" },
      });

      const records = deals.map((d) => ({
        id: d.id,
        type: "deal",
        title: d.title,
        subtitle: `${d.category} • ${d.price || "₹" + d.dealPrice} • ${d.locationName || "Nearby"}`,
        date: d.createdAt
          ? new Date(d.createdAt).toLocaleDateString()
          : "Active",
        status: d.status || "Active",
        role: "Seller",
        details: {
          title: d.title,
          price: d.price || d.dealPrice,
          condition: d.condition,
        },
      }));

      return res.json({ success: true, records });
    }

    if (recordType === "asknearby") {
      const items = await activityRepository.find({
        where: {
          organizerId: userId,
          category: ActivityCategory.ASK_NEARBY,
          isDeleted: 0,
        },
        order: { createdAt: "DESC" },
      });

      const records = items.map((item) => ({
        id: item.id,
        type: "asknearby",
        title: item.title,
        subtitle: `Ask Nearby • ${item.tags?.[1] || "Urgent"} • ${item.locationName || "Area"}`,
        date: item.createdAt
          ? new Date(item.createdAt).toLocaleDateString()
          : "Recent",
        status: item.status || "Active",
        role: "Broadcast Author",
        details: {
          title: item.title,
          urgency: item.tags?.[1] || "Urgent",
          location: item.locationName,
        },
      }));

      return res.json({ success: true, records });
    }

    if (recordType === "service") {
      const services = await localServicesRepository.find({
        where: { providerId: userId },
      });

      const records = services.map((s) => ({
        id: s.id,
        type: "service",
        title: s.name || s.title || "Service Listing",
        subtitle: `${s.category} • ${s.rate || "Standard rate"}`,
        date: "Registered Provider",
        status: "Active",
        role: "Provider",
        details: {
          name: s.name || s.title,
          category: s.category,
        },
      }));

      return res.json({ success: true, records });
    }

    return res.json({ success: true, records: [] });
  } catch (error: any) {
    console.error("Fetch User Records Error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to fetch user records",
      records: [],
    });
  }
});

// POST /api/support/ticket - Create a support case
router.post("/ticket", async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required to create support request",
      });
    }

    const {
      category,
      issueType,
      sessionId,
      relatedEntityType,
      relatedEntityId,
      relatedEntitySummary,
      summary,
      details,
      urgentSafety,
    } = req.body;

    if (!category || !issueType) {
      return res.status(400).json({
        success: false,
        error: "Category and issueType are required",
      });
    }

    // Generate real case reference number
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const caseNumber = `JNT-SR-${randomSuffix}`;

    const newCase: SupportCase = {
      caseNumber,
      userId,
      sessionId: sessionId || null,
      category,
      issueType,
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || null,
      relatedEntitySummary: relatedEntitySummary || null,
      summary: summary || `${category} - ${issueType}`,
      details: details || "",
      status: "Under Review",
      createdAt: new Date().toISOString(),
      estimatedResponseTime: urgentSafety
        ? "Immediate (Under 15 mins)"
        : "Within 2 hours",
      urgentSafety: !!urgentSafety,
    };

    supportCasesStore.set(caseNumber, newCase);

    // Persist to audit log
    try {
      await auditRepository.createLog({
        userId,
        action: "SUPPORT_CASE_CREATED",
        details: JSON.stringify(newCase),
      });
    } catch (auditErr) {
      console.warn("Could not save audit log for support case:", auditErr);
    }

    // Add confirmation message to support chat history
    try {
      await supportChatRepository.addMessage(
        userId,
        "bot",
        `✅ **Support Request Created!**\n\n**Case Reference**: \`${caseNumber}\`\n**Status**: Under Review\n**Category**: ${category} • ${issueType}\n\nOur team has received this and will follow up with you ${newCase.estimatedResponseTime}. You can track this request anytime.`,
        sessionId,
      );
    } catch (chatErr) {
      console.warn(
        "Could not append bot support ticket confirmation:",
        chatErr,
      );
    }

    return res.json({
      success: true,
      case: newCase,
    });
  } catch (error: any) {
    console.error("Create Support Ticket Error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to create support ticket",
    });
  }
});

// GET /api/support/cases - Fetch user support requests
router.get("/cases", async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req);
    if (!userId) {
      return res.json({ success: true, cases: [] });
    }

    const userCases: SupportCase[] = [];
    for (const c of supportCasesStore.values()) {
      if (c.userId === userId) {
        userCases.push(c);
      }
    }

    // Also check audit logs if in-memory was restarted
    if (userCases.length === 0) {
      try {
        const auditLogs = await auditRepository.findByUser(userId);
        for (const log of auditLogs) {
          if (log.action === "SUPPORT_CASE_CREATED" && log.details) {
            try {
              const parsed = JSON.parse(log.details);
              if (parsed?.caseNumber) {
                userCases.push(parsed);
              }
            } catch {}
          }
        }
      } catch {}
    }

    return res.json({
      success: true,
      cases: userCases.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to fetch support cases",
      cases: [],
    });
  }
});

// GET /api/support/cases/:caseNumber - Get single case status
router.get("/cases/:caseNumber", async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req);
    const { caseNumber } = req.params;

    let targetCase = supportCasesStore.get(caseNumber);

    if (!targetCase && userId) {
      const auditLogs = await auditRepository.findByUser(userId);
      for (const log of auditLogs) {
        if (log.action === "SUPPORT_CASE_CREATED" && log.details) {
          try {
            const parsed = JSON.parse(log.details);
            if (parsed?.caseNumber === caseNumber) {
              targetCase = parsed;
              break;
            }
          } catch {}
        }
      }
    }

    if (!targetCase) {
      return res.status(404).json({
        success: false,
        error: "Support case not found",
      });
    }

    return res.json({
      success: true,
      case: targetCase,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to retrieve case details",
    });
  }
});

// GET /api/support/messages - Fetch active support chat messages for logged-in user
router.get("/messages", async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req);
    if (!userId) {
      return res.json({ success: true, messages: [] });
    }

    const dbMessages =
      await supportChatRepository.getActiveChatMessages(userId);
    const formatted = dbMessages.map((m) => ({
      id: m.id,
      sender: m.sender,
      text: m.message,
      timestamp: new Date(m.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return res.json({
      success: true,
      messages: formatted,
    });
  } catch (error: any) {
    console.error("Fetch Support Messages Error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to fetch support chat messages",
    });
  }
});

// POST /api/support/log-messages - Persist interactive menu selections (categories, issues) to supportchat table
router.post("/log-messages", async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req);
    const { messages, sessionId } = req.body;

    if (userId && Array.isArray(messages)) {
      for (const m of messages) {
        if (m.text && m.sender) {
          try {
            await supportChatRepository.addMessage(
              userId,
              m.sender,
              m.text,
              sessionId,
            );
          } catch (e) {
            console.warn("Could not log support message:", e);
          }
        }
      }
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to log support messages",
    });
  }
});

// POST /api/support/chat - Send message and persist to supportchat table
router.post("/chat", async (req, res) => {
  try {
    const { messages, userMessage, context } = req.body;

    if (!userMessage || typeof userMessage !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "userMessage is required" });
    }

    const userId = getUserIdFromAuth(req);

    // If logged in, save user message to supportchat table
    if (userId) {
      try {
        await supportChatRepository.addMessage(
          userId,
          "user",
          userMessage,
          context?.sessionId,
        );
      } catch (saveErr) {
        console.warn("Could not persist user support message:", saveErr);
      }
    }

    let replyText = "";
    try {
      replyText = await callOpenRouter(messages || [], userMessage, context);
    } catch (llmErr: any) {
      console.warn(
        "OpenRouter not available or failed, using knowledge base fallback:",
        llmErr?.message,
      );
      replyText = generateFallbackSupportAnswer(userMessage, context);
    }

    // If logged in, save bot response to supportchat table
    if (userId) {
      try {
        await supportChatRepository.addMessage(
          userId,
          "bot",
          replyText,
          context?.sessionId,
        );
      } catch (saveErr) {
        console.warn("Could not persist bot support message:", saveErr);
      }
    }

    return res.json({
      success: true,
      reply: replyText,
    });
  } catch (error: any) {
    console.error("Support Chat API Error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Unable to process customer support response right now.",
    });
  }
});

// POST /api/support/end-chat - Mark active chat as ended in supportchat table
router.post("/end-chat", async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req);
    if (userId) {
      await supportChatRepository.endChatSession(userId);
    }
    return res.json({
      success: true,
      message: "Chat session ended successfully",
    });
  } catch (error: any) {
    console.error("End Support Chat Error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to end support chat session",
    });
  }
});

export default router;
