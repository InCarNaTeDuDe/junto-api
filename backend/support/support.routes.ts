import express from "express";
import { verifyAccessToken } from "../auth/jwt.service";
import { supportChatRepository } from "../repositories/SupportChat.repository";

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

const PROJECT_KNOWLEDGE_BASE = `
DayMates (formerly Junto) App Knowledge Base & Customer Support Guidelines:

1. ABOUT DAYMATES (JUNTO):
Junto is a direct community connection platform for finding activity companions ("DayMates"), discovering local events, asking nearby locals real-time questions, arranging peer carpool rides ("RideMate"), finding verified local technicians & doorstep services, and buying/selling/swapping event or movie tickets directly between buyers and sellers with 0% platform fees (Junto does NOT handle payments or use an escrow model).

2. KEY FEATURES & HOW THEY WORK:
- **DayMates (Social Activities)**: Users can post or join activities like grabbing coffee, gym sessions, walking, sports, games, lunch, or dining out. Users can delete their activities anytime from Profile -> Activities.
- **Ticket Swap & Marketplace**: Users can buy, sell, or swap tickets for movies, concerts, and events. If someone drops plans to watch a movie or attend an event, they can avoid complete loss and offer the ticket to someone else, so buyer and seller mutually benefit with 0% platform fees.
- **RideMate (Carpool & Bike Pool)**:
  - Connect with drivers or riders heading your way with 0% platform fee.
  - Active Vehicle Protection: If a vehicle is in transit or in ride progress state, the user cannot create another ride with the same vehicle number.
  - Pickup Travel Sequence: Only after the ride owner clicks "I'm traveling to pickup location" will the button be enabled for the co-rider to start travelling to pickup.
  - OTP Verification & Status: Co-riders receive a unique 4-digit OTP displayed directly on their screen. When meeting at the pickup point, the driver verifies the OTP. The status tracker shows "OTP" which gets a completed tick mark (✓) upon successful exchange, activating live safety and GPS trip controls.
- **Local Services (Technicians)**: Verified local technicians register on Junto. Technician enrollment features an interactive calendar with minDate set to today, and dynamic "Skills & Specialization" placeholder hints tailored to each selected service category.
- **Local Deals Marketplace**: Discover and offer deals for pre-owned items. Users can tap "Make deal" to submit a deal request with instant discount price suggestion chips below the asking price.
- **Ask Nearby**: Broadcast real-time urgent queries to nearby locals (blood donation, lost keys/mobile/bag, medicine emergencies) with Urgency levels (Urgent, Soon, Not urgent).
- **Safety & Verification**: Verified profiles, Trust Scores, and public meetup safety guidelines.
- **Account & Location**: Seamless Google Sign-In with account selector prompt on every sign-in. Active user city/location automatically synchronizes from the database and persists locally.

3. FREQUENTLY ASKED QUESTIONS (FAQ):
- **How does Ticket Swap work?**: If you can no longer attend an event or movie, post your ticket on Junto to avoid complete loss. Buyers discover great ticket deals, and both parties connect directly with 0% platform fee.
- **How do I list a ticket for sale?**: Tap the '+' button in the navigation bar, select "Sell / Swap Ticket", fill in movie/event details, price, venue, and post.
- **Is DayMates safe for meeting people?**: Yes! We emphasize profile verification, community ratings, and safety rules (always meet in well-lit public spots).
- **How do I change my location?**: Tap on your location badge at the top of Home/Explore/Profile screens or go to Profile -> Location -> Change.
- **How can I contact human customer care?**: If the AI assistant cannot resolve your issue, you can request an escalation or email support@junto.app.

4. IN-APP DEEP LINKS FOR USER NAVIGATION:
Whenever a user asks where to go or how to post/create/find something, ALWAYS provide actionable markdown links using the app:// protocol:
- Post / Offer a Ride: [🚗 Tap here to Post / Offer a Ride](app://rides?tab=offer)
- Find / Search a Ride: [🔍 Tap here to Find a Ride](app://rides?tab=find)
- Sell / Swap Ticket: [🎟️ Tap here to Sell / Swap Ticket](app://add-ticket)
- Create Social Activity / Hangout: [👥 Tap here to Post DayMate Activity](app://add-daymate)
- Ask Nearby Neighbors / Emergency: [📢 Tap here to Ask Nearby](app://asknearby)
- Local Deals Marketplace: [🏷️ Tap here for Local Deals](app://deals)
- Local Services & Technicians: [🔧 Tap here for Local Services](app://services)
The app will render these as instant clickable navigation cards taking the user straight to that screen.

5. ASSISTANT PERSONA:
You are "Junto Copilot" (DayMates AI Customer Care Assistant).
- Personality: Warm, polite, concise, super helpful, and proactive with in-app navigation.
- Answer questions accurately using this knowledge base.
- When users ask how to post a ride or do something, give clear numbered steps AND the direct link!
`;

function generateFallbackSupportAnswer(userMessage: string): string {
  const query = userMessage.toLowerCase();

  if (
    query.includes("post a ride") ||
    query.includes("offer a ride") ||
    query.includes("create ride") ||
    query.includes("publish ride") ||
    query.includes("give ride") ||
    query.includes("post ride") ||
    query.includes("carpool") ||
    query.includes("cab") ||
    query.includes("drive") ||
    query.includes("ride")
  ) {
    return "🚗 **RideMate (Carpool & Bike Pool)**:\n\nTo post or offer a ride to coworkers and neighbors heading your way:\n\n1. Tap the direct button below to open the ride creation screen:\n👉 **[🚗 Tap here to Post / Offer a Ride](app://rides?tab=offer)**\n\n2. Enter your **Pickup & Drop** locations.\n3. Choose your **Date & Time**, available seats, and vehicle type (Car or Bike).\n4. Set your price per seat (0% platform fee) and tap Publish!\n\nLooking to find a ride instead? Tap **[🔍 Find a Ride](app://rides?tab=find)**.";
  }

  if (
    query.includes("ticket") ||
    query.includes("swap") ||
    query.includes("buy") ||
    query.includes("sell")
  ) {
    return "🎟️ **Junto Ticket Swap & Marketplace**:\n\n- **Direct Peer Deals**: If your plans change, avoid complete loss by offering your ticket to another user at 0% platform fee.\n\n👉 **[🎟️ Tap here to Sell / Swap a Ticket](app://add-ticket)**\n\nFill in the movie/event details, original & selling price, venue, and post!";
  }

  if (
    query.includes("daymate") ||
    query.includes("activity") ||
    query.includes("buddy") ||
    query.includes("hangout") ||
    query.includes("coffee") ||
    query.includes("gym")
  ) {
    return "👥 **DayMates Activities & Hangouts**:\n\nFind companions for coffee, gym workouts, sports, dining, or movies so you never have to go alone!\n\n👉 **[👥 Tap here to Create a DayMate Activity](app://add-daymate)**\n\nPick your category, location, and date/time to find peers with matching vibes!";
  }

  if (
    query.includes("service") ||
    query.includes("technician") ||
    query.includes("plumber") ||
    query.includes("electrician") ||
    query.includes("repair")
  ) {
    return "🔧 **Local Fix & Home Services**:\n\nBook certified local electricians, plumbers, appliance mechanics & home cleaners!\n\n👉 **[🔧 Tap here to Browse Local Services](app://services)**";
  }

  if (
    query.includes("safety") ||
    query.includes("safe") ||
    query.includes("meet") ||
    query.includes("guideline")
  ) {
    return "🛡️ **Safety Guidelines for Meeting DayMates**:\n\n- **Public Venues**: Always meet in bustling, well-lit public areas (cafes, malls, public venues).\n- **Profile Checks**: Review companion trust scores and verified badges before meeting.\n- **Share Plans**: Share your meetup details with a trusted friend or family member.\n- **Emergency Support**: Reach out directly to **support@junto.app** for any safety concerns.";
  }

  if (
    query.includes("location") ||
    query.includes("city") ||
    query.includes("change location") ||
    query.includes("area")
  ) {
    return "📍 **Changing Your Active Location**:\n\n1. Tap the location chip at the top of your **Home** or **Profile** screen.\n2. Pick from popular hubs or search for your neighborhood.\n3. Your feed and companions will automatically refresh for your selected zone!";
  }

  if (
    query.includes("human") ||
    query.includes("contact") ||
    query.includes("agent") ||
    query.includes("email") ||
    query.includes("phone")
  ) {
    return "📞 **Contacting Human Customer Care**:\n\nOur specialized human support team is standing by to help you!\n- **Official Support Email**: [support@junto.app](mailto:support@junto.app)\n- **Response Time**: Typically under 2 hours during active business hours.\n- **In-App**: You can also report issues directly from any activity or ticket details screen.";
  }

  return "👋 I'm here to help you get the most out of **Junto**!\n\n- **RideMate**: [🚗 Post / Offer a Ride](app://rides?tab=offer)\n- **DayMates Activities**: [👥 Post an Activity](app://add-daymate)\n- **Ticket Swaps**: [🎟️ Sell / Swap Ticket](app://add-ticket)\n- **Local Services**: [🔧 Find Technicians](app://services)\n\nAsk me anything or tap any link above to jump right in!";
}

async function callOpenRouter(
  messagesHistory: any[],
  userMessage: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set.");
  }

  // Default to a free model on OpenRouter if OPENROUTER_MODEL is not explicitly set
  const model =
    process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

  const formattedMessages = [
    { role: "system", content: PROJECT_KNOWLEDGE_BASE },
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
    "How can I assist you with DayMates today?"
  );
}

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

// POST /api/support/chat - Send message and persist to supportchat table
router.post("/chat", async (req, res) => {
  try {
    const { messages, userMessage } = req.body;

    if (!userMessage || typeof userMessage !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "userMessage is required" });
    }

    const userId = getUserIdFromAuth(req);

    // If logged in, save the user message to supportchat table immediately
    if (userId) {
      try {
        await supportChatRepository.addMessage(userId, "user", userMessage);
      } catch (saveErr) {
        console.warn("Could not persist user support message:", saveErr);
      }
    }

    let replyText = "";
    try {
      replyText = await callOpenRouter(messages || [], userMessage);
    } catch (llmErr: any) {
      console.warn(
        "OpenRouter not available or failed, using knowledge base fallback:",
        llmErr?.message,
      );
      replyText = generateFallbackSupportAnswer(userMessage);
    }

    // If logged in, save the bot response to supportchat table
    if (userId) {
      try {
        await supportChatRepository.addMessage(userId, "bot", replyText);
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
