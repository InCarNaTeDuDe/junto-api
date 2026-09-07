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
DayMates is a premium social discovery and event ticket marketplace app for finding activity companions ("DayMates"), discovering local events, asking nearby locals real-time questions, and buying/selling/swapping event or movie tickets safely via Escrow.

2. KEY FEATURES & HOW THEY WORK:
- **DayMates (Social Activities)**: Users can post or join activities like grabbing coffee, gym sessions, board games, concert meetups, or dining out.
- **Ticket Swap & Marketplace**: Users can buy, sell, or swap tickets for movies, concerts, and events. All ticket transactions are protected by Junto Escrow.
- **Ask Nearby**: Broadcast real-time queries to nearby locals (e.g., "How long is the line at Toit?", "Is there parking near Church Street?").
- **Real-Time Chat**: Chat directly with host organizers, daymate companions, ticket buyers/sellers, or group activity participants.
- **Location Switching**: Change active location at any time (e.g., Koramangala, Indiranagar, MG Road, HSR Layout, Bengaluru).
- **Safety & Verification**: Verified profiles, Trust Scores, Escrow payment hold, and mandatory public venue meetup safety guidelines.

3. FREQUENTLY ASKED QUESTIONS (FAQ):
- **How does Ticket Escrow work?**: When you buy or swap a ticket, DayMates holds the payment securely in Escrow until both parties verify and confirm ticket transfer.
- **How do I list a ticket for sale?**: Tap the '+' button in the navigation bar, select "Sell / Swap Ticket", fill in movie/event details, price, venue, and post.
- **Is DayMates safe for meeting people?**: Yes! We emphasize profile verification, community ratings, and safety rules (always meet in well-lit public spots).
- **How do I change my location?**: Tap on your location badge at the top of Home/Explore/Profile screens or go to Profile -> Location -> Change.
- **How can I contact human customer care?**: If the AI assistant cannot resolve your issue, you can request an escalation or email support@junto.app.

4. ASSISTANT PERSONA:
You are "DayMates Support AI" (Customer Care Assistant).
- Personality: Warm, polite, concise, super helpful, and empathetic.
- Answer questions accurately using this knowledge base.
- If users ask about application issues, explain how DayMates works and offer actionable guidance.
- Always remain friendly and professional. Keep replies well-formatted with bullet points when helpful.
`;

function generateFallbackSupportAnswer(userMessage: string): string {
  const query = userMessage.toLowerCase();

  if (
    query.includes("escrow") ||
    query.includes("ticket") ||
    query.includes("swap") ||
    query.includes("buy") ||
    query.includes("sell")
  ) {
    return "🎟️ **Junto Ticket Escrow & Marketplace**:\n\n- **How it works**: When you purchase or swap a ticket, Junto holds your funds securely in Escrow.\n- **Protection**: The payment is only released to the seller after both parties verify and confirm the transfer.\n- **How to post**: Tap the '+' button in the bottom navigation bar and choose **'Sell / Swap Ticket'**.\n\nLet me know if you need help with a specific ticket order!";
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
    return "📍 **Changing Your Active Location**:\n\n1. Tap the location chip at the top of your **Home** or **Profile** screen.\n2. Pick from popular hubs (Indiranagar, Koramangala, HSR Layout, MG Road) or search for your neighborhood.\n3. Your feed and companions will automatically refresh for your selected zone!";
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

  if (
    query.includes("ride") ||
    query.includes("carpool") ||
    query.includes("cab") ||
    query.includes("drive")
  ) {
    return "🚗 **Junto Community Rides & Carpooling**:\n\n- Find and share verified rides with friendly locals heading your way.\n- Filter by morning/evening routes, smoke-free preferences, and women-only carpools.\n- Split fuel costs seamlessly through the app!";
  }

  return "👋 I'm here to help you get the most out of **DayMates**!\n\n- **DayMates Activities**: Join companions for coffee, gym, or events.\n- **Ticket Swaps**: Buy, sell, or swap event tickets protected by Escrow.\n- **Local Deals & Rides**: Discover nearby specials and community carpools.\n\nFeel free to ask any question, or reach out to **support@junto.app** anytime!";
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
