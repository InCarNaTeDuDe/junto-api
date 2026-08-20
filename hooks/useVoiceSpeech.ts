import { useState, useEffect, useRef, useCallback } from "react";
import { Platform, Alert } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export interface ParsedDealVoice {
  rawTranscript: string;
  title: string;
  category:
    | "Cycles"
    | "Mobiles"
    | "Electronics"
    | "Furniture"
    | "Appliances"
    | "Books"
    | "Fitness"
    | "General";
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
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");

  const webRecognitionRef = useRef<any>(null);
  const onSpeechChangeRef = useRef<
    ((text: string, isFinal: boolean) => void) | null
  >(null);
  const onErrorCallbackRef = useRef<((errText: string) => void) | null>(null);

  // Check initial permissions & support
  useEffect(() => {
    async function checkSupportAndPermissions() {
      try {
        if (
          ExpoSpeechRecognitionModule &&
          typeof ExpoSpeechRecognitionModule.getPermissionsAsync === "function"
        ) {
          const perm = await ExpoSpeechRecognitionModule.getPermissionsAsync();
          if (perm.status === "granted") {
            setPermissionStatus("granted");
          } else if (perm.status === "denied") {
            setPermissionStatus("denied");
          } else {
            setPermissionStatus("prompt");
          }
          setIsSupported(true);
          return;
        }
      } catch (e) {
        // Fallback to web checking
      }

      if (typeof window !== "undefined") {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          setIsSupported(true);
        }

        if (navigator?.permissions?.query) {
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
            .catch(() => {});
        }
      }
    }

    checkSupportAndPermissions();
  }, []);

  // Listen to expo-speech-recognition events (Native & Web via expo-speech-recognition)
  useSpeechRecognitionEvent("start", () => {
    setIsListening(true);
    setError(null);
    setPermissionStatus("granted");
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent("result", (event) => {
    const spoken = event.results[0]?.transcript || "";
    const isFinal = Boolean(event.isFinal);

    if (spoken) {
      if (isFinal) {
        setTranscript(spoken);
        setInterimTranscript("");
      } else {
        setInterimTranscript(spoken);
        setTranscript(spoken);
      }

      if (onSpeechChangeRef.current) {
        onSpeechChangeRef.current(spoken, isFinal);
      }
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.warn("ExpoSpeechRecognition error:", event.error, event.message);
    let userMsg = "Could not hear audio clearly. Please try speaking again.";

    if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {
      setPermissionStatus("denied");
      userMsg =
        "Microphone permission is required. Please allow microphone access in your device settings.";
    } else if (
      event.error === "no-speech" ||
      event.error === "speech-timeout"
    ) {
      userMsg = "No speech detected. Please tap the mic and speak clearly.";
    } else if (event.error === "audio-capture") {
      userMsg = "Microphone is unavailable or in use by another app.";
    } else if (event.error === "network") {
      userMsg =
        "Network error during speech recognition. Please check your internet connection.";
    }

    setError(userMsg);
    setIsListening(false);
    if (onErrorCallbackRef.current) {
      onErrorCallbackRef.current(userMsg);
    }
  });

  /**
   * Explicitly ask the user for microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // 1. Try ExpoSpeechRecognitionModule permissions
    try {
      if (
        ExpoSpeechRecognitionModule &&
        typeof ExpoSpeechRecognitionModule.requestPermissionsAsync ===
          "function"
      ) {
        const perm =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (perm.status === "granted" || perm.granted) {
          setPermissionStatus("granted");
          setError(null);
          return true;
        } else {
          setPermissionStatus("denied");
          const msg =
            "Microphone permission was denied. Please allow microphone access in settings to speak your request.";
          setError(msg);
          return false;
        }
      }
    } catch (e) {
      console.warn("ExpoSpeechRecognition permission request error:", e);
    }

    // 2. Web browser fallback
    if (
      typeof window !== "undefined" &&
      navigator?.mediaDevices?.getUserMedia
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        setPermissionStatus("granted");
        setError(null);
        return true;
      } catch (permErr: any) {
        console.warn("Browser microphone permission request error:", permErr);
        setPermissionStatus("denied");
        const msg =
          "Microphone access was denied. Please allow microphone permissions in your browser or device settings.";
        setError(msg);
        return false;
      }
    }

    return true;
  }, []);

  const startListening = useCallback(
    async (
      onSpeechChange?: (text: string, isFinal: boolean) => void,
      onErrorCallback?: (errText: string) => void,
    ) => {
      setError(null);
      setTranscript("");
      setInterimTranscript("");

      onSpeechChangeRef.current = onSpeechChange || null;
      onErrorCallbackRef.current = onErrorCallback || null;

      // First, ensure microphone permission is granted
      if (permissionStatus !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          const permMsg =
            "Microphone permission is required. Please grant microphone access to use voice search.";
          setError(permMsg);
          if (onErrorCallback) onErrorCallback(permMsg);
          return;
        }
      }

      // Try ExpoSpeechRecognitionModule first
      try {
        if (
          ExpoSpeechRecognitionModule &&
          typeof ExpoSpeechRecognitionModule.start === "function"
        ) {
          setIsListening(true);
          await ExpoSpeechRecognitionModule.start({
            lang: "en-IN",
            interimResults: true,
            continuous: true,
            requiresOnDeviceRecognition: false,
          });
          return;
        }
      } catch (nativeErr: any) {
        console.warn(
          "ExpoSpeechRecognitionModule start error, trying web fallback:",
          nativeErr,
        );
      }

      // Fallback to browser Web Speech API
      if (typeof window !== "undefined") {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
          try {
            if (webRecognitionRef.current) {
              try {
                webRecognitionRef.current.abort();
              } catch (e) {}
            }

            const recognition = new SpeechRecognition();
            webRecognitionRef.current = recognition;
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-IN";

            recognition.onstart = () => {
              setIsListening(true);
              setError(null);
              setPermissionStatus("granted");
            };

            recognition.onresult = (event: any) => {
              let currentInterim = "";
              let currentFinal = "";

              for (let i = 0; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  currentFinal += event.results[i][0].transcript;
                } else {
                  currentInterim += event.results[i][0].transcript;
                }
              }

              const activeTranscript = (currentFinal || currentInterim).trim();

              if (currentInterim) {
                setInterimTranscript(currentInterim);
              }
              if (currentFinal) {
                setTranscript(currentFinal);
              } else if (activeTranscript) {
                setTranscript(activeTranscript);
              }

              if (activeTranscript && onSpeechChangeRef.current) {
                onSpeechChangeRef.current(
                  activeTranscript,
                  Boolean(currentFinal),
                );
              }
            };

            recognition.onerror = (event: any) => {
              console.warn("Web Speech recognition error:", event.error);
              let errorMsg = "Could not hear audio clearly. Please try again.";

              if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed" ||
                event.error === "permission-denied"
              ) {
                setPermissionStatus("denied");
                errorMsg =
                  "Microphone permission was denied. Please allow microphone access in your browser or device settings.";
              } else if (event.error === "no-speech") {
                errorMsg =
                  "No speech detected. Please tap the mic and speak clearly.";
              }

              setError(errorMsg);
              setIsListening(false);
              if (onErrorCallbackRef.current)
                onErrorCallbackRef.current(errorMsg);
            };

            recognition.onend = () => {
              setIsListening(false);
            };

            recognition.start();
            return;
          } catch (err: any) {
            console.error("Web SpeechRecognition start exception:", err);
          }
        }
      }

      // If no native or browser speech engine is available
      setIsSupported(false);
      const unsupportedMsg =
        "Speech recognition is not available on this device configuration. Please type or tap quick presets.";
      setError(unsupportedMsg);
      if (onErrorCallback) onErrorCallback(unsupportedMsg);
    },
    [permissionStatus, requestPermission],
  );

  const stopListening = useCallback(async () => {
    try {
      if (
        ExpoSpeechRecognitionModule &&
        typeof ExpoSpeechRecognitionModule.stop === "function"
      ) {
        await ExpoSpeechRecognitionModule.stop();
      }
    } catch (e) {}

    if (webRecognitionRef.current) {
      try {
        webRecognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    error,
    setError,
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
export function parseVoiceListing(
  spokenText: string,
  defaultCity = "Hyderabad",
): ParsedDealVoice {
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
  const priceRegex =
    /(?:₹|rs\.?|inr|for|price|cost|rupees)?\s*(\d{2,7})\s*(?:₹|rs\.?|rupees|bucks|k)?/i;
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
  if (
    lower.includes("brand new") ||
    lower.includes("sealed") ||
    lower.includes("unopened")
  ) {
    condition = "Brand New";
  } else if (
    lower.includes("like new") ||
    lower.includes("mint") ||
    lower.includes("scratchless") ||
    lower.includes("excellent")
  ) {
    condition = "Like New";
  } else if (
    lower.includes("fair") ||
    lower.includes("used") ||
    lower.includes("minor scratch")
  ) {
    condition = "Fair";
  }

  // 4. Detect Location / Area
  let location = defaultCity.split(",")[0].trim();
  const knownAreas = [
    "Hitec City",
    "Madhapur",
    "Gachibowli",
    "Kondapur",
    "Kukatpally",
    "Jubilee Hills",
    "Banjara Hills",
    "Secunderabad",
    "Begumpet",
    "Manikonda",
    "Miyapur",
    "Koramangala",
    "Indiranagar",
    "Whitefield",
    "Bandra",
    "Andheri",
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
    .replace(
      /(?:for|at|in|price)\s*(?:₹|rs\.?|inr)?\s*\d+\s*(?:rupees|bucks)?/gi,
      "",
    )
    .replace(
      /(?:at|in|near)\s+(?:hitec city|madhapur|gachibowli|kondapur|kukatpally|jubilee hills|banjara hills|secunderabad)/gi,
      "",
    )
    .trim();

  // Capitalize first letter
  if (cleanTitle.length > 2) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  } else {
    cleanTitle =
      category === "Cycles"
        ? "Pre-owned Gear Cycle"
        : category === "Mobiles"
          ? "Smartphone"
          : "Pre-loved Item";
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
