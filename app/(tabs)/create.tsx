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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import type { Theme } from "@/theme";
import { ApiService } from "@/services/api";
import { useLocation } from "@/context/LocationContext";
import DayMatesForm from "../(screens)/add-daymate";
import SellTicketForm from "../(screens)/add-ticket";

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

  const close = () => router.back();
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
    <View style={styles.container}>
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {selected && (
            <Pressable onPress={back} style={styles.roundBtn} hitSlop={10}>
              <Ionicons name="arrow-back" size={19} color={t.text} />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            {!selected ? (
              <>
                <Text
                  // style={styles.headerTitle1} //-- not working so kept inline
                  style={{
                    color: t.text,
                    fontSize: 16,
                    fontWeight: "900",
                    // backgroundColor: "yellow",
                    lineHeight: 24,
                  }}
                >
                  What would you like to do today? 🎉
                </Text>
                <Text style={styles.headerSub}>
                  Choose an option to get started
                </Text>
              </>
            ) : (
              <Text style={[styles.headerTitle, { marginLeft: 6 }]}>
                {OPTIONS.find((o) => o.id === selected)?.title}
              </Text>
            )}
          </View>
        </View>
        <Pressable onPress={close} style={styles.roundBtn} hitSlop={10}>
          <Ionicons name="close" size={19} color={t.sub} />
        </Pressable>
      </View>

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
          {selected === "day_mates" && <DayMatesForm />}
          {selected === "sell_ticket" && <SellTicketForm />}

          {selected === "host_event" && (
            <View style={styles.formWrapper}>
              <Text style={styles.sectionSubtitle}>
                Host social mixers, games or community events
              </Text>

              <FormLabel t={t} text="Event Title" />
              <FormInput
                t={t}
                placeholder="e.g., Koramangala Friday Pub Crawl"
                value={hostEventName}
                onChangeText={setHostEventName}
              />

              <FormLabel t={t} text="Venue / Spot Location" />
              <FormInput
                t={t}
                placeholder="e.g., Astro Arena Turf, Toit"
                value={hostLocation}
                onChangeText={setHostLocation}
              />

              <FormLabel t={t} text="Event Category" />
              <View style={styles.chipRow}>
                {EVENT_TYPES.map((x) => (
                  <Chip
                    key={x}
                    t={t}
                    label={x}
                    selected={hostType === x}
                    onPress={() => setHostType(x)}
                  />
                ))}
              </View>

              <FormLabel t={t} text="Max Attendees" />
              <View style={styles.counterRow}>
                <Text style={styles.counterLabel}>
                  Maximum attendees invited?
                </Text>
                <Stepper
                  t={t}
                  value={maxPeople}
                  onChange={setMaxPeople}
                  min={5}
                  max={100}
                  step={5}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                disabled={!hostEventName || !hostLocation}
                onPress={submit}
                style={[
                  styles.submitBtn,
                  { backgroundColor: palettes.event.arrow },
                  (!hostEventName || !hostLocation) && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.submitBtnText}>Launch Community Event</Text>
              </TouchableOpacity>
            </View>
          )}

          {selected === "ask_nearby" && (
            <View style={styles.formWrapper}>
              <Text style={styles.sectionSubtitle}>
                Broadcast a localized question to active users
              </Text>

              <FormLabel t={t} text="Your Question" />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                multiline
                numberOfLines={3}
                placeholder="e.g., Is the entry fee at Toit active tonight?"
                placeholderTextColor={t.placeholder}
                value={question}
                onChangeText={setQuestion}
              />

              <FormLabel t={t} text="Select Topic" />
              <View style={styles.chipRow}>
                {QUESTION_TOPICS.map((x) => (
                  <Chip
                    key={x}
                    t={t}
                    label={x}
                    selected={topic === x}
                    onPress={() => setTopic(x)}
                  />
                ))}
              </View>

              <FormLabel t={t} text="Urgency Level" />
              <View style={styles.chipRow}>
                {URGENCY_LEVELS.map((x) => (
                  <Chip
                    key={x}
                    t={t}
                    label={x}
                    selected={urgency === x}
                    onPress={() => setUrgency(x)}
                  />
                ))}
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                disabled={!question}
                onPress={submit}
                style={[
                  styles.submitBtn,
                  { backgroundColor: palettes.question.arrow },
                  !question && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.submitBtnText}>Broadcast Question</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
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

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
// } from "react-native";
// import {
//   Users,
//   Ticket,
//   Search,
//   Package,
//   ChevronRight,
//   ArrowLeft,
//   X,
//   MapPin,
//   Flag,
//   Sparkles,
//   Plus,
// } from "lucide-react";
// import { DayMatesForm } from "../(screens)/add-daymate";
// import { SellTicketForm } from "../(screens)/add-ticket";
// import { AskNearbyForm } from "../(screens)/ask-nearby";

// export type OptionId =
//   | "day_mates"
//   | "sell_ticket"
//   | "lost_something"
//   | "found_something";

// interface OptionItem {
//   id: OptionId;
//   title: string;
//   subtitle: string;
//   iconEmoji: string;
//   IconComponent?: React.ComponentType<{ size?: number; color?: string }>;
//   iconBg: string;
//   cardBg: string;
//   borderColor: string;
//   iconColor: string;
// }

// const CREATE_OPTIONS: OptionItem[] = [
//   {
//     id: "day_mates",
//     title: "Find Day Mates",
//     subtitle: "Meet people for activities and events nearby",
//     iconEmoji: "👥",
//     IconComponent: Users,
//     iconBg: "#6b21a8",
//     cardBg: "#1a1130",
//     borderColor: "#3c236e",
//     iconColor: "#e9d5ff",
//   },
//   {
//     id: "sell_ticket",
//     title: "Sell Ticket",
//     subtitle: "Sell last-minute extra tickets to nearby events",
//     iconEmoji: "🎟️",
//     IconComponent: Ticket,
//     iconBg: "#9a3412",
//     cardBg: "#271418",
//     borderColor: "#5c221e",
//     iconColor: "#ffedd5",
//   },
//   {
//     id: "lost_something",
//     title: "Lost Something",
//     subtitle: "Report something lost and get help from others",
//     iconEmoji: "🎒",
//     IconComponent: Search,
//     iconBg: "#0f766e",
//     cardBg: "#0d2128",
//     borderColor: "#174952",
//     iconColor: "#ccfbf1",
//   },
//   {
//     id: "found_something",
//     title: "Found Something",
//     subtitle: "Found something? Help others get it back",
//     iconEmoji: "📦",
//     IconComponent: Package,
//     iconBg: "#1d4ed8",
//     cardBg: "#0f1c3a",
//     borderColor: "#1d3b7a",
//     iconColor: "#dbeafe",
//   },
// ];

// export const CreateScreen: React.FC = () => {
//   const [selected, setSelected] = useState<OptionId | null>(null);
//   const [selectedLocation] = useState<string>("Bandra, Mumbai");

//   const handleBack = () => setSelected(null);
//   const handleClose = () => setSelected(null);

//   const selectedOption = CREATE_OPTIONS.find((o) => o.id === selected);

//   return (
//     <View style={styles.screenContainer}>
//       {/* Top Header */}
//       <View style={styles.topHeader}>
//         {selected ? (
//           <TouchableOpacity
//             style={styles.closeBtn}
//             activeOpacity={0.7}
//             onPress={handleBack}
//           >
//             <ArrowLeft size={18} color="#e2e8f0" />
//           </TouchableOpacity>
//         ) : (
//           <View style={styles.placeholderBtn} />
//         )}

//         <Text style={styles.topTitle}>
//           {selected ? selectedOption?.title : "Create"}
//         </Text>

//         <TouchableOpacity
//           style={styles.closeBtn}
//           activeOpacity={0.7}
//           onPress={handleClose}
//         >
//           <X size={18} color="#e2e8f0" />
//         </TouchableOpacity>
//       </View>

//       {!selected ? (
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.scrollContent}
//         >
//           {/* Main Hero Header */}
//           <View style={styles.heroSection}>
//             <Text style={styles.heroTitle}>
//               What would you{"\n"}like to do today?
//             </Text>
//             <Text style={styles.heroSubtitle}>
//               Choose an option to get started
//             </Text>
//           </View>

//           {/* Cards List */}
//           <View style={styles.cardsList}>
//             {CREATE_OPTIONS.map((item) => {
//               const IconComp = item.IconComponent;
//               return (
//                 <TouchableOpacity
//                   key={item.id}
//                   style={[
//                     styles.optionCard,
//                     {
//                       backgroundColor: item.cardBg,
//                       borderColor: item.borderColor,
//                     },
//                   ]}
//                   activeOpacity={0.85}
//                   onPress={() => setSelected(item.id)}
//                 >
//                   <View
//                     style={[styles.iconBadge, { backgroundColor: item.iconBg }]}
//                   >
//                     {IconComp ? (
//                       <IconComp size={24} color={item.iconColor} />
//                     ) : (
//                       <Text style={styles.emojiIcon}>{item.iconEmoji}</Text>
//                     )}
//                   </View>

//                   <View style={styles.cardTextContainer}>
//                     <Text style={styles.cardTitle}>{item.title}</Text>
//                     <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
//                   </View>

//                   <ChevronRight size={20} color="#94a3b8" />
//                 </TouchableOpacity>
//               );
//             })}
//           </View>

//           {/* Bottom City Silhouette Graphic */}
//           <View style={styles.cityscapeGraphic}>
//             <View style={styles.starsRow}>
//               <Sparkles size={16} color="#3b2d68" />
//               <Sparkles size={12} color="#291f4a" />
//               <Sparkles size={16} color="#3b2d68" />
//             </View>

//             <View style={styles.routePathRow}>
//               <View style={styles.pinBubble}>
//                 <MapPin size={12} color="#c084fc" />
//               </View>
//               <View style={styles.dashedLine} />
//               <View style={styles.flagBubble}>
//                 <Flag size={12} color="#a855f7" />
//               </View>
//             </View>

//             <View style={styles.skylineSilhouette}>
//               <View style={[styles.building, { height: 18, width: 22 }]} />
//               <View style={[styles.building, { height: 28, width: 16 }]} />
//               <View style={[styles.building, { height: 36, width: 26 }]} />
//               <View style={[styles.building, { height: 22, width: 20 }]} />
//               <View style={[styles.building, { height: 42, width: 30 }]} />
//               <View style={[styles.building, { height: 24, width: 18 }]} />
//               <View style={[styles.building, { height: 32, width: 22 }]} />
//             </View>
//           </View>
//         </ScrollView>
//       ) : (
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.formContent}
//         >
//           {selected === "day_mates" && (
//             <DayMatesForm
//               selectedLocation={selectedLocation}
//               onBack={handleBack}
//               onClose={handleClose}
//             />
//           )}

//           {selected === "sell_ticket" && (
//             <SellTicketForm selectedLocation={selectedLocation} />
//           )}

//           {selected === "lost_something" && (
//             <AskNearbyForm selectedLocation={selectedLocation} />
//           )}

//           {selected === "found_something" && (
//             <AskNearbyForm selectedLocation={selectedLocation} />
//           )}
//         </ScrollView>
//       )}

//       {/* Floating Plus Action Button */}
//       <TouchableOpacity
//         style={styles.floatingPlusBtn}
//         activeOpacity={0.85}
//         onPress={() => setSelected(null)}
//       >
//         <Plus size={26} color="#ffffff" />
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   screenContainer: {
//     flex: 1,
//     backgroundColor: "#090714",
//     paddingHorizontal: 16,
//     paddingTop: 8,
//     position: "relative",
//     minHeight: "100vh" as any,
//   },
//   topHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingVertical: 12,
//     marginBottom: 8,
//   },
//   topTitle: {
//     color: "#ffffff",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   closeBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "#1b152d",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   placeholderBtn: {
//     width: 36,
//     height: 36,
//   },
//   scrollContent: {
//     paddingBottom: 80,
//     maxWidth: 500,
//     alignSelf: "center",
//     width: "100%",
//   },
//   formContent: {
//     paddingBottom: 80,
//     maxWidth: 500,
//     alignSelf: "center",
//     width: "100%",
//   },
//   heroSection: {
//     alignItems: "center",
//     marginTop: 12,
//     marginBottom: 28,
//   },
//   heroTitle: {
//     fontSize: 26,
//     fontWeight: "800",
//     color: "#ffffff",
//     textAlign: "center",
//     lineHeight: 32,
//     marginBottom: 8,
//   },
//   heroSubtitle: {
//     fontSize: 14,
//     color: "#94a3b8",
//     textAlign: "center",
//   },
//   cardsList: {
//     gap: 14,
//     marginBottom: 32,
//   },
//   optionCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 16,
//     borderRadius: 22,
//     borderWidth: 1,
//   },
//   iconBadge: {
//     width: 52,
//     height: 52,
//     borderRadius: 18,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 14,
//   },
//   emojiIcon: {
//     fontSize: 24,
//   },
//   cardTextContainer: {
//     flex: 1,
//     paddingRight: 8,
//   },
//   cardTitle: {
//     fontSize: 17,
//     fontWeight: "700",
//     color: "#ffffff",
//     marginBottom: 4,
//   },
//   cardSubtitle: {
//     fontSize: 12,
//     color: "#94a3b8",
//     lineHeight: 16,
//   },
//   cityscapeGraphic: {
//     alignItems: "center",
//     marginTop: 10,
//     paddingTop: 10,
//     opacity: 0.8,
//   },
//   starsRow: {
//     flexDirection: "row",
//     gap: 24,
//     marginBottom: 12,
//   },
//   routePathRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     width: "80%",
//     justifyContent: "center",
//     marginBottom: 16,
//   },
//   pinBubble: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: "#291f4a",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   flagBubble: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: "#291f4a",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   dashedLine: {
//     flex: 1,
//     height: 1,
//     borderWidth: 1,
//     borderColor: "#3b2d68",
//     borderStyle: "dashed",
//     marginHorizontal: 8,
//   },
//   skylineSilhouette: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//     justifyContent: "center",
//     gap: 6,
//   },
//   building: {
//     backgroundColor: "#161129",
//     borderTopLeftRadius: 3,
//     borderTopRightRadius: 3,
//   },
//   floatingPlusBtn: {
//     position: "fixed" as any,
//     bottom: 24,
//     right: 24,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: "#7c3aed",
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#a855f7",
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.5,
//     shadowRadius: 10,
//     elevation: 10,
//     zIndex: 9999,
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.2)",
//   },
// });
