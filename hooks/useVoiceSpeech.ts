import { useState, useEffect, useRef, useCallback } from "react";
import { Platform, Alert } from "react-native";

export interface ParsedDealVoice {
  rawTranscript: string;
  title: string;
  category: "Cycles" | "Mobiles" | "Electronics" | "Furniture" | "Appliances" | "Books" | "Fitness" | "General";
  price: string;
  condition: "Brand New" | "Like New" | "Good" | "Fair";
  location: string;
  details: string;
}

export function useVoiceSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const recognitionRef = useRef<any>(null);

  // Check Web Speech API support
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
      } else {
        setIsSupported(false);
      }

      // Check existing permissions if supported by browser
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: "microphone" as PermissionName })
          .then((permission) => {
            if (permission.state === "granted") {
              setPermissionStatus("granted");
            } else if (permission.state === "denied") {
              setPermissionStatus("denied");
            } else {
              setPermissionStatus("prompt");
            }
            permission.onchange = () => {
              setPermissionStatus(permission.state as any);
            };
          })
          .catch(() => {
            // Permission query not supported for mic in this environment
          });
      }
    }
  }, []);

  /**
   * Explicitly ask the user for microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Release tracks immediately
          stream.getTracks().forEach((track) => track.stop());
          setPermissionStatus("granted");
          setError(null);
          return true;
        } catch (permErr: any) {
          console.warn("Microphone permission request error:", permErr);
          setPermissionStatus("denied");
          const msg =
            "Microphone access was denied or is blocked. Please enable microphone permissions in your browser address bar/settings to use voice recognition.";
          setError(msg);
          Alert.alert(
            "Microphone Permission Needed",
            "Please allow microphone access in your browser or device settings to speak your request.",
            [{ text: "OK" }],
          );
          return false;
        }
      }
    }
    return true;
  }, []);

  const startListening = useCallback(
    async (onFinalTranscript?: (text: string) => void) => {
      setError(null);
      setTranscript("");
      setInterimTranscript("");

      if (Platform.OS === "web" && typeof window !== "undefined") {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
          setIsSupported(false);
          setIsListening(true);
          setError("Speech recognition is not natively supported in this browser. Please type or tap quick presets.");
          return;
        }

        // Ask / ensure microphone permission before starting
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
            setPermissionStatus("granted");
          } catch (permErr: any) {
            console.warn("getUserMedia failed before recognition:", permErr);
            setPermissionStatus("denied");
            const msg =
              "Microphone permission is required. Please grant microphone access in your browser/device settings.";
            setError(msg);
            setIsListening(false);
            Alert.alert(
              "Microphone Access Denied",
              "Please click the microphone/lock icon in your browser address bar and select 'Allow' to enable voice input.",
              [{ text: "Got It" }],
            );
            return;
          }
        }

        try {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.abort();
            } catch (e) {
              // ignore
            }
          }

          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = "en-IN"; // English (India) with natural Indian accents & numbers

          recognition.onstart = () => {
            setIsListening(true);
            setError(null);
          };

          recognition.onresult = (event: any) => {
            let currentInterim = "";
            let finalResult = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalResult += event.results[i][0].transcript;
              } else {
                currentInterim += event.results[i][0].transcript;
              }
            }

            if (currentInterim) {
              setInterimTranscript(currentInterim);
            }

            if (finalResult) {
              setTranscript(finalResult);
              setInterimTranscript("");
              if (onFinalTranscript) {
                onFinalTranscript(finalResult);
              }
            }
          };

          recognition.onerror = (event: any) => {
            console.warn("Speech recognition error:", event.error);
            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
              setPermissionStatus("denied");
              setError("Microphone permission was blocked. Please allow mic access in your browser.");
              Alert.alert(
                "Microphone Access Blocked",
                "Please click the lock or settings icon in your browser address bar to grant microphone permissions.",
              );
            } else if (event.error !== "no-speech") {
              setError(`Microphone notice: ${event.error || "Could not hear audio clearly"}`);
            }
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
        } catch (err: any) {
          console.error("SpeechRecognition start exception:", err);
          setError(err.message || "Microphone access error");
          setIsListening(false);
        }
      } else {
        setIsListening(true);
      }
    },
    [],
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    error,
    isSupported,
    permissionStatus,
    requestPermission,
    startListening,
    stopListening,
  };
}

/**
 * Intelligent parser that converts natural speech into structured OLX-style item listings
 */
export function parseVoiceListing(spokenText: string, defaultCity = "Hyderabad"): ParsedDealVoice {
  const text = spokenText.trim();
  const lower = text.toLowerCase();

  // 1. Detect Category
  let category: ParsedDealVoice["category"] = "General";
  if (
    lower.includes("cycle") ||
    lower.includes("bicycle") ||
    lower.includes("bike") ||
    lower.includes("gear cycle") ||
    lower.includes("firefox") ||
    lower.includes("btwin") ||
    lower.includes("hercules") ||
    lower.includes("scooter")
  ) {
    category = "Cycles";
  } else if (
    lower.includes("iphone") ||
    lower.includes("samsung") ||
    lower.includes("oneplus") ||
    lower.includes("pixel") ||
    lower.includes("phone") ||
    lower.includes("mobile") ||
    lower.includes("redmi") ||
    lower.includes("realme")
  ) {
    category = "Mobiles";
  } else if (
    lower.includes("laptop") ||
    lower.includes("macbook") ||
    lower.includes("headphone") ||
    lower.includes("earbuds") ||
    lower.includes("sony") ||
    lower.includes("airpods") ||
    lower.includes("monitor") ||
    lower.includes("keyboard") ||
    lower.includes("playstation") ||
    lower.includes("ps5") ||
    lower.includes("xbox") ||
    lower.includes("camera")
  ) {
    category = "Electronics";
  } else if (
    lower.includes("table") ||
    lower.includes("chair") ||
    lower.includes("sofa") ||
    lower.includes("bed") ||
    lower.includes("desk") ||
    lower.includes("wardrobe") ||
    lower.includes("cupboard")
  ) {
    category = "Furniture";
  } else if (
    lower.includes("fridge") ||
    lower.includes("refrigerator") ||
    lower.includes("washing machine") ||
    lower.includes("microwave") ||
    lower.includes("ac") ||
    lower.includes("air conditioner") ||
    lower.includes("cooler") ||
    lower.includes("heater")
  ) {
    category = "Appliances";
  } else if (
    lower.includes("dumbbell") ||
    lower.includes("treadmill") ||
    lower.includes("gym") ||
    lower.includes("yoga") ||
    lower.includes("weights") ||
    lower.includes("badminton")
  ) {
    category = "Fitness";
  } else if (
    lower.includes("book") ||
    lower.includes("novel") ||
    lower.includes("upsc") ||
    lower.includes("engineering") ||
    lower.includes("guitar") ||
    lower.includes("keyboard")
  ) {
    category = "Books";
  }

  // 2. Detect Price
  let price = "₹1,500";
  // Matches "₹ 5000", "5000 rupees", "rs 5000", "rs. 5000", "5000 bucks", "for 6500", "price 4000"
  const priceRegex = /(?:₹|rs\.?|inr|for|price|cost|rupees)?\s*(\d{2,7})\s*(?:₹|rs\.?|rupees|bucks|k)?/i;
  const priceMatch = text.match(priceRegex);
  
  if (lower.includes("free") || lower.includes("giving away")) {
    price = "Free";
  } else if (priceMatch && priceMatch[1]) {
    const num = parseInt(priceMatch[1], 10);
    if (num > 0) {
      price = `₹${num.toLocaleString("en-IN")}`;
    }
  }

  // 3. Detect Condition
  let condition: ParsedDealVoice["condition"] = "Good";
  if (lower.includes("brand new") || lower.includes("sealed") || lower.includes("unopened")) {
    condition = "Brand New";
  } else if (lower.includes("like new") || lower.includes("mint") || lower.includes("scratchless") || lower.includes("excellent")) {
    condition = "Like New";
  } else if (lower.includes("fair") || lower.includes("used") || lower.includes("minor scratch")) {
    condition = "Fair";
  }

  // 4. Detect Location / Area
  let location = defaultCity.split(",")[0].trim();
  const knownAreas = [
    "Hitec City", "Madhapur", "Gachibowli", "Kondapur", "Kukatpally",
    "Jubilee Hills", "Banjara Hills", "Secunderabad", "Begumpet", "Manikonda",
    "Miyapur", "Koramangala", "Indiranagar", "Whitefield", "Bandra", "Andheri"
  ];
  for (const area of knownAreas) {
    if (lower.includes(area.toLowerCase())) {
      location = area;
      break;
    }
  }

  // 5. Generate clean, high-impact Title
  let cleanTitle = text
    .replace(/^selling\s*(my)?/i, "")
    .replace(/^i want to sell\s*(my)?/i, "")
    .replace(/^giving away\s*(my)?/i, "")
    .replace(/(?:for|at|in|price)\s*(?:₹|rs\.?|inr)?\s*\d+\s*(?:rupees|bucks)?/gi, "")
    .replace(/(?:at|in|near)\s+(?:hitec city|madhapur|gachibowli|kondapur|kukatpally|jubilee hills|banjara hills|secunderabad)/gi, "")
    .trim();

  // Capitalize first letter
  if (cleanTitle.length > 2) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  } else {
    cleanTitle = category === "Cycles" ? "Pre-owned Gear Cycle" : category === "Mobiles" ? "Smartphone" : "Pre-loved Item";
  }

  return {
    rawTranscript: text,
    title: cleanTitle,
    category,
    price,
    condition,
    location,
    details: text,
  };
}
