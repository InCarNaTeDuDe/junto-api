import express from "express";

const router = express.Router();

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

async function callOpenRouter(
  messagesHistory: any[],
  userMessage: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY environment variable is not set. Please set OPENROUTER_API_KEY in Settings.",
    );
  }

  // Default to a free model on OpenRouter if OPENROUTER_MODEL is not explicitly set
  const model =
    process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

  const formattedMessages = [
    { role: "system", content: PROJECT_KNOWLEDGE_BASE },
    ...messagesHistory.map((m: any) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text || "",
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

router.post("/chat", async (req, res) => {
  try {
    const { messages, userMessage } = req.body;

    if (!userMessage || typeof userMessage !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "userMessage is required" });
    }

    const replyText = await callOpenRouter(messages || [], userMessage);

    return res.json({
      success: true,
      reply: replyText,
      // provider: "openrouter",
    });
  } catch (error: any) {
    console.error("Support Chat API Error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Unable to process customer support response right now. Please verify API_KEY in Settings.",
    });
  }
});

export default router;
