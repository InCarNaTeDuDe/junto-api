import { GoogleGenAI } from "@google/genai";
import {
  SERVICE_CLUSTERS,
  LOCAL_SERVICE_CATEGORIES,
  resolveServiceCluster,
} from "../entities/LocalServices.entity";

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
   Clusters and Categories from LocalServices.entity.ts:
   - "auto":
     * "Bike repair" (mechanic, bike servicing, engine oil, chain, two-wheeler, scooter, motorcycle, activa, puncture, repair)
     * "Puncture" (tubeless puncture, tyre, air check, flat tyre, jumpstart)
     * "Car repair" (car mechanic, breakdown, engine, brakes)
     * "Car wash" (foam wash, car cleaning, interior vacuum)
     * "Roadside assistance" (towing, emergency fuel, breakdown help)
   - "fix":
     * "Electrician" (wiring, switches, switchboard, geyser, inverter)
     * "Plumber" (pipe leaks, tap fitting, blockage, overhead tank)
     * "AC repair" (cooling, jet cleaning, gas charging, AC servicing)
     * "Washing machine repair" (appliances, drum, dryer)
     * "Carpenter" (woodwork, hinges, wardrobes, furniture)
     * "TV/electronics repair" (LED TV, screen, microwave)
   - "glam":
     * "Bridal makeup", "Facial", "Mehendi", "Hair styling", "Nails & Art"
   - "home":
     * "Deep cleaning", "Cooking" / "Tiffin", "Pest-control requests", "Moving assistance", "Maids"

2. "rides" - RideMate carpools, sharing rides, travel to cities (e.g. Vijayawada, Bengaluru, Airport).
3. "tickets" - TicketSwap for event tickets, concert passes (Coldplay, Diljit, IPL, movies).
4. "deals" - Buying/selling pre-owned goods, local deals, discounts (used cycle, phone, camera).
5. "helpme" - Urgent community alerts, lost and found (lost wallet, lost pet, emergency help).
6. "daymates" - Social activities, sports buddies (badminton partner, gym buddy, weekend walk, coffee).

CRITICAL INSTRUCTIONS FOR AUTO & MECHANICS:
If the user mentions bike, mechanic, scooter, motorcycle, puncture, two-wheeler, tyre, flat tyre, car repair, or roadside help:
Always return "module": "services", "cluster": "auto", and "category": "Bike repair" (or "Puncture", "Car repair", "Car wash", "Roadside assistance").

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
 * Normalizes intent result to match canonical categories and clusters in LocalServices.entity.ts
 */
export function normalizeAiIntent(
  result: Partial<IntentAnalysisResult>,
  query: string,
): IntentAnalysisResult {
  const q = query.toLowerCase();
  let module = result.module || "services";
  let cluster = result.cluster;
  let category = result.category;
  let keywords = Array.isArray(result.keywords) ? [...result.keywords] : [];
  let destination = result.destination;

  // Auto / Bike Mechanic domain guarantee:
  if (
    q.includes("bike") ||
    q.includes("mechanic") ||
    q.includes("puncture") ||
    q.includes("motorcycle") ||
    q.includes("two wheeler") ||
    q.includes("two-wheeler") ||
    q.includes("scooter") ||
    q.includes("activa") ||
    (category &&
      /bike|mechanic|puncture|motorcycle|scooter|auto pro|two wheeler/i.test(
        category,
      ))
  ) {
    module = "services";
    cluster = "auto";
    if (q.includes("puncture") || (category && /puncture/i.test(category))) {
      category = "Puncture";
    } else if (
      q.includes("car wash") ||
      (category && /car wash/i.test(category))
    ) {
      category = "Car wash";
    } else if (
      q.includes("roadside") ||
      q.includes("towing") ||
      (category && /roadside|towing/i.test(category))
    ) {
      category = "Roadside assistance";
    } else if (
      q.includes("car repair") ||
      (q.includes("car") &&
        !q.includes("bike") &&
        category &&
        /car/i.test(category))
    ) {
      category = "Car repair";
    } else {
      category = "Bike repair";
    }
    keywords = Array.from(
      new Set([...keywords, "bike", "mechanic", "repair", "servicing", "auto"]),
    );
  }

  // Canonicalize category names from LocalServices.entity.ts
  if (category) {
    const catLower = category.toLowerCase();
    if (catLower.includes("bike") || catLower.includes("mechanic")) {
      category = "Bike repair";
      cluster = "auto";
    } else if (catLower.includes("puncture") || catLower.includes("tyre")) {
      category = "Puncture";
      cluster = "auto";
    } else if (catLower.includes("car wash")) {
      category = "Car wash";
      cluster = "auto";
    } else if (catLower.includes("roadside") || catLower.includes("towing")) {
      category = "Roadside assistance";
      cluster = "auto";
    } else if (catLower.includes("electric") || catLower.includes("wiring")) {
      category = "Electrician";
      cluster = "fix";
    } else if (catLower.includes("plumb") || catLower.includes("pipe")) {
      category = "Plumber";
      cluster = "fix";
    } else if (catLower.includes("ac")) {
      category = "AC repair";
      cluster = "fix";
    } else if (
      catLower.includes("appliance") ||
      catLower.includes("washing machine")
    ) {
      category = "Washing machine repair";
      cluster = "fix";
    } else if (catLower.includes("carpenter") || catLower.includes("wood")) {
      category = "Carpenter";
      cluster = "fix";
    } else if (catLower.includes("tv")) {
      category = "TV/electronics repair";
      cluster = "fix";
    } else if (catLower.includes("cook") || catLower.includes("tiffin")) {
      category = "Cooking";
      cluster = "home";
    } else if (catLower.includes("clean")) {
      category = "Deep cleaning";
      cluster = "home";
    } else if (catLower.includes("pest")) {
      category = "Pest-control requests";
      cluster = "home";
    } else if (catLower.includes("mover") || catLower.includes("pack")) {
      category = "Moving assistance";
      cluster = "home";
    } else if (catLower.includes("makeup") || catLower.includes("bridal")) {
      category = "Bridal makeup";
      cluster = "glam";
    } else if (catLower.includes("facial")) {
      category = "Facial";
      cluster = "glam";
    } else if (catLower.includes("mehendi")) {
      category = "Mehendi";
      cluster = "glam";
    } else if (catLower.includes("hair")) {
      category = "Hair styling";
      cluster = "glam";
    } else if (catLower.includes("nail")) {
      category = "Nails & Art";
      cluster = "glam";
    }
  }

  // Double check cluster resolution
  if (module === "services" && !cluster) {
    cluster = resolveServiceCluster(category, "", cluster) as any;
  }

  return {
    module: module as any,
    cluster: cluster as any,
    category: category || undefined,
    keywords,
    destination: destination || undefined,
    confidence: result.confidence ?? 0.95,
    source: result.source || "code_logic",
    explanation:
      result.explanation ||
      (module === "services"
        ? `Identified ${category || "local pro"} service in ${cluster || "services"} cluster.`
        : `Routed to ${module}.`),
  };
}

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
    const timeout = setTimeout(() => controller.abort(), 4500);

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

    if (!response.ok) {
      console.warn(
        `OpenRouter HTTP error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = await response.json();
    let rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    // Clean code block wrappers if model provided them
    rawContent = rawContent
      .replace(/```json\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return normalizeAiIntent(
      {
        module: parsed.module || "services",
        cluster: parsed.cluster || undefined,
        category: parsed.category || undefined,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        destination: parsed.destination || undefined,
        confidence: 0.95,
        source: "openrouter",
        explanation: parsed.explanation,
      },
      query,
    );
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
    const genPromise = ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${SYSTEM_PROMPT}\n\nClassify this user request into JSON: "${query}"`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini timeout")), 3000),
    );

    const response = await Promise.race([genPromise, timeoutPromise]);

    const text = response.text;
    if (!text) return null;

    const cleanText = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return normalizeAiIntent(
      {
        module: parsed.module || "services",
        cluster: parsed.cluster || undefined,
        category: parsed.category || undefined,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        destination: parsed.destination || undefined,
        confidence: 0.92,
        source: "gemini",
        explanation: parsed.explanation,
      },
      query,
    );
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

  // 3. Services Clusters & Categories (checked BEFORE deals to prevent "repair" or "mechanic" from falling into used cycle deals)
  // Cluster: "auto" (Mechanics, Bike repair, Puncture, Car repair, Roadside)
  if (
    q.includes("bike") ||
    q.includes("mechanic") ||
    q.includes("puncture") ||
    q.includes("motorcycle") ||
    q.includes("two wheeler") ||
    q.includes("two-wheeler") ||
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
      keywords: ["bike", "mechanic", "puncture", "repair", "auto", "servicing"],
      confidence: 0.98,
      source: "code_logic",
      explanation: `Auto pro service (${cat}) identified from LocalServices entity categories.`,
    };
  }

  // 4. Deals & Marketplace (Only for genuine buy/sell without service/repair intent)
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

  // 5. HelpMe & Emergency Broadcast
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

  // 6. DayMates Activities
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
      category: q.includes("bridal") ? "Bridal makeup" : "Facial",
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
            ? "Deep cleaning"
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
              : "Washing machine repair";

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
  return normalizeAiIntent(classifyWithCodeLogic(trimmed), trimmed);
}
