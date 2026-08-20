import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  Animated,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useVoiceSpeech } from "@/hooks/useVoiceSpeech";
import {
  parseUserNeed,
  SUGGESTED_NEED_PROMPTS,
  IntentMatch,
  SuggestedNeedPrompt,
} from "@/utils/intentRouter";

interface INeedThisModalProps {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const ROTATING_EXAMPLES = [
  "I need a bike mechanic near me...",
  "I need someone to go to Vijayawada with...",
  "I need a movie ticket for tonight...",
  "I lost my wallet in Hitec City...",
  "I'm visiting Hyderabad tomorrow...",
  "I want to buy a used cycle...",
  "Need a badminton partner for 7 PM...",
  "Looking for home tiffin food...",
];

export const INeedThisModal: React.FC<INeedThisModalProps> = ({
  visible,
  onClose,
  initialQuery = "",
}) => {
  const router = useRouter();
  const { theme: C, isDark } = useTheme();

  const [query, setQuery] = useState(initialQuery);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [matchedIntent, setMatchedIntent] = useState<IntentMatch | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
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
  const inputRef = useRef<TextInput>(null);

  // Cycle placeholder smoothly
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_EXAMPLES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [visible]);

  // Sync initial query
  useEffect(() => {
    if (visible) {
      if (initialQuery) {
        setQuery(initialQuery);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    } else {
      setQuery("");
      setMatchedIntent(null);
      setActionSuccessMsg(null);
      setVoiceNotice(null);
    }
  }, [visible, initialQuery]);

  // Voice recognition listener
  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
      const match = parseUserNeed(transcript);
      setMatchedIntent(match);
    }
  }, [transcript]);

  // Pulse animation for listening state
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // Parse intent whenever query updates
  useEffect(() => {
    if (query.trim().length >= 2) {
      const match = parseUserNeed(query);
      setMatchedIntent(match);
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
        }
      },
      (errText) => {
        setVoiceNotice(errText);
      },
    );
  };

  const handleSelectPrompt = (prompt: SuggestedNeedPrompt) => {
    setQuery(prompt.text);
  };

  const handleNavigateToMatch = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  const handleDirectAction = (itemTitle: string, actionText?: string) => {
    setActionSuccessMsg(
      `Connected with "${itemTitle}" (${actionText || "Action Confirmed"})!`,
    );
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 3200);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: C.bg || (isDark ? "#0B0714" : "#FFFFFF") },
        ]}
      >
        {/* Top bar */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor:
                C.border ||
                (isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"),
            },
          ]}
        >
          <View style={styles.headerTitleRow}>
            <View
              style={[
                styles.badgeWrapper,
                {
                  backgroundColor: isDark
                    ? "rgba(99, 102, 241, 0.2)"
                    : "#EEF2FF",
                },
              ]}
            >
              <Text style={styles.badgeIcon}>🎯</Text>
              <Text
                style={[
                  styles.badgeText,
                  { color: isDark ? "#A5B4FC" : "#6366F1" },
                ]}
              >
                Universal Intent Router
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : C.cardSecondary || "#F1F5F9",
                },
              ]}
              accessibilityLabel="Close"
            >
              <Ionicons
                name="close"
                size={22}
                color={C.text || (isDark ? "#FFFFFF" : "#1E293B")}
              />
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.mainHeadline,
              { color: C.text || (isDark ? "#FFFFFF" : "#0F172A") },
            ]}
          >
            What do you need today?
          </Text>
          <Text
            style={[
              styles.subHeadline,
              {
                color:
                  C.sub ||
                  C.mute ||
                  (isDark ? "rgba(255,255,255,0.55)" : "#64748B"),
              },
            ]}
          >
            No need to search multiple menus. Tell JUNTO in plain words, and
            we'll route you instantly.
          </Text>

          {/* Universal Search Input */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : C.card || "#FFFFFF",
                borderColor: isListening
                  ? "#EF4444"
                  : isDark
                    ? "rgba(255,255,255,0.15)"
                    : C.primary || "#6366F1",
                borderWidth: 1.5,
              },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={20}
              color={
                isListening
                  ? "#EF4444"
                  : isDark
                    ? "#A5B4FC"
                    : C.primary || "#6366F1"
              }
              style={styles.searchIcon}
            />
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                { color: C.text || (isDark ? "#FFFFFF" : "#0F172A") },
              ]}
              value={query}
              onChangeText={setQuery}
              placeholder={ROTATING_EXAMPLES[placeholderIndex]}
              placeholderTextColor={
                C.placeholder ||
                (isDark ? "rgba(255,255,255,0.38)" : "#94A3B8")
              }
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery("")}
                style={styles.iconBtn}
                accessibilityLabel="Clear text"
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={
                    C.mute || (isDark ? "rgba(255,255,255,0.4)" : "#94A3B8")
                  }
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
                isListening ? "Stop listening" : "Voice input"
              }
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons
                  name={isListening ? "mic" : "mic-outline"}
                  size={18}
                  color={
                    isListening
                      ? "#FFFFFF"
                      : isDark
                        ? "#A5B4FC"
                        : C.primary || "#6366F1"
                  }
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {isListening && (
            <View
              style={[
                styles.listeningBar,
                {
                  backgroundColor: isDark
                    ? "rgba(239, 68, 68, 0.2)"
                    : "#FEE2E2",
                },
              ]}
            >
              <View style={styles.redDot} />
              <Text
                style={[
                  styles.listeningText,
                  { color: isDark ? "#FCA5A5" : "#B91C1C" },
                ]}
              >
                Listening to your voice... Speak naturally (e.g. "I need a
                mechanic in Madhapur")
              </Text>
            </View>
          )}

          {voiceNotice && (
            <View
              style={[
                styles.successToast,
                {
                  backgroundColor: isDark
                    ? "rgba(239, 68, 68, 0.2)"
                    : "#FEE2E2",
                },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={18}
                color={isDark ? "#FCA5A5" : "#DC2626"}
              />
              <Text
                style={[
                  styles.successToastText,
                  { color: isDark ? "#FCA5A5" : "#B91C1C", flex: 1 },
                ]}
              >
                {voiceNotice}
              </Text>
              <TouchableOpacity onPress={() => setVoiceNotice(null)}>
                <Ionicons
                  name="close"
                  size={16}
                  color={isDark ? "#FCA5A5" : "#DC2626"}
                />
              </TouchableOpacity>
            </View>
          )}

          {actionSuccessMsg && (
            <View
              style={[
                styles.successToast,
                {
                  backgroundColor: isDark
                    ? "rgba(34, 197, 94, 0.2)"
                    : "#DCFCE7",
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={isDark ? "#86EFAC" : "#16A34A"}
              />
              <Text
                style={[
                  styles.successToastText,
                  { color: isDark ? "#86EFAC" : "#15803D" },
                ]}
              >
                {actionSuccessMsg}
              </Text>
            </View>
          )}
        </View>

        {/* Scrollable body */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* If user typed or matched an intent */}
          {matchedIntent ? (
            <View style={styles.intentCardWrapper}>
              {/* Intent Result Banner */}
              <View
                style={[
                  styles.matchedBanner,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : matchedIntent.bg,
                    borderColor: matchedIntent.color,
                  },
                ]}
              >
                <View style={styles.intentHeaderRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: matchedIntent.color },
                    ]}
                  >
                    <Ionicons
                      name={matchedIntent.icon as any}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={styles.intentBadgeRow}>
                      <Text
                        style={[
                          styles.matchedModuleName,
                          { color: matchedIntent.color },
                        ]}
                      >
                        {matchedIntent.moduleName}
                      </Text>
                      <View
                        style={[
                          styles.modulePill,
                          { backgroundColor: matchedIntent.color },
                        ]}
                      >
                        <Text style={styles.modulePillText}>
                          {matchedIntent.badge}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.intentHeadline,
                        { color: C.text || (isDark ? "#FFFFFF" : "#0F172A") },
                      ]}
                    >
                      {matchedIntent.headline}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.intentExplanation,
                    {
                      color:
                        C.sub ||
                        (isDark ? "rgba(255,255,255,0.75)" : "#334155"),
                    },
                  ]}
                >
                  {matchedIntent.explanation}
                </Text>

                {/* Tags */}
                <View style={styles.tagRow}>
                  {matchedIntent.tags.map((tag, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tagPill,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(255,255,255,0.7)",
                        },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={13}
                        color={matchedIntent.color}
                      />
                      <Text
                        style={[
                          styles.tagText,
                          {
                            color: isDark ? "#F1F5F9" : matchedIntent.color,
                          },
                        ]}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: matchedIntent.color },
                  ]}
                  onPress={() => handleNavigateToMatch(matchedIntent.route)}
                >
                  <Text style={styles.primaryActionBtnText}>
                    {matchedIntent.actionLabel}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {matchedIntent.secondaryActionLabel && (
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionBtn,
                      { borderColor: matchedIntent.color },
                    ]}
                    onPress={() =>
                      handleNavigateToMatch(
                        matchedIntent.secondaryRoute || matchedIntent.route,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.secondaryActionBtnText,
                        { color: matchedIntent.color },
                      ]}
                    >
                      {matchedIntent.secondaryActionLabel}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Instant Matched Preview Results */}
              <View style={styles.instantResultsSection}>
                <View style={styles.instantHeaderRow}>
                  <Text
                    style={[
                      styles.instantSectionTitle,
                      { color: C.text || (isDark ? "#FFFFFF" : "#1E293B") },
                    ]}
                  >
                    Direct Matches Found in Your Radius
                  </Text>
                  <Text
                    style={[
                      styles.instantCountBadge,
                      {
                        color:
                          C.sub ||
                          C.mute ||
                          (isDark ? "rgba(255,255,255,0.5)" : "#64748B"),
                      },
                    ]}
                  >
                    {matchedIntent.instantResults.length} Available
                  </Text>
                </View>

                {matchedIntent.instantResults.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.resultCard,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.04)"
                          : C.card || "#FFFFFF",
                        borderColor: isDark
                          ? "rgba(255,255,255,0.08)"
                          : C.border || "#E2E8F0",
                      },
                    ]}
                  >
                    <View style={styles.resultCardTop}>
                      <View
                        style={[
                          styles.avatarBox,
                          {
                            backgroundColor:
                              item.avatarBg || matchedIntent.color,
                          },
                        ]}
                      >
                        <Ionicons
                          name={matchedIntent.icon as any}
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={styles.titleRow}>
                          <Text
                            style={[
                              styles.resultTitle,
                              {
                                color:
                                  C.text || (isDark ? "#FFFFFF" : "#0F172A"),
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          {item.badge && (
                            <View
                              style={[
                                styles.resultBadge,
                                {
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.12)"
                                    : matchedIntent.bg,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.resultBadgeText,
                                  {
                                    color: isDark
                                      ? "#F1F5F9"
                                      : matchedIntent.color,
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
                            styles.resultSubtitle,
                            {
                              color:
                                C.sub ||
                                C.mute ||
                                (isDark ? "rgba(255,255,255,0.5)" : "#64748B"),
                            },
                          ]}
                        >
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.resultDetail,
                        {
                          color:
                            C.sub ||
                            (isDark ? "rgba(255,255,255,0.75)" : "#334155"),
                        },
                      ]}
                    >
                      {item.detail}
                    </Text>

                    <View
                      style={[
                        styles.resultCardBottom,
                        {
                          borderTopColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : C.border || "#F1F5F9",
                        },
                      ]}
                    >
                      {item.price ? (
                        <Text
                          style={[
                            styles.resultPrice,
                            { color: matchedIntent.color },
                          ]}
                        >
                          {item.price}
                        </Text>
                      ) : (
                        <View />
                      )}
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[
                            styles.directActionBtn,
                            { backgroundColor: matchedIntent.color },
                          ]}
                          onPress={() =>
                            handleDirectAction(item.title, item.actionText)
                          }
                        >
                          <Ionicons
                            name={
                              matchedIntent.module === "services"
                                ? "call"
                                : matchedIntent.module === "rides"
                                  ? "car"
                                  : matchedIntent.module === "tickets"
                                    ? "ticket"
                                    : "chatbubble-ellipses"
                            }
                            size={14}
                            color="#FFFFFF"
                          />
                          <Text style={styles.directActionBtnText}>
                            {item.actionText || "Contact"}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.viewDetailsBtn,
                            {
                              borderColor: isDark
                                ? "rgba(255,255,255,0.15)"
                                : C.border || "#CBD5E1",
                            },
                          ]}
                          onPress={() =>
                            handleNavigateToMatch(matchedIntent.route)
                          }
                        >
                          <Text
                            style={[
                              styles.viewDetailsBtnText,
                              {
                                color:
                                  C.text || (isDark ? "#FFFFFF" : "#475569"),
                              },
                            ]}
                          >
                            View Full ➔
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            /* Suggested Intent Examples */
            <View style={styles.suggestedSection}>
              <View style={styles.suggestedHeader}>
                <Ionicons name="flash" size={16} color="#F59E0B" />
                <Text
                  style={[
                    styles.suggestedTitle,
                    { color: C.text || (isDark ? "#FFFFFF" : "#1E293B") },
                  ]}
                >
                  Try tapping common neighborhood needs:
                </Text>
              </View>

              <View style={styles.promptsGrid}>
                {SUGGESTED_NEED_PROMPTS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.promptCard,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.04)"
                          : C.card || "#FFFFFF",
                        borderColor: isDark
                          ? "rgba(255,255,255,0.08)"
                          : C.border || "#E2E8F0",
                      },
                    ]}
                    onPress={() => handleSelectPrompt(p)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.promptTopRow}>
                      <Text style={styles.promptEmoji}>{p.emoji}</Text>
                      <View
                        style={[
                          styles.promptCategoryPill,
                          {
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.12)"
                              : p.bg,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.promptCategoryText,
                            { color: p.color },
                          ]}
                        >
                          {p.targetModule}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.promptText,
                        { color: C.text || (isDark ? "#FFFFFF" : "#1E293B") },
                      ]}
                      numberOfLines={2}
                    >
                      “{p.text}”
                    </Text>
                    <View style={styles.routeIndication}>
                      <Text
                        style={[styles.routeIndicationText, { color: p.color }]}
                      >
                        Auto-routes to {p.category}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={12}
                        color={p.color}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* How it works info card */}
              <View
                style={[
                  styles.howItWorksCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "#F8FAFC",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.howItWorksHeader}>
                  <Ionicons
                    name="information-circle"
                    size={18}
                    color="#6366F1"
                  />
                  <Text
                    style={[
                      styles.howItWorksTitle,
                      { color: C.text || (isDark ? "#FFFFFF" : "#334155") },
                    ]}
                  >
                    How "I Need This" Works
                  </Text>
                </View>
                <Text
                  style={[
                    styles.howItWorksBody,
                    {
                      color:
                        C.sub ||
                        C.mute ||
                        (isDark ? "rgba(255,255,255,0.65)" : "#64748B"),
                    },
                  ]}
                >
                  JUNTO removes the barrier of choosing between DayMates, Local
                  Services, RideMate, Deals, HelpMe, and Roam. Simply describe
                  what you are looking for in everyday language, and JUNTO's
                  intent model routes you directly to matching neighbors,
                  verified technicians, or carpools within your local radius.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 44 : 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badgeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366F1",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  mainHeadline: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  subHeadline: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 8,
  },
  iconBtn: {
    padding: 4,
    marginRight: 4,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  listeningBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 8,
  },
  listeningText: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "600",
    flex: 1,
  },
  successToast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  successToastText: {
    fontSize: 13,
    color: "#15803D",
    fontWeight: "600",
    marginLeft: 8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  intentCardWrapper: {
    marginBottom: 20,
  },
  matchedBanner: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  intentHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  intentBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  matchedModuleName: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modulePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  modulePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  intentHeadline: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 22,
  },
  intentExplanation: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  primaryActionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryActionBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  instantResultsSection: {
    marginTop: 4,
  },
  instantHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  instantSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  instantCountBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  resultCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  resultCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  resultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  resultSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  resultDetail: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  resultCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: "800",
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
  },
  directActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  directActionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  viewDetailsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  suggestedSection: {
    marginTop: 4,
  },
  suggestedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  promptsGrid: {
    gap: 10,
    marginBottom: 20,
  },
  promptCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  promptTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  promptEmoji: {
    fontSize: 18,
  },
  promptCategoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  promptCategoryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  promptText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 18,
  },
  routeIndication: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  routeIndicationText: {
    fontSize: 11,
    fontWeight: "700",
  },
  howItWorksCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  howItWorksHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  howItWorksTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  howItWorksBody: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
});
