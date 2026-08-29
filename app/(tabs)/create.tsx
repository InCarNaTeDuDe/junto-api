/**
 * CreateScreen
 * ------------
 * Styling model:
 *  - Colors come from your `useTheme()` hook (LightTheme / DarkTheme in theme.ts).
 *  - Static structural styles live in `createStyles(t)` — `t` is the theme object,
 *    so every color reference is a token (t.bg, t.card, t.text, t.primary, ...),
 *    never a hard-coded hex. Toggling theme mode re-renders with new tokens.
 *  - Per-card pastel accents (dayMate/ticket/event/question) are derived from
 *    `t.primary` + status colors, so they auto-adapt to light/dark.
 *  - Inline `style={{ color: t.xxx }}` is only used where a value must be picked
 *    dynamically (selected chip, disabled state). Everything else is in StyleSheet.
 */

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import { ActivityHeader } from "@/components/ActivityHeader";
import type { Theme } from "@/theme";
import { ApiService } from "@/services/api";
import { useLocation } from "@/context/LocationContext";
import DayMatesForm from "../(screens)/add-daymate";
import SellTicketForm from "../(screens)/add-ticket";
import AskNearbyScreen from "../(screens)/ask-nearby";

/* ---------------- Types & data ---------------- */

type OptionId = "day_mates" | "sell_ticket" | "host_event" | "ask_nearby";
type PaletteKey = "dayMate" | "ticket" | "event" | "question";

type OptionDef = {
  id: OptionId;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  key: PaletteKey;
};

const OPTIONS: OptionDef[] = [
  {
    id: "day_mates",
    title: "Find Day Mates",
    description: "Meet people for cricket, lunch, coffee, or movies today.",
    icon: "people",
    key: "dayMate",
  },
  {
    id: "sell_ticket",
    title: "Sell Ticket",
    description: "Sell last-minute extra tickets to people nearby securely.",
    icon: "ticket",
    key: "ticket",
  },
  {
    id: "host_event",
    title: "Host Event",
    description: "Organize pub crawls, turf games, or community mixers.",
    icon: "sparkles",
    key: "event",
  },
  {
    id: "ask_nearby",
    title: "Ask Something Nearby",
    description: "Ask about crowds, entry fees, or bar recommendations.",
    icon: "megaphone",
    key: "question",
  },
];

const ACTIVITY_CHOICES = [
  { label: "Cricket", emoji: "🏏" },
  { label: "Coffee", emoji: "☕" },
  { label: "Lunch", emoji: "🍕" },
  { label: "Movie", emoji: "🎬" },
  { label: "Drinks", emoji: "🍺" },
];
const EVENT_TYPES = ["Turf Game", "Pub Crawl", "Social Mixer", "Board Games"];
const QUESTION_TOPICS = ["Crowds", "Entry Fees", "Bars & Food", "Parking Info"];
const URGENCY_LEVELS = ["Normal Info", "Urgent Broadcast"];

/* ---------------- Palette derived from theme ---------------- */
/**
 * Each card gets a soft background + circle + icon tint.
 * We hue-shift around theme tokens instead of hard-coding, so DarkTheme
 * (which uses translucent whites) still looks correct.
 */
function getPalettes(t: Theme, isDark: boolean) {
  const soft = (hex: string, a = isDark ? 0.18 : 0.12) => hexA(hex, a);
  return {
    dayMate: {
      bg: soft(t.primary),
      circle: soft(t.primary, 0.25),
      icon: t.primary,
      arrow: t.primary,
    },
    ticket: {
      bg: soft(t.warning),
      circle: soft(t.warning, 0.25),
      icon: t.warning,
      arrow: t.warning,
    },
    event: {
      bg: soft(t.error, 0.14),
      circle: soft(t.error, 0.28),
      icon: t.error,
      arrow: t.error,
    },
    question: {
      bg: soft(t.info),
      circle: soft(t.info, 0.25),
      icon: t.info,
      arrow: t.info,
    },
  } as const;
}

function hexA(hex: string, a: number) {
  // Accepts "#RRGGBB" or existing rgba(); passthrough otherwise.
  if (hex.startsWith("rgba")) return hex;
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ---------------- Screen ---------------- */

export default function CreateScreen() {
  const { theme: t, isDark } = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const palettes = useMemo(() => getPalettes(t, isDark), [t, isDark]);

  const [selected, setSelected] = useState<OptionId | null>(null);

  // Host Event
  const [hostEventName, setHostEventName] = useState("");
  const [hostLocation, setHostLocation] = useState("");
  const [hostType, setHostType] = useState("Turf Game");
  const [maxPeople, setMaxPeople] = useState(15);

  // Ask Nearby
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState("Crowds");
  const [urgency, setUrgency] = useState("Normal Info");

  const { selectedLocation } = useLocation();

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };
  const back = () => setSelected(null);

  const submit = async () => {
    if (selected === "host_event") {
      if (!hostEventName || !hostLocation) return;
      console.log("Event:", {
        name: hostEventName,
        location: hostLocation,
        type: hostType,
        maxPeople,
      });
    } else if (selected === "ask_nearby") {
      if (!question) return;
      console.log("Question:", { question, topic, urgency });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.handle} />

      {/* Header */}
      {!selected ? (
        <ActivityHeader
          title="What would you like to do today? 🎉"
          description="Choose an option to get started"
          onClose={close}
        />
      ) : // (
      //   <ActivityHeader
      //     title={OPTIONS.find((o) => o.id === selected)?.title || ""}
      //     description={
      //       OPTIONS.find((o) => o.id === selected)?.description || ""
      //     }
      //     onBack={back}
      //     onClose={close}
      //   />
      // )
      null}

      {/* Body */}
      {!selected ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View style={styles.grid}>
            {OPTIONS.map((opt) => {
              const p = palettes[opt.key];
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setSelected(opt.id)}
                  // style={({ pressed }) => [
                  //   styles.gridCard,
                  //   { backgroundColor: p.bg },
                  //   pressed && { opacity: 0.85 },
                  // ]}
                  style={[styles.gridCard, { backgroundColor: p.bg }]}
                  android_ripple={{
                    color: "rgba(0,0,0,0.08)",
                    borderless: false,
                  }}
                >
                  <View style={[styles.dec1, { backgroundColor: p.circle }]} />
                  <View style={[styles.dec2, { backgroundColor: p.circle }]} />
                  <View
                    style={[
                      styles.gridIconCircle,
                      { backgroundColor: p.circle },
                    ]}
                  >
                    <Ionicons name={opt.icon} size={22} color={p.icon} />
                  </View>
                  <Text style={styles.gridTitle}>{opt.title}</Text>
                  <Text style={styles.gridDesc} numberOfLines={2}>
                    {opt.description}
                  </Text>
                  <View
                    style={[styles.gridArrow, { backgroundColor: p.arrow }]}
                  >
                    <Ionicons name="arrow-forward" size={13} color={t.white} />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footerBanner}>
            <View style={styles.footerIconWrap}>
              <Ionicons name="heart" size={16} color={t.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.footerTitle}>
                Good people. Good plans. Great days.
              </Text>
              <Text style={styles.footerSub}>
                JUNTO makes every day better together. ✨
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {selected === "day_mates" && (
            <DayMatesForm from="create" onBack={back} onClose={close} />
          )}
          {selected === "sell_ticket" && (
            <SellTicketForm from="create" onBack={back} onClose={close} />
          )}
          {selected === "ask_nearby" && (
            <AskNearbyScreen from="create" onBack={back} onClose={close} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ---------------- Helpers ---------------- */

function FormLabel({ t, text }: { t: Theme; text: string }) {
  return (
    <Text
      style={{
        fontSize: 11.5,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: 14,
        marginBottom: 4,
        color: t.sub,
      }}
    >
      {text}
    </Text>
  );
}

function FormInput({ t, ...rest }: any) {
  return (
    <TextInput
      {...rest}
      placeholderTextColor={t.placeholder}
      style={{
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: "600",
        marginTop: 4,
        borderColor: t.inputBorder,
        backgroundColor: t.inputBg,
        color: t.text,
      }}
    />
  );
}

function Chip({
  t,
  label,
  selected,
  onPress,
}: {
  t: Theme;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? t.primary : t.border,
        backgroundColor: selected ? t.primarySoft : t.bg2,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: selected ? "700" : "600",
          color: selected ? t.primary : t.sub,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Stepper({
  t,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  t: Theme;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  const btn = {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: t.cardSecondary,
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={btn}
        onPress={() => onChange(Math.max(min, value - step))}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", color: t.text }}>
          −
        </Text>
      </TouchableOpacity>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "800",
          minWidth: 20,
          textAlign: "center",
          color: t.text,
        }}
      >
        {value}
      </Text>
      <TouchableOpacity
        activeOpacity={0.7}
        style={btn}
        onPress={() => onChange(Math.min(max, value + step))}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", color: t.text }}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------- Styles ---------------- */
/**
 * Single source of truth: every color reads from `t` (theme token).
 * No `useStyles` wrapper needed — `useMemo(() => createStyles(t), [t])`
 * rebuilds the StyleSheet only when the theme actually changes.
 */
const createStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 6, backgroundColor: t.bg },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 999,
      alignSelf: "center",
      marginTop: 10,
      marginBottom: 4,
      backgroundColor: t.divider,
    },

    // header: {
    //   flexDirection: "row",
    //   alignItems: "flex-start",
    //   justifyContent: "space-between",
    //   borderBottomWidth: 1,
    //   borderBottomColor: t.border,
    //   paddingVertical: 14,
    // },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center", // instead of flex-start
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    headerTitle1: { fontWeight: "800", fontSize: 16, flex: 1, color: t.text },
    headerTitle: { fontWeight: "800", fontSize: 16, flex: 1, color: t.text },
    headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2, color: t.sub },
    roundBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },

    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },

    gridCard: {
      width: "48%",
      height: 180,
      marginBottom: 12,
      borderRadius: 20,
      padding: 16,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    dec1: {
      position: "absolute",
      width: 56,
      height: 56,
      borderRadius: 999,
      top: -10,
      left: -10,
      opacity: 0.6,
    },
    dec2: {
      position: "absolute",
      width: 28,
      height: 28,
      borderRadius: 999,
      bottom: 4,
      right: -8,
      opacity: 0.6,
    },

    gridIconCircle: {
      width: 54,
      height: 54,
      borderRadius: 30,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
      zIndex: 2,
    },
    gridTitle: {
      fontWeight: "800",
      fontSize: 13,
      textAlign: "center",
      marginBottom: 4,
      color: t.text,
    },
    gridDesc: {
      fontSize: 10.5,
      textAlign: "center",
      lineHeight: 14,
      fontWeight: "500",
      marginBottom: 8,
      color: t.sub,
    },
    gridArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },

    footerBanner: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      padding: 14,
      gap: 10,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },
    footerIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.primarySoft,
    },
    footerTitle: { fontWeight: "800", fontSize: 13, color: t.text },
    footerSub: {
      fontSize: 11.5,
      fontWeight: "500",
      marginTop: 2,
      color: t.sub,
    },

    formWrapper: { paddingVertical: 8 },
    sectionSubtitle: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 10,
      color: t.sub,
    },

    input: {
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 4,
      borderColor: t.inputBorder,
      backgroundColor: t.inputBg,
      color: t.text,
    },
    inputMultiline: { height: 84, textAlignVertical: "top" },

    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },

    counterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      marginTop: 8,
      borderColor: t.border,
      backgroundColor: t.card,
    },
    counterLabel: {
      fontSize: 12.5,
      fontWeight: "600",
      flex: 1,
      marginRight: 10,
      color: t.sub,
    },

    submitBtn: {
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
    },
    submitBtnText: {
      color: t.white,
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
  });
