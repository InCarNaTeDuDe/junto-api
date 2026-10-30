import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { scale, verticalScale } from "react-native-size-matters";

import { useTheme } from "@/hooks/useTheme";
import { useAuthContext } from "@/context/AuthContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { ApiService } from "@/services/api";
import FormattedMarkdownText from "@/components/FormattedMarkdownText";
import {
  saveSupportChatMessages,
  getSupportChatMessages,
  removeSupportChatMessages,
} from "@/utils/secureStorage";

export interface SupportChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  context?: {
    category?: string;
    issueType?: string;
    actionUrl?: string;
    actionLabel?: string;
    caseNumber?: string;
    canCreateTicket?: boolean;
    recordId?: string;
  };
}

interface InAppActionCard {
  label: string;
  sub: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface SupportCategory {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
  color: string;
  prompt: string;
  issues: SupportIssue[];
}

interface SupportIssue {
  id: string;
  label: string;
  actionType:
    | "navigate"
    | "select_record"
    | "chat_input"
    | "escalate"
    | "escalate_safety";
  route?: string;
  actionLabel?: string;
  entityType?:
    | "ride"
    | "activity"
    | "ticket"
    | "deal"
    | "service"
    | "asknearby";
  filter?: string;
  botPrompt?: string;
  botResponse?: string;
}

interface UserRecordItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  date: string;
  status: string;
  role?: string;
  details?: Record<string, any>;
}

interface SupportCaseRecord {
  caseNumber: string;
  userId: string;
  category: string;
  issueType: string;
  summary: string;
  details?: string;
  status: string;
  createdAt: string;
  estimatedResponseTime: string;
  relatedEntitySummary?: string;
  urgentSafety?: boolean;
}

const DEFAULT_CATEGORIES: SupportCategory[] = [
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
          "You can offer a ride directly from Junto!\n\nTap below to share your route, spare seats, vehicle type (car/bike), and price per seat.",
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
        botPrompt: "I can help with that. Which ride would you like to cancel?",
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
          "Please tell me a little more about what's going on with your ride.",
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
];

const INITIAL_GREETING_TEXT =
  "Hi! 👋 Welcome to Junto Support.\n\nWhat can I help you with today?";

function detectActionCards(text: string): InAppActionCard[] {
  const cards: InAppActionCard[] = [];
  const lower = text.toLowerCase();

  // Explicit markdown link detection [label](app://...)
  const linkMatches = [...text.matchAll(/\[(.*?)\]\((app:\/\/[^\s)]+)\)/g)];
  if (linkMatches.length > 0) {
    for (const match of linkMatches) {
      const rawLabel = match[1].replace(/^[^\w\s]+/, "").trim();
      const url = match[2];
      let icon: keyof typeof Ionicons.glyphMap = "navigate-circle-outline";
      let color = "#A855F7";
      let sub = "Tap to open inside app";

      if (url.includes("rides")) {
        icon = "car-sport";
        color = "#10B981";
        sub = url.includes("offer")
          ? "Open ride creation screen"
          : "Search available carpools";
      } else if (url.includes("ticket")) {
        icon = "ticket";
        color = "#F97316";
        sub = "Open ticket listing & swap";
      } else if (url.includes("daymate")) {
        icon = "people";
        color = "#8B5CF6";
        sub = "Create hangout or activity";
      } else if (url.includes("service")) {
        icon = "construct";
        color = "#3B82F6";
        sub = "Browse verified neighborhood pros";
      } else if (url.includes("deal")) {
        icon = "pricetag";
        color = "#F59E0B";
        sub = "Open pre-owned marketplace";
      } else if (url.includes("asknearby") || url.includes("ask-nearby")) {
        icon = "megaphone";
        color = "#EC4899";
        sub = "Broadcast urgent requests to neighbors";
      } else if (url.includes("explore")) {
        icon = "compass";
        color = "#8B5CF6";
        sub = "Explore community hangouts & deals";
      } else if (url.includes("profile")) {
        icon = "person";
        color = "#6366F1";
        sub = "View and edit profile details";
      }

      cards.push({ label: rawLabel || "Open Screen", sub, url, icon, color });
    }
    return cards;
  }

  // Fallback heuristic detection if not in markdown link
  if (
    (lower.includes("post") || lower.includes("offer")) &&
    (lower.includes("ride") || lower.includes("carpool"))
  ) {
    cards.push({
      label: "Post / Offer a Ride",
      sub: "Open RideMate carpool creation screen",
      url: "app://rides?tab=offer",
      icon: "car-sport",
      color: "#10B981",
    });
  } else if (
    lower.includes("find") &&
    (lower.includes("ride") || lower.includes("carpool"))
  ) {
    cards.push({
      label: "Find Available Rides",
      sub: "Search daily carpools on your route",
      url: "app://rides?tab=find",
      icon: "car-outline",
      color: "#10B981",
    });
  } else if (lower.includes("sell") && lower.includes("ticket")) {
    cards.push({
      label: "Sell / Swap Ticket",
      sub: "Post spare movie or event ticket",
      url: "app://add-ticket",
      icon: "ticket",
      color: "#F97316",
    });
  } else if (lower.includes("create") && lower.includes("daymate")) {
    cards.push({
      label: "Create DayMate Activity",
      sub: "Find companion for gym, coffee or sports",
      url: "app://add-daymate",
      icon: "people",
      color: "#8B5CF6",
    });
  } else if (lower.includes("browse") && lower.includes("service")) {
    cards.push({
      label: "Browse Local Services",
      sub: "Find verified local technicians & pros",
      url: "app://services",
      icon: "construct",
      color: "#3B82F6",
    });
  }

  return cards;
}

export default function CustomerCareChatModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { theme: t, isDark } = useTheme();
  const { user, isLoggedIn } = useAuthContext();
  const { clearFeatureAlert } = useAppConfig();

  const [categories, setCategories] =
    useState<SupportCategory[]>(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<SupportCategory | null>(
    null,
  );
  const [activeIssue, setActiveIssue] = useState<SupportIssue | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<UserRecordItem | null>(
    null,
  );

  // User records state
  const [userRecords, setUserRecords] = useState<UserRecordItem[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Support ticket / case state
  const [isRaisingTicket, setIsRaisingTicket] = useState(false);
  const [showCaseTrackingModal, setShowCaseTrackingModal] = useState(false);
  const [activeTrackingCase, setActiveTrackingCase] =
    useState<SupportCaseRecord | null>(null);
  const [showSupportEscalationPrompt, setShowSupportEscalationPrompt] =
    useState(false);

  const sessionIdRef = useRef<string>(`session-${Date.now()}`);

  const initialMessage: SupportChatMessage = {
    id: "welcome-greeting-msg",
    sender: "bot",
    text: INITIAL_GREETING_TEXT,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  const [messages, setMessages] = useState<SupportChatMessage[]>([
    initialMessage,
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [endingChat, setEndingChat] = useState(false);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  const [isSyncingHistory, setIsSyncingHistory] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // 1. Fetch dynamic support config from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const res = await ApiService.get<{
          success: boolean;
          categories?: SupportCategory[];
        }>("/api/support/config");

        if (
          isMounted &&
          res?.success &&
          Array.isArray(res.categories) &&
          res.categories.length > 0
        ) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.warn(
          "Could not load dynamic support config, using standard configuration:",
          err,
        );
      }
    }
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load preserved messages on mount
  useEffect(() => {
    let isMounted = true;

    async function loadPreservedChat() {
      try {
        const cached = await getSupportChatMessages(user?.id);
        if (isMounted && cached && cached.length > 0) {
          setMessages(cached);
        }
      } catch (err) {
        console.warn("Error loading cached support messages:", err);
      }

      if (isLoggedIn) {
        try {
          setIsSyncingHistory(true);
          const res = await ApiService.get<{
            success: boolean;
            messages: SupportChatMessage[];
          }>("/api/support/messages");

          if (
            isMounted &&
            res &&
            res.success &&
            Array.isArray(res.messages) &&
            res.messages.length > 0
          ) {
            setMessages(res.messages);
            await saveSupportChatMessages(user?.id, res.messages);
          }
        } catch (apiErr) {
          console.warn("Could not sync supportchat from database:", apiErr);
        } finally {
          if (isMounted) setIsSyncingHistory(false);
        }
      }
    }

    loadPreservedChat();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isLoggedIn]);

  const persistMessages = async (newMessages: SupportChatMessage[]) => {
    try {
      await saveSupportChatMessages(user?.id, newMessages);
    } catch (e) {
      console.warn("Failed to persist support messages locally:", e);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  // Safe navigation handler
  const handleActionNavigation = (rawUrl: string) => {
    clearFeatureAlert?.();

    let target = rawUrl;
    if (rawUrl.startsWith("app://")) {
      const path = rawUrl.replace("app://", "");
      if (path.startsWith("rides")) {
        target = `/(screens)/${path}`;
      } else if (path === "add-ticket") {
        target = "/(screens)/add-ticket";
      } else if (path === "add-daymate") {
        target = "/(screens)/add-daymate";
      } else if (path === "deals") {
        target = "/(screens)/deals";
      } else if (path === "services" || path === "localservices") {
        target = "/(screens)/services";
      } else if (path === "glamup") {
        target = "/(screens)/glamup";
      } else if (path === "profile") {
        target = "/(tabs)/profile";
      } else if (path === "explore") {
        target = "/(tabs)/explore";
      } else if (path === "asknearby" || path === "ask-nearby") {
        target = "/(screens)/ask-nearby";
      } else if (path === "location-search" || path === "location") {
        target = "/(screens)/location-search";
      } else {
        target = `/(screens)/${path}`;
      }
    } else if (
      rawUrl.startsWith("http://") ||
      rawUrl.startsWith("https://") ||
      rawUrl.startsWith("mailto:")
    ) {
      Linking.openURL(rawUrl).catch(() => {});
      return;
    }

    onClose();
    setTimeout(() => {
      router.push(target as any);
    }, 120);
  };

  // Send message helper
  const handleSend = async (
    textToSend?: string,
    overrideContext?: {
      category?: string;
      issueType?: string;
      selectedRecord?: any;
    },
  ) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: SupportChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    persistMessages(updatedWithUser);

    setInput("");
    setLoading(true);
    scrollToBottom();

    const activeCtx = {
      category: overrideContext?.category || activeCategory?.id,
      issueType: overrideContext?.issueType || activeIssue?.label,
      selectedRecord: overrideContext?.selectedRecord || selectedRecord,
      sessionId: sessionIdRef.current,
    };

    try {
      const res = await ApiService.post<{ success: boolean; reply: string }>(
        "/api/support/chat",
        {
          messages: updatedWithUser,
          userMessage: query,
          context: activeCtx,
        },
      );

      const botReplyText =
        res && res.reply
          ? res.reply
          : "I'm having trouble connecting to Junto services right now. You can email **support@junto.app** for assistance.";

      const botMsg: SupportChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botReplyText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const updatedWithBot = [...updatedWithUser, botMsg];
      setMessages(updatedWithBot);
      persistMessages(updatedWithBot);

      // Check if bot offered escalation or if issue requires escalation
      if (
        botReplyText.toLowerCase().includes("support request") ||
        botReplyText.toLowerCase().includes("raise a ticket") ||
        activeIssue?.actionType === "escalate" ||
        activeIssue?.actionType === "escalate_safety"
      ) {
        setShowSupportEscalationPrompt(true);
      }
    } catch (err) {
      console.error("Support API error:", err);
      const fallbackMsg: SupportChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "I couldn't resolve this automatically. Would you like me to raise a support request for our team?",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      const updatedWithFallback = [...updatedWithUser, fallbackMsg];
      setMessages(updatedWithFallback);
      persistMessages(updatedWithFallback);
      setShowSupportEscalationPrompt(true);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  // Step 1: Select Category
  const handleSelectCategory = (cat: SupportCategory) => {
    setActiveCategory(cat);
    setActiveIssue(null);
    setSelectedRecord(null);
    setUserRecords([]);
    setShowSupportEscalationPrompt(false);

    const userMsg: SupportChatMessage = {
      id: `cat-user-${Date.now()}`,
      sender: "user",
      text: `${cat.emoji} ${cat.label}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const botMsg: SupportChatMessage = {
      id: `cat-bot-${Date.now() + 1}`,
      sender: "bot",
      text:
        cat.prompt ||
        `Sure! What do you need help with regarding ${cat.label}?`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updated = [...messages, userMsg, botMsg];
    setMessages(updated);
    persistMessages(updated);

    if (isLoggedIn) {
      ApiService.post("/api/support/log-messages", {
        messages: [
          { sender: "user", text: userMsg.text },
          { sender: "bot", text: botMsg.text },
        ],
        sessionId: sessionIdRef.current,
      }).catch((err) =>
        console.warn("Could not log category support messages:", err),
      );
    }

    scrollToBottom();
  };

  // Step 2: Select Issue
  const handleSelectIssue = async (issue: SupportIssue) => {
    setActiveIssue(issue);
    setShowSupportEscalationPrompt(false);

    // If a record has ALREADY been selected (e.g. user selected ride -> then selected issue)
    if (selectedRecord) {
      await handleSend(issue.label, {
        category: activeCategory?.id,
        issueType: issue.label,
        selectedRecord: selectedRecord,
      });
      return;
    }

    setSelectedRecord(null);

    const userMsg: SupportChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: issue.label,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Helper to log interaction to backend
    const logIssueInteraction = (botText: string) => {
      if (isLoggedIn) {
        ApiService.post("/api/support/log-messages", {
          messages: [
            { sender: "user", text: userMsg.text },
            { sender: "bot", text: botText },
          ],
          sessionId: sessionIdRef.current,
        }).catch((err) =>
          console.warn("Could not log issue support messages:", err),
        );
      }
    };

    // Scenario C: If issue is a direct navigation action (e.g. "I want to offer a ride.")
    if (issue.actionType === "navigate" && issue.route) {
      const responseText = `${issue.botResponse || "You can complete this directly in Junto!"}\n\n👉 **[${issue.actionLabel || "Open Screen"}](${issue.route})**`;

      const botMsg: SupportChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const updated = [...messages, userMsg, botMsg];
      setMessages(updated);
      persistMessages(updated);
      logIssueInteraction(responseText);
      scrollToBottom();
      return;
    }

    // Scenario A & B: If issue requires selecting a record (e.g. "My ride is confirmed." or "Driver didn't arrive.")
    if (issue.actionType === "select_record" && issue.entityType) {
      const botMsgText =
        issue.botPrompt || `Which ${issue.entityType} are you referring to?`;

      const botMsg: SupportChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botMsgText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const updated = [...messages, userMsg, botMsg];
      setMessages(updated);
      persistMessages(updated);
      logIssueInteraction(botMsgText);
      scrollToBottom();

      // Fetch user's real records
      fetchUserRecords(issue.entityType, issue.filter);
      return;
    }

    // Escalation or Chat input flow
    const botText =
      issue.botPrompt ||
      issue.botResponse ||
      "Please provide details about what happened, and I will help resolve this.";

    const botMsg: SupportChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: "bot",
      text: botText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updated = [...messages, userMsg, botMsg];
    setMessages(updated);
    persistMessages(updated);
    logIssueInteraction(botText);

    if (
      issue.actionType === "escalate" ||
      issue.actionType === "escalate_safety"
    ) {
      setShowSupportEscalationPrompt(true);
    }
    scrollToBottom();
  };

  // Fetch real authenticated records
  const fetchUserRecords = async (entityType: string, filter?: string) => {
    setLoadingRecords(true);
    try {
      const res = await ApiService.get<{
        success: boolean;
        records?: UserRecordItem[];
      }>(
        `/api/support/user-records?type=${entityType}&filter=${filter || "all"}`,
      );

      if (res?.success && Array.isArray(res.records)) {
        setUserRecords(res.records);
      } else {
        setUserRecords([]);
      }
    } catch (err) {
      console.warn("Could not fetch user records for support context:", err);
      setUserRecords([]);
    } finally {
      setLoadingRecords(false);
      scrollToBottom();
    }
  };

  // Step 3: Handle User selecting a specific real record
  const handleSelectRecord = async (record: UserRecordItem) => {
    setSelectedRecord(record);
    setUserRecords([]); // Hide selector after pick

    const userText = `Selected: ${record.title} (${record.subtitle})`;
    await handleSend(userText, {
      category: activeCategory?.id,
      issueType: activeIssue?.label,
      selectedRecord: record,
    });
  };

  // Step 4: Create Support Case
  const handleCreateSupportCase = async () => {
    setIsRaisingTicket(true);
    try {
      const relatedEntityType = activeIssue?.entityType || activeCategory?.id;
      const relatedEntityId = selectedRecord?.id;
      const relatedEntitySummary = selectedRecord
        ? `${selectedRecord.title} • ${selectedRecord.subtitle}`
        : undefined;

      const summary = `${activeCategory?.label || "General"} - ${activeIssue?.label || "Support Issue"}`;
      const conversationDetails = messages
        .slice(-6)
        .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
        .join("\n");

      const res = await ApiService.post<{
        success: boolean;
        case?: SupportCaseRecord;
      }>("/api/support/ticket", {
        category: activeCategory?.label || "General",
        issueType: activeIssue?.label || "General Support",
        sessionId: sessionIdRef.current,
        relatedEntityType,
        relatedEntityId,
        relatedEntitySummary,
        summary,
        details: conversationDetails,
        urgentSafety: activeIssue?.actionType === "escalate_safety",
      });

      if (res?.success && res.case) {
        setShowSupportEscalationPrompt(false);
        setActiveTrackingCase(res.case);

        const botConfirmation: SupportChatMessage = {
          id: (Date.now() + 2).toString(),
          sender: "bot",
          text: `✅ **Support Request Logged!**\n\n**Case Reference**: \`${res.case.caseNumber}\`\n**Status**: ${res.case.status}\n**Category**: ${res.case.category} • ${res.case.issueType}\n\nOur team has received this and will investigate ${res.case.estimatedResponseTime}.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          context: {
            caseNumber: res.case.caseNumber,
          },
        };

        const updated = [...messages, botConfirmation];
        setMessages(updated);
        persistMessages(updated);
      }
    } catch (err) {
      console.error("Error creating support case:", err);
      const errBotMsg: SupportChatMessage = {
        id: (Date.now() + 2).toString(),
        sender: "bot",
        text: "Could not automatically create your support request right now. Please email **support@junto.app** and our team will assist you.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errBotMsg]);
    } finally {
      setIsRaisingTicket(false);
      scrollToBottom();
    }
  };

  // Open Case Tracking Modal
  const handleOpenCaseTracking = async (caseNumber: string) => {
    try {
      const res = await ApiService.get<{
        success: boolean;
        case?: SupportCaseRecord;
      }>(`/api/support/cases/${caseNumber}`);

      if (res?.success && res.case) {
        setActiveTrackingCase(res.case);
        setShowCaseTrackingModal(true);
      }
    } catch (err) {
      console.warn("Could not fetch case status:", err);
      if (activeTrackingCase) {
        setShowCaseTrackingModal(true);
      }
    }
  };

  // End Chat Session
  const handleExecuteEndChat = async () => {
    setEndingChat(true);
    try {
      if (isLoggedIn) {
        await ApiService.post("/api/support/end-chat", {});
      }
      await removeSupportChatMessages(user?.id);
      setActiveCategory(null);
      setActiveIssue(null);
      setSelectedRecord(null);
      setUserRecords([]);
      setShowSupportEscalationPrompt(false);
      sessionIdRef.current = `session-${Date.now()}`;

      const freshWelcome: SupportChatMessage = {
        id: "welcome-greeting-msg-" + Date.now(),
        sender: "bot",
        text: INITIAL_GREETING_TEXT,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([freshWelcome]);
      await persistMessages([freshWelcome]);
    } catch (err) {
      console.error("Error ending support chat:", err);
    } finally {
      setEndingChat(false);
      setShowEndChatConfirm(false);
    }
  };

  const isCategoryBrowsingOnly =
    messages.length <= 1 ||
    (messages.length === 3 &&
      activeCategory &&
      !activeIssue &&
      !selectedRecord &&
      messages[1]?.id?.startsWith("cat-user-"));

  const hasActiveChat = !isCategoryBrowsingOnly && messages.length > 1;

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: t.bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderColor: t.border,
            backgroundColor: t.card,
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={scale(20)} color={t.text} />
          </TouchableOpacity>

          <View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: isDark
                  ? "rgba(168,85,247,0.25)"
                  : "rgba(168,85,247,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="robot-outline"
                size={scale(19)}
                color={t.primary}
              />
            </View>
            <View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "800", color: t.text }}
                >
                  Junto Support
                </Text>
                <View
                  style={{
                    backgroundColor: t.primary,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "800",
                      color: "#FFFFFF",
                    }}
                  >
                    AI 24/7
                  </Text>
                </View>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#22c55e",
                  }}
                />
                <Text style={{ fontSize: 11, color: t.sub, fontWeight: "600" }}>
                  {isSyncingHistory
                    ? "Syncing history..."
                    : "Active Support • Real-time"}
                </Text>
              </View>
            </View>
          </View>

          {/* Header Action: End Chat & Close */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {hasActiveChat && (
              <TouchableOpacity
                onPress={() => setShowEndChatConfirm(true)}
                disabled={endingChat}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 12,
                  backgroundColor: isDark
                    ? "rgba(239, 68, 68, 0.16)"
                    : "#FEE2E2",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(239, 68, 68, 0.35)" : "#FECACA",
                }}
              >
                {endingChat ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons
                      name="power-outline"
                      size={scale(12)}
                      color="#EF4444"
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#EF4444",
                      }}
                    >
                      End Chat
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={scale(20)} color={t.sub} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages Scroll Area */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 24,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m) => {
            const isUser = m.sender === "user";
            const actionCards = !isUser ? detectActionCards(m.text) : [];
            const caseNumber = m.context?.caseNumber;

            return (
              <View
                key={m.id}
                style={{
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                }}
              >
                <View
                  style={{
                    backgroundColor: isUser
                      ? t.primary
                      : isDark
                        ? "rgba(255,255,255,0.06)"
                        : t.card,
                    paddingHorizontal: 15,
                    paddingVertical: 12,
                    borderRadius: 16,
                    borderBottomRightRadius: isUser ? 4 : 16,
                    borderBottomLeftRadius: isUser ? 16 : 4,
                    borderWidth: isUser ? 0 : 1,
                    borderColor: isUser ? "transparent" : t.border,
                  }}
                >
                  <FormattedMarkdownText
                    text={m.text}
                    isUser={isUser}
                    onLinkPress={handleActionNavigation}
                    style={{
                      color: isUser ? "#FFFFFF" : t.text,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  />

                  {/* Render actionable deep link cards if present */}
                  {!isUser && actionCards.length > 0 && (
                    <View style={{ marginTop: 10, gap: 8 }}>
                      {actionCards.map((action, actionIdx) => (
                        <TouchableOpacity
                          key={actionIdx}
                          onPress={() => handleActionNavigation(action.url)}
                          activeOpacity={0.8}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: isDark
                              ? "rgba(168, 85, 247, 0.16)"
                              : "rgba(168, 85, 247, 0.09)",
                            borderWidth: 1.5,
                            borderColor: action.color,
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 9,
                            gap: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: `${action.color}25`,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons
                              name={action.icon}
                              size={18}
                              color={action.color}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "800",
                                color: t.text,
                              }}
                            >
                              {action.label}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: t.sub,
                                marginTop: 1,
                              }}
                            >
                              {action.sub}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={action.color}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Track Support Request button */}
                  {!isUser && caseNumber && (
                    <TouchableOpacity
                      onPress={() => handleOpenCaseTracking(caseNumber)}
                      activeOpacity={0.8}
                      style={{
                        marginTop: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        backgroundColor: isDark
                          ? "rgba(16, 185, 129, 0.16)"
                          : "#D1FAE5",
                        borderColor: "#10B981",
                        borderWidth: 1.5,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                      }}
                    >
                      <Ionicons name="search" size={16} color="#10B981" />
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 12,
                          fontWeight: "800",
                          color: "#10B981",
                        }}
                      >
                        Track My Request ({caseNumber})
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#10B981"
                      />
                    </TouchableOpacity>
                  )}

                  {/* Quick Action Chips for Completed Ride Contradiction */}
                  {!isUser &&
                    (m.text.includes("marked as **Completed**") ||
                      m.text.includes("marked completed")) && (
                      <View style={{ marginTop: 10, gap: 6 }}>
                        <TouchableOpacity
                          onPress={() =>
                            handleSend(
                              "The driver marked the ride completed without picking me up.",
                            )
                          }
                          activeOpacity={0.75}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                            borderRadius: 10,
                            backgroundColor: isDark
                              ? "rgba(239, 68, 68, 0.15)"
                              : "#FEE2E2",
                            borderWidth: 1,
                            borderColor: "#EF4444",
                          }}
                        >
                          <Ionicons
                            name="alert-circle"
                            size={14}
                            color="#EF4444"
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: "#EF4444",
                              flex: 1,
                            }}
                          >
                            Driver marked completed without picking me up
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            handleSend("I selected the wrong ride by mistake.")
                          }
                          activeOpacity={0.75}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                            borderRadius: 10,
                            backgroundColor: isDark
                              ? "rgba(168, 85, 247, 0.15)"
                              : "#F3E8FF",
                            borderWidth: 1,
                            borderColor: t.primary,
                          }}
                        >
                          <Ionicons
                            name="refresh"
                            size={14}
                            color={t.primary}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: t.primary,
                              flex: 1,
                            }}
                          >
                            I selected the wrong ride by mistake
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                </View>

                <Text
                  style={{
                    fontSize: 10,
                    color: t.sub,
                    marginTop: 4,
                    alignSelf: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  {m.timestamp}
                </Text>
              </View>
            );
          })}

          {/* Loader when Copilot is generating reply */}
          {loading && (
            <View
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : t.card,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <ActivityIndicator size="small" color={t.primary} />
              <Text style={{ fontSize: 11, color: t.sub, fontWeight: "600" }}>
                Junto Support is preparing an answer...
              </Text>
            </View>
          )}

          {/* ========================================================= */}
          {/* INTERACTIVE MENU: 1. INITIAL CATEGORY SELECTION           */}
          {/* ========================================================= */}
          {!activeCategory && !hasActiveChat && (
            <View
              style={{
                marginTop: 8,
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : t.card,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 16,
                padding: 14,
                gap: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: t.sub,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                SELECT A CATEGORY
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => handleSelectCategory(cat)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "#F8FAFC",
                      borderWidth: 1,
                      borderColor: t.border,
                      borderRadius: 14,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      minWidth: "47%",
                      flexGrow: 1,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: t.text,
                      }}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* INTERACTIVE MENU: 2. ISSUE TYPES BASED ON CATEGORY        */}
          {/* ========================================================= */}
          {activeCategory &&
            !activeIssue &&
            !selectedRecord &&
            !hasActiveChat &&
            userRecords.length === 0 &&
            !loadingRecords && (
              <View
                style={{
                  marginTop: 8,
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : t.card,
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: 16,
                  padding: 14,
                  gap: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{activeCategory.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: t.text,
                      }}
                    >
                      {activeCategory.label} Issues
                    </Text>
                  </View>

                  {/* Back to Categories Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setActiveCategory(null);
                      setActiveIssue(null);
                      setSelectedRecord(null);
                      setShowSupportEscalationPrompt(false);
                      setMessages((prev) =>
                        prev.filter(
                          (m) =>
                            m.id === "welcome-greeting-msg" ||
                            !m.id.startsWith("cat-"),
                        ),
                      );
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 10,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "#E2E8F0",
                    }}
                  >
                    <Ionicons name="arrow-back" size={12} color={t.sub} />
                    <Text
                      style={{ fontSize: 11, fontWeight: "700", color: t.sub }}
                    >
                      All Categories
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ gap: 6 }}>
                  {activeCategory.issues.map((iss) => (
                    <TouchableOpacity
                      key={iss.id}
                      onPress={() => handleSelectIssue(iss)}
                      activeOpacity={0.75}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "#F8FAFC",
                        borderWidth: 1,
                        borderColor: t.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: t.text,
                          flex: 1,
                        }}
                      >
                        {iss.label}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={t.sub}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

          {/* ========================================================= */}
          {/* INTERACTIVE MENU: 3. REAL USER RECORDS SELECTOR           */}
          {/* ========================================================= */}
          {loadingRecords && (
            <View
              style={{
                padding: 16,
                alignItems: "center",
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : t.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: t.border,
                gap: 8,
              }}
            >
              <ActivityIndicator size="small" color={t.primary} />
              <Text style={{ fontSize: 12, color: t.sub, fontWeight: "600" }}>
                Fetching your relevant records...
              </Text>
            </View>
          )}

          {!loadingRecords && userRecords.length > 0 && (
            <View
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : t.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: t.border,
                padding: 14,
                gap: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: t.text,
                  }}
                >
                  Select your {activeCategory?.label || "Record"}
                </Text>
                <TouchableOpacity
                  onPress={() => setUserRecords([])}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: t.primary,
                      fontWeight: "700",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8 }}>
                {userRecords.map((record) => (
                  <TouchableOpacity
                    key={record.id}
                    onPress={() => handleSelectRecord(record)}
                    activeOpacity={0.75}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "#FFFFFF",
                      borderWidth: 1.5,
                      borderColor:
                        selectedRecord?.id === record.id ? t.primary : t.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "800",
                          color: t.text,
                          flex: 1,
                        }}
                      >
                        {record.title}
                      </Text>
                      <View
                        style={{
                          backgroundColor:
                            record.status === "confirmed" ||
                            record.status === "active"
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(168, 85, 247, 0.15)",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color:
                              record.status === "confirmed" ||
                              record.status === "active"
                                ? "#10B981"
                                : t.primary,
                            textTransform: "capitalize",
                          }}
                        >
                          {record.status}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={{
                        fontSize: 12,
                        color: t.sub,
                        marginTop: 4,
                      }}
                    >
                      {record.subtitle}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 6,
                      }}
                    >
                      {record.role && (
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: t.sub,
                          }}
                        >
                          Role: {record.role}
                        </Text>
                      )}
                      <Text style={{ fontSize: 10, color: t.sub }}>
                        Date: {record.date}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* SUPPORT ESCALATION PROMPT (Create Support Request)        */}
          {/* ========================================================= */}
          {showSupportEscalationPrompt && (
            <View
              style={{
                marginTop: 6,
                padding: 14,
                borderRadius: 16,
                backgroundColor: isDark
                  ? "rgba(168, 85, 247, 0.12)"
                  : "rgba(168, 85, 247, 0.08)",
                borderWidth: 1.5,
                borderColor: t.primary,
                gap: 10,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons
                  name="help-buoy-outline"
                  size={20}
                  color={t.primary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "800",
                    color: t.text,
                    flex: 1,
                  }}
                >
                  Raise a Support Request?
                </Text>
              </View>

              <Text style={{ fontSize: 12, color: t.sub, lineHeight: 17 }}>
                Our human customer care team will review your session,
                investigate any records, and follow up directly with you.
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={handleCreateSupportCase}
                  disabled={isRaisingTicket}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: t.primary,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                  }}
                >
                  {isRaisingTicket ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name="clipboard-outline"
                        size={15}
                        color="#FFFFFF"
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: "#FFFFFF",
                        }}
                      >
                        Create Support Request
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowSupportEscalationPrompt(false)}
                  disabled={isRaisingTicket}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "#E2E8F0",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 12, fontWeight: "700", color: t.text }}
                  >
                    Continue Chat
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Platform.OS === "ios" ? 10 : 12,
            borderTopWidth: 1,
            borderColor: t.border,
            backgroundColor: t.card,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={
              hasActiveChat
                ? "Type your message..."
                : activeCategory
                  ? `Ask about ${activeCategory.label}...`
                  : "Type message or select category above..."
            }
            placeholderTextColor={t.placeholder}
            style={{
              flex: 1,
              backgroundColor: t.bg,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: t.text,
              fontSize: 14,
              maxHeight: 100,
            }}
            multiline
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: input.trim() && !loading ? t.primary : t.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="send" size={scale(16)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* End Chat Confirmation Modal */}
        <Modal
          visible={showEndChatConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEndChatConfirm(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 360,
                backgroundColor: t.bg,
                borderRadius: 20,
                padding: 22,
                borderWidth: 1,
                borderColor: t.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: isDark
                    ? "rgba(239, 68, 68, 0.15)"
                    : "#FEE2E2",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={24}
                  color="#EF4444"
                />
              </View>

              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "800",
                  color: t.text,
                  marginBottom: 8,
                }}
              >
                End Support Chat?
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: t.sub,
                  lineHeight: 19,
                  marginBottom: 20,
                }}
              >
                This will conclude your conversation and reset the session.
                Until ended, your conversation state is preserved when
                navigating across app screens.
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  justifyContent: "flex-end",
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowEndChatConfirm(false)}
                  disabled={endingChat}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: t.bg,
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: t.text }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleExecuteEndChat}
                  disabled={endingChat}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: "#EF4444",
                  }}
                >
                  {endingChat ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="power" size={14} color="#FFFFFF" />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: "#FFFFFF",
                        }}
                      >
                        End Chat
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Case Tracking Modal */}
        <Modal
          visible={showCaseTrackingModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCaseTrackingModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: t.bg,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: t.border,
                maxHeight: "80%",
                gap: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons name="shield-checkmark" size={22} color="#10B981" />
                  <Text
                    style={{ fontSize: 17, fontWeight: "800", color: t.text }}
                  >
                    Support Case Details
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowCaseTrackingModal(false)}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close" size={22} color={t.sub} />
                </TouchableOpacity>
              </View>

              {activeTrackingCase && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "#F8FAFC",
                      borderWidth: 1,
                      borderColor: t.border,
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: t.sub,
                        }}
                      >
                        CASE REFERENCE
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "900",
                          color: t.primary,
                        }}
                      >
                        {activeTrackingCase.caseNumber}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: t.sub,
                        }}
                      >
                        STATUS
                      </Text>
                      <View
                        style={{
                          backgroundColor: "#D1FAE5",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: "#059669",
                          }}
                        >
                          {activeTrackingCase.status}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: t.sub,
                        }}
                      >
                        ESTIMATED RESOLUTION
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: t.text,
                        }}
                      >
                        {activeTrackingCase.estimatedResponseTime}
                      </Text>
                    </View>

                    <View
                      style={{
                        borderTopWidth: 1,
                        borderColor: t.border,
                        paddingTop: 10,
                        gap: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: t.sub,
                        }}
                      >
                        CATEGORY & ISSUE
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "800",
                          color: t.text,
                        }}
                      >
                        {activeTrackingCase.category} •{" "}
                        {activeTrackingCase.issueType}
                      </Text>
                    </View>

                    {activeTrackingCase.relatedEntitySummary && (
                      <View
                        style={{
                          borderTopWidth: 1,
                          borderColor: t.border,
                          paddingTop: 10,
                          gap: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: t.sub,
                          }}
                        >
                          ASSOCIATED RECORD
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: t.text,
                          }}
                        >
                          {activeTrackingCase.relatedEntitySummary}
                        </Text>
                      </View>
                    )}

                    <View
                      style={{
                        borderTopWidth: 1,
                        borderColor: t.border,
                        paddingTop: 10,
                        gap: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: t.sub,
                        }}
                      >
                        SUBMITTED AT
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: t.sub,
                        }}
                      >
                        {new Date(
                          activeTrackingCase.createdAt,
                        ).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowCaseTrackingModal(false)}
                    style={{
                      marginTop: 16,
                      backgroundColor: t.primary,
                      paddingVertical: 12,
                      borderRadius: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: "#FFFFFF",
                      }}
                    >
                      Close Tracker
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
