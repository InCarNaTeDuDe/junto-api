import { GoogleGenAI } from "@google/genai";
import { ServiceCluster } from "../entities/LocalServices.entity";

export interface IntentAnalysisResult {
  module: "services" | "rides" | "tickets" | "deals" | "helpme" | "daymates";
  cluster?: "auto" | "fix" | "glam" | "home";
  category?: string;
  keywords: string[];
  destination?: string;
  confidence: number;
  source: "openrouter" | "gemini" | "code_logic";
  explanation?: string;
}

const SYSTEM_PROMPT = `You are the AI Intent Classifier for DayMates Universal Need Router.
Analyze the user's natural language request and classify it into one of the 6 platform modules:

1. "services" - Local pro doorstep services and repairs.
   Clusters from LocalServices.entity.ts:
   - "auto": Bike repair, Puncture, Car repair, Roadside assistance, Car wash, Mechanics.
   - "fix": Electrician, Plumber, AC repair, Carpenter, Appliance/Washing machine care, TV repair.
   - "glam": Bridal Makeup, Facials, Mehendi, Hair styling, Waxing, Grooming.
   - "home": Deep Cleaning, Maids, Cooking / Tiffin food, Pest control, Packers & Movers.

2. "rides" - RideMate carpools, sharing rides, travel to cities (e.g. Vijayawada, Bengaluru, Airport).
3. "tickets" - TicketSwap for event tickets, concert passes (Coldplay, Diljit, IPL, movies).
4. "deals" - Buying/selling pre-owned goods, local deals, discounts (used cycle, phone, camera).
5. "helpme" - Urgent community alerts, lost and found (lost wallet, lost pet, emergency help).
6. "daymates" - Social activities, sports buddies (badminton partner, gym buddy, weekend walk, coffee).

Return ONLY valid JSON matching this structure:
{
  "module": "services" | "rides" | "tickets" | "deals" | "helpme" | "daymates",
  "cluster": "auto" | "fix" | "glam" | "home" | null,
  "category": string | null,
  "keywords": string[],
  "destination": string | null,
  "explanation": string
}`;

/**
 * Tier 1: OpenRouter AI Intent Classifier
 */
async function classifyWithOpenRouter(
  query: string,
): Promise<IntentAnalysisResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model =
    process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer":
            process.env.EXPO_PUBLIC_API_URL || "https://daymates.app",
          "X-Title": "DayMates Universal Intent Router",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Classify this user request into JSON: "${query}"`,
            },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      },
    );

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    const parsed = JSON.parse(rawContent);
    return {
      module: parsed.module || "services",
      cluster: parsed.cluster || undefined,
      category: parsed.category || undefined,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      destination: parsed.destination || undefined,
      confidence: 0.95,
      source: "openrouter",
      explanation: parsed.explanation,
    };
  } catch (err) {
    console.warn("OpenRouter classification fallback:", err);
    return null;
  }
}

/**
 * Tier 2: Gemini AI Intent Classifier (using GEMINI_API_KEY)
 */
async function classifyWithGemini(
  query: string,
): Promise<IntentAnalysisResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${SYSTEM_PROMPT}\n\nClassify this user request into JSON: "${query}"`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    return {
      module: parsed.module || "services",
      cluster: parsed.cluster || undefined,
      category: parsed.category || undefined,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      destination: parsed.destination || undefined,
      confidence: 0.92,
      source: "gemini",
      explanation: parsed.explanation,
    };
  } catch (err) {
    console.warn("Gemini classification fallback:", err);
    return null;
  }
}

/**
 * Tier 3: High-Precision Code Logic based on LocalServices.entity.ts & Modules
 */
export function classifyWithCodeLogic(query: string): IntentAnalysisResult {
  const q = query.toLowerCase();

  // 1. Rides
  if (
    q.includes("vijayawada") ||
    q.includes("bengaluru") ||
    q.includes("bangalore") ||
    q.includes("airport") ||
    q.includes("carpool") ||
    q.includes("ride") ||
    q.includes("lift to") ||
    q.includes("go to") ||
    q.includes("travel to") ||
    q.includes("drive to")
  ) {
    let dest: string | undefined = undefined;
    if (q.includes("vijayawada")) dest = "vijayawada";
    else if (q.includes("bengaluru") || q.includes("bangalore"))
      dest = "bengaluru";
    else if (q.includes("airport")) dest = "airport";

    return {
      module: "rides",
      destination: dest,
      keywords: [dest || "ride", "carpool"],
      confidence: 0.9,
      source: "code_logic",
      explanation: "Carpool and rideshare intent identified from keywords.",
    };
  }

  // 2. Tickets
  if (
    q.includes("ticket") ||
    q.includes("pass") ||
    q.includes("concert") ||
    q.includes("coldplay") ||
    q.includes("diljit") ||
    q.includes("ipl") ||
    q.includes("movie") ||
    q.includes("cinema") ||
    q.includes("show")
  ) {
    return {
      module: "tickets",
      keywords: ["ticket", "concert", "pass"],
      confidence: 0.9,
      source: "code_logic",
      explanation: "Event ticket marketplace intent identified.",
    };
  }

  // 3. Deals & Marketplace
  if (
    q.includes("buy") ||
    q.includes("sell") ||
    q.includes("second hand") ||
    q.includes("used") ||
    q.includes("cycle") ||
    q.includes("bicycle") ||
    q.includes("deal") ||
    q.includes("discount") ||
    q.includes("marketplace") ||
    q.includes("pre-owned")
  ) {
    return {
      module: "deals",
      keywords: ["buy", "sell", "deal", "used"],
      confidence: 0.88,
      source: "code_logic",
      explanation: "Local deals and marketplace intent identified.",
    };
  }

  // 4. HelpMe & Emergency Broadcast
  if (
    q.includes("lost") ||
    q.includes("found") ||
    q.includes("wallet") ||
    q.includes("missing") ||
    q.includes("stolen") ||
    q.includes("emergency") ||
    q.includes("urgent") ||
    q.includes("alert") ||
    q.includes("pet") ||
    q.includes("dog") ||
    q.includes("help me")
  ) {
    return {
      module: "helpme",
      keywords: ["lost", "found", "urgent", "emergency"],
      confidence: 0.9,
      source: "code_logic",
      explanation: "Community alert and urgent broadcast intent identified.",
    };
  }

  // 5. DayMates Activities
  if (
    q.includes("badminton") ||
    q.includes("partner") ||
    q.includes("buddy") ||
    q.includes("cricket") ||
    q.includes("tennis") ||
    q.includes("gym") ||
    q.includes("workout") ||
    q.includes("coffee") ||
    q.includes("walk") ||
    q.includes("meetup") ||
    q.includes("activity")
  ) {
    return {
      module: "daymates",
      keywords: ["activity", "partner", "social"],
      confidence: 0.88,
      source: "code_logic",
      explanation: "Social activity companion intent identified.",
    };
  }

  // 6. Services Clusters & Categories (LocalServices.entity.ts)
  // Cluster: "auto" (Mechanics, Bike repair, Puncture, Car repair, Roadside)
  if (
    q.includes("bike") ||
    q.includes("mechanic") ||
    q.includes("puncture") ||
    q.includes("motorcycle") ||
    q.includes("two wheeler") ||
    q.includes("scooter") ||
    q.includes("activa") ||
    q.includes("tyre") ||
    q.includes("tire") ||
    q.includes("flat tyre") ||
    q.includes("car repair") ||
    q.includes("car wash") ||
    q.includes("towing") ||
    q.includes("roadside") ||
    q.includes("jumpstart") ||
    /\bauto\b/.test(q)
  ) {
    let cat = "Bike repair";
    if (q.includes("puncture") || q.includes("tyre") || q.includes("tire")) {
      cat = "Puncture";
    } else if (q.includes("car wash")) {
      cat = "Car wash";
    } else if (q.includes("towing") || q.includes("roadside")) {
      cat = "Roadside assistance";
    } else if (q.includes("car") && !q.includes("bike")) {
      cat = "Car repair";
    }

    return {
      module: "services",
      cluster: "auto",
      category: cat,
      keywords: ["bike", "mechanic", "puncture", "repair", "auto"],
      confidence: 0.95,
      source: "code_logic",
      explanation: `Auto pro service (${cat}) identified from LocalServices entity categories.`,
    };
  }

  // Cluster: "glam" (Bridal Makeup, Facials, Waxing, Mehendi, Hair)
  if (
    q.includes("makeup") ||
    q.includes("bridal") ||
    q.includes("mehendi") ||
    q.includes("hair") ||
    q.includes("facial") ||
    q.includes("waxing") ||
    q.includes("grooming") ||
    q.includes("beauty") ||
    q.includes("salon") ||
    q.includes("glam")
  ) {
    return {
      module: "services",
      cluster: "glam",
      category: q.includes("bridal") ? "Bridal Makeup" : "Beauty & Grooming",
      keywords: ["makeup", "bridal", "beauty", "glam"],
      confidence: 0.95,
      source: "code_logic",
      explanation:
        "Glam & beauty service identified from LocalServices entity.",
    };
  }

  // Cluster: "home" (Deep Cleaning, Maids, Cooking / Tiffin, Pest Control)
  if (
    q.includes("cook") ||
    q.includes("tiffin") ||
    q.includes("meal") ||
    q.includes("food") ||
    q.includes("clean") ||
    q.includes("maid") ||
    q.includes("pest") ||
    q.includes("moving") ||
    q.includes("packers")
  ) {
    const cat =
      q.includes("cook") || q.includes("tiffin") || q.includes("meal")
        ? "Cooking"
        : q.includes("pest")
          ? "Pest-control requests"
          : q.includes("clean")
            ? "Deep Cleaning"
            : "Maids";

    return {
      module: "services",
      cluster: "home",
      category: cat,
      keywords: ["home", "cook", "cleaning", "maid"],
      confidence: 0.95,
      source: "code_logic",
      explanation: `Home assistance service (${cat}) identified from LocalServices entity.`,
    };
  }

  // Cluster: "fix" (Electrician, Plumber, AC Repair, Carpenter, Appliance)
  if (
    q.includes("electric") ||
    q.includes("wiring") ||
    q.includes("plumb") ||
    q.includes("pipe") ||
    q.includes("leak") ||
    q.includes("tap") ||
    q.includes("ac") ||
    q.includes("cooling") ||
    q.includes("carpenter") ||
    q.includes("wood") ||
    q.includes("washing machine") ||
    q.includes("appliance") ||
    q.includes("geyser") ||
    q.includes("tv")
  ) {
    const cat =
      q.includes("electric") || q.includes("wiring")
        ? "Electrician"
        : q.includes("plumb") || q.includes("pipe") || q.includes("leak")
          ? "Plumber"
          : q.includes("ac") || q.includes("cooling")
            ? "AC repair"
            : q.includes("carpenter")
              ? "Carpenter"
              : "Appliance repair";

    return {
      module: "services",
      cluster: "fix",
      category: cat,
      keywords: ["technician", "repair", "fix"],
      confidence: 0.95,
      source: "code_logic",
      explanation: `Technician repair service (${cat}) identified from LocalServices entity.`,
    };
  }

  // General Services Default
  return {
    module: "services",
    keywords: query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3),
    confidence: 0.5,
    source: "code_logic",
    explanation: "General search across verified community service pros.",
  };
}

/**
 * Main AI Intent Router:
 * 1. OpenRouter (if OPENROUTER_API_KEY is configured)
 * 2. Gemini (if GEMINI_API_KEY is configured)
 * 3. High-Precision Code Logic (zero latency fallback)
 */
export async function routeUserIntent(
  query: string,
): Promise<IntentAnalysisResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return classifyWithCodeLogic("");
  }

  // 1. Try OpenRouter if API key exists
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const openRouterResult = await classifyWithOpenRouter(trimmed);
      if (openRouterResult) return openRouterResult;
    } catch (err) {
      console.warn("OpenRouter routing failed, falling back:", err);
    }
  }

  // 2. Try Gemini if GEMINI_API_KEY exists
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiResult = await classifyWithGemini(trimmed);
      if (geminiResult) return geminiResult;
    } catch (err) {
      console.warn("Gemini routing failed, falling back:", err);
    }
  }

  // 3. Zero-latency Code Logic based on LocalServices.entity.ts
  return classifyWithCodeLogic(trimmed);
}
