import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useVoiceSpeech } from "@/hooks/useVoiceSpeech";
import {
  parseUserNeed,
  SUGGESTED_NEED_PROMPTS,
  IntentMatch,
} from "@/utils/intentRouter";
import { INeedThisModal } from "./NeedThisModal";

const ROTATING_EXAMPLES = [
  "I need a bike mechanic near me",
  "I need someone to go to Vijayawada with",
  "I need a movie ticket for tonight",
  "I lost my wallet in Hitec City",
  "I'm visiting Hyderabad tomorrow",
  "I want to buy a used cycle",
  "Need a badminton partner for 7 PM",
  "Looking for home tiffin food",
];

export const UniversalNeedBar: React.FC = () => {
  const router = useRouter();
  const { theme: C, isDark } = useTheme();

  const [query, setQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [matchedIntent, setMatchedIntent] = useState<IntentMatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [directFeedback, setDirectFeedback] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    permissionStatus,
    requestPermission,
    startListening,
    stopListening,
  } = useVoiceSpeech();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Cycle placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % ROTATING_EXAMPLES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Update query and filter dynamically when transcript updates
  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
      const match = parseUserNeed(transcript);
      setMatchedIntent(match);
      setIsExpanded(true);
    }
  }, [transcript]);

  // Voice listening animation
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // Parse intent on change
  useEffect(() => {
    if (query.trim().length >= 3) {
      const match = parseUserNeed(query);
      setMatchedIntent(match);
      setIsExpanded(true);
    } else {
      setMatchedIntent(null);
    }
  }, [query]);

  const handleMicToggle = async () => {
    if (isListening) {
      stopListening();
      return;
    }

    setVoiceNotice(null);

    // Request permission if previously denied
    if (permissionStatus === "denied") {
      const granted = await requestPermission();
      if (!granted) {
        setVoiceNotice(
          "Microphone permission was denied. Please allow microphone permissions in your browser or device settings.",
        );
        return;
      }
    }

    startListening(
      (spokenText, isFinal) => {
        if (spokenText) {
          setQuery(spokenText);
          const match = parseUserNeed(spokenText);
          setMatchedIntent(match);
          setIsExpanded(true);
        }
      },
      (errText) => {
        setVoiceNotice(errText);
      },
    );
  };

  const handleRoute = (route: string) => {
    router.push(route as any);
  };

  const handleChipPress = (promptText: string) => {
    setQuery(promptText);
    const match = parseUserNeed(promptText);
    setMatchedIntent(match);
    setIsExpanded(true);
  };

  const handleDirectContact = (title: string, actionText?: string) => {
    setDirectFeedback(`✓ Connected: ${title} (${actionText || "Dispatched"})`);
    setTimeout(() => setDirectFeedback(null), 3000);
  };

  return (
    <View style={styles.outerContainer}>
      {/* Universal Need Header Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? C.card || "rgba(255,255,255,0.05)"
              : C.card || "#FFFFFF",
            borderColor: isListening
              ? "#EF4444"
              : matchedIntent
                ? matchedIntent.color
                : isDark
                  ? "rgba(255,255,255,0.12)"
                  : C.border || "#E2E8F0",
          },
        ]}
      >
        {/* Top title line */}
        <View style={styles.topHeader}>
          <View style={styles.titleWithIcon}>
            <View
              style={[
                styles.targetIconCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(99, 102, 241, 0.2)"
                    : "#EEF2FF",
                },
              ]}
            >
              <Ionicons
                name="sparkles"
                size={15}
                color={isDark ? "#A5B4FC" : "#6366F1"}
              />
            </View>
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: C.text || (isDark ? "#FFFFFF" : "#0F172A") },
                ]}
              >
                I Need This
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  {
                    color:
                      C.sub ||
                      C.mute ||
                      (isDark ? "rgba(255,255,255,0.55)" : "#64748B"),
                  },
                ]}
              >
                Universal AI Intent Router
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.expandModalBtn,
              {
                backgroundColor: isDark ? "rgba(99, 102, 241, 0.2)" : "#EEF2FF",
              },
            ]}
            onPress={() => setIsModalOpen(true)}
            accessibilityLabel="Open Full Universal Assistant"
          >
            <Text
              style={[
                styles.expandModalBtnText,
                { color: isDark ? "#A5B4FC" : "#6366F1" },
              ]}
            >
              Full Hub
            </Text>
            <Ionicons
              name="expand-outline"
              size={13}
              color={isDark ? "#A5B4FC" : "#6366F1"}
            />
          </TouchableOpacity>
        </View>

        {/* Input Bar */}
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : C.cardSecondary || "#F8FAFC",
              borderColor: isListening
                ? "#EF4444"
                : isDark
                  ? "rgba(255,255,255,0.12)"
                  : C.border || "#CBD5E1",
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={
              matchedIntent
                ? matchedIntent.color
                : isDark
                  ? "rgba(255,255,255,0.45)"
                  : "#64748B"
            }
            style={styles.searchIcon}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={ROTATING_EXAMPLES[placeholderIdx]}
            placeholderTextColor={
              C.placeholder || (isDark ? "rgba(255,255,255,0.4)" : "#94A3B8")
            }
            style={[
              styles.input,
              { color: C.text || (isDark ? "#FFFFFF" : "#0F172A") },
            ]}
            autoCapitalize="none"
          />

          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setMatchedIntent(null);
                setIsExpanded(false);
              }}
              style={styles.clearBtn}
            >
              <Ionicons
                name="close-circle"
                size={17}
                color={C.mute || (isDark ? "rgba(255,255,255,0.4)" : "#94A3B8")}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleMicToggle}
            style={[
              styles.micBtn,
              {
                backgroundColor: isListening
                  ? "#EF4444"
                  : isDark
                    ? "rgba(99, 102, 241, 0.25)"
                    : "#EEF2FF",
              },
            ]}
            accessibilityLabel={
              isListening ? "Stop listening" : "Speak your requirement"
            }
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons
                name={isListening ? "mic" : "mic-outline"}
                size={17}
                color={isListening ? "#FFFFFF" : isDark ? "#A5B4FC" : "#6366F1"}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Voice listening indicator */}
        {isListening && (
          <View
            style={[
              styles.inlineListening,
              {
                backgroundColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
              },
            ]}
          >
            <View style={styles.pulsingRedDot} />
            <Text
              style={[
                styles.inlineListeningText,
                { color: isDark ? "#FCA5A5" : "#B91C1C" },
              ]}
            >
              Listening... Speak your requirement (e.g. "I need a bike
              mechanic")
            </Text>
          </View>
        )}

        {/* Voice / Permission notice */}
        {voiceNotice && (
          <View
            style={[
              styles.feedbackToast,
              {
                backgroundColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
                marginTop: 8,
              },
            ]}
          >
            <Ionicons
              name="alert-circle"
              size={16}
              color={isDark ? "#FCA5A5" : "#DC2626"}
            />
            <Text
              style={[
                styles.feedbackText,
                { color: isDark ? "#FCA5A5" : "#B91C1C", flex: 1 },
              ]}
            >
              {voiceNotice}
            </Text>
            <TouchableOpacity onPress={() => setVoiceNotice(null)}>
              <Ionicons
                name="close"
                size={15}
                color={isDark ? "#FCA5A5" : "#DC2626"}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Feedback alert */}
        {directFeedback && (
          <View
            style={[
              styles.feedbackToast,
              {
                backgroundColor: isDark ? "rgba(34, 197, 94, 0.2)" : "#DCFCE7",
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={isDark ? "#86EFAC" : "#15803D"}
            />
            <Text
              style={[
                styles.feedbackText,
                { color: isDark ? "#86EFAC" : "#15803D" },
              ]}
            >
              {directFeedback}
            </Text>
          </View>
        )}

        {/* Suggested Need Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          style={{ marginTop: 10 }}
        >
          {SUGGESTED_NEED_PROMPTS.slice(0, 6).map((prompt) => (
            <TouchableOpacity
              key={prompt.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : prompt.bg,
                  borderColor:
                    query === prompt.text
                      ? prompt.color
                      : isDark
                        ? "rgba(255,255,255,0.12)"
                        : "transparent",
                },
              ]}
              onPress={() => handleChipPress(prompt.text)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{prompt.emoji}</Text>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isDark
                      ? query === prompt.text
                        ? prompt.color
                        : "#F1F5F9"
                      : prompt.color,
                  },
                ]}
              >
                {prompt.text}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Live Intent Match Preview Card */}
        {matchedIntent && isExpanded && (
          <View
            style={[
              styles.matchedCard,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : matchedIntent.bg,
                borderColor: matchedIntent.color,
              },
            ]}
          >
            <View style={styles.matchTop}>
              <View
                style={[
                  styles.matchIconCircle,
                  { backgroundColor: matchedIntent.color },
                ]}
              >
                <Ionicons
                  name={matchedIntent.icon as any}
                  size={18}
                  color="#FFFFFF"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={styles.matchBadgeRow}>
                  <Text
                    style={[
                      styles.matchModuleName,
                      { color: matchedIntent.color },
                    ]}
                  >
                    {matchedIntent.moduleName}
                  </Text>
                  <View
                    style={[
                      styles.matchBadgePill,
                      { backgroundColor: matchedIntent.color },
                    ]}
                  >
                    <Text style={styles.matchBadgePillText}>
                      {matchedIntent.badge}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.matchHeadline,
                    { color: C.text || (isDark ? "#FFFFFF" : "#0F172A") },
                  ]}
                >
                  {matchedIntent.headline}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.matchExplanation,
                {
                  color:
                    C.sub || (isDark ? "rgba(255,255,255,0.75)" : "#334155"),
                },
              ]}
            >
              {matchedIntent.explanation}
            </Text>

            {/* Direct Matched Preview Items */}
            <View style={styles.instantList}>
              {matchedIntent.instantResults.slice(0, 2).map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.instantRowItem,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.04)"
                        : C.card || "#FFFFFF",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : C.border || "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text
                        style={[
                          styles.itemTitle,
                          { color: C.text || (isDark ? "#FFFFFF" : "#0F172A") },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {item.badge && (
                        <View
                          style={[
                            styles.itemPill,
                            {
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.12)"
                                : matchedIntent.bg,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.itemPillText,
                              {
                                color: isDark ? "#F1F5F9" : matchedIntent.color,
                              },
                            ]}
                          >
                            {item.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.itemSub,
                        {
                          color:
                            C.sub ||
                            C.mute ||
                            (isDark ? "rgba(255,255,255,0.5)" : "#64748B"),
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.itemActionBtn,
                      { backgroundColor: matchedIntent.color },
                    ]}
                    onPress={() =>
                      handleDirectContact(item.title, item.actionText)
                    }
                  >
                    <Text style={styles.itemActionText}>
                      {item.actionText || "Contact"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* 1-Tap Route Action */}
            <TouchableOpacity
              style={[
                styles.primaryRouteBtn,
                { backgroundColor: matchedIntent.color },
              ]}
              onPress={() => handleRoute(matchedIntent.route)}
            >
              <Text style={styles.primaryRouteText}>
                {matchedIntent.actionLabel}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Full Modal */}
      <INeedThisModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialQuery={query}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  targetIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: "500",
  },
  expandModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expandModalBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6366F1",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 44,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    paddingVertical: 4,
  },
  clearBtn: {
    padding: 4,
    marginRight: 2,
  },
  micBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  inlineListening: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
  },
  pulsingRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    marginRight: 6,
  },
  inlineListeningText: {
    fontSize: 11,
    color: "#B91C1C",
    fontWeight: "600",
    flex: 1,
  },
  feedbackToast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  feedbackText: {
    fontSize: 12,
    color: "#15803D",
    fontWeight: "600",
  },
  chipsScroll: {
    gap: 8,
    paddingRight: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  matchedCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    marginTop: 12,
  },
  matchTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  matchIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  matchBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  matchModuleName: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  matchBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  matchBadgePillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  matchHeadline: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  matchExplanation: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 16,
    marginBottom: 10,
  },
  instantList: {
    gap: 6,
    marginBottom: 10,
  },
  instantRowItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  itemPill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemPillText: {
    fontSize: 9,
    fontWeight: "700",
  },
  itemSub: {
    fontSize: 10,
    marginTop: 1,
  },
  itemActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  itemActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  primaryRouteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  primaryRouteText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
