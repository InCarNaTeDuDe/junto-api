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
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useVoiceSpeech } from "@/hooks/useVoiceSpeech";
import { fetchDbUniversalNeed, IntentMatch } from "@/utils/intentRouter";

interface RotatingExample {
  id: string;
  label: string;
  query: string;
}

const ROTATING_EXAMPLES: RotatingExample[] = [
  { id: "1", label: "🔧 Bike mechanic", query: "I need a bike mechanic near me" },
  { id: "2", label: "🚗 Carpool to Vijayawada", query: "I need someone to go to Vijayawada with" },
  { id: "3", label: "🎟️ Movie ticket", query: "I need a movie ticket for tonight" },
  { id: "4", label: "👜 Lost wallet", query: "I lost my wallet in Hitec City" },
  { id: "5", label: "🚲 Used cycle", query: "I want to buy a used cycle" },
  { id: "6", label: "🏸 Badminton partner", query: "Need a badminton partner for 7 PM" },
  { id: "7", label: "🍱 Home tiffin", query: "Looking for home tiffin food" },
];

export const UniversalNeedBar: React.FC = () => {
  const router = useRouter();
  const { theme: C, isDark } = useTheme();

  const [query, setQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [matchedIntent, setMatchedIntent] = useState<IntentMatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
  } = useVoiceSpeech("universal-need-bar");

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Cycle placeholder smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % ROTATING_EXAMPLES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Handle voice speech input
  useEffect(() => {
    if (transcript) {
      handleSearch(transcript);
    }
  }, [transcript]);

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
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

  /**
   * Search directly against database — no static fallback!
   */
  const handleSearch = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setQuery("");
      setMatchedIntent(null);
      setHasSearched(false);
      return;
    }

    setQuery(trimmed);
    setHasSearched(true);
    setIsLoading(true);

    try {
      const result = await fetchDbUniversalNeed(trimmed);
      setMatchedIntent(result);
    } catch (err) {
      console.warn("DB query error in UniversalNeedBar:", err);
      setMatchedIntent(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExample = (example: RotatingExample) => {
    handleSearch(example.query);
  };

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((spoken) => {
        if (spoken) {
          handleSearch(spoken);
        }
      });
    }
  };

  const handleItemAction = async (item: any) => {
    if (item.phone) {
      try {
        await Linking.openURL(`tel:${item.phone}`);
      } catch {
        // Fallback for non-telephony devices
      }
      return;
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const currentPlaceholder = ROTATING_EXAMPLES[placeholderIdx]?.query || "What do you need?";

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.06)"
              : C.card || "#FFFFFF",
            borderColor: isListening
              ? "#EF4444"
              : isDark
                ? "rgba(255,255,255,0.12)"
                : C.border || "#E2E8F0",
          },
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={isDark ? "rgba(255,255,255,0.5)" : "#64748B"}
          style={styles.searchIcon}
        />

        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (text.trim().length >= 3) {
              handleSearch(text);
            } else if (text.trim().length === 0) {
              setMatchedIntent(null);
              setHasSearched(false);
            }
          }}
          placeholder={currentPlaceholder}
          placeholderTextColor={
            isDark ? "rgba(255,255,255,0.4)" : "#94A3B8"
          }
          style={[
            styles.input,
            { color: isDark ? "#FFFFFF" : "#0F172A" },
          ]}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch(query || currentPlaceholder)}
          autoCapitalize="none"
        />

        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery("");
              setMatchedIntent(null);
              setHasSearched(false);
            }}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close-circle"
              size={17}
              color={isDark ? "rgba(255,255,255,0.45)" : "#94A3B8"}
            />
          </TouchableOpacity>
        )}

        {isLoading ? (
          <ActivityIndicator size="small" color="#6366F1" style={{ marginHorizontal: 4 }} />
        ) : (
          <TouchableOpacity
            onPress={handleMicPress}
            style={[
              styles.micBtn,
              {
                backgroundColor: isListening
                  ? "#EF4444"
                  : isDark
                    ? "rgba(99, 102, 241, 0.2)"
                    : "#EEF2FF",
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons
                name={isListening ? "mic" : "mic-outline"}
                size={16}
                color={isListening ? "#FFFFFF" : isDark ? "#A5B4FC" : "#6366F1"}
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      {/* Simple Rotating Examples Chip Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={{ marginTop: 8 }}
      >
        {ROTATING_EXAMPLES.map((ex) => {
          const isSelected = query === ex.query;
          return (
            <TouchableOpacity
              key={ex.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? "#4F46E5"
                      : "#6366F1"
                    : isDark
                      ? "rgba(255,255,255,0.06)"
                      : "#F1F5F9",
                  borderColor: isSelected
                    ? "#4F46E5"
                    : isDark
                      ? "rgba(255,255,255,0.1)"
                      : "#E2E8F0",
                },
              ]}
              onPress={() => handleSelectExample(ex)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected
                      ? "#FFFFFF"
                      : isDark
                        ? "#E2E8F0"
                        : "#334155",
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
              >
                {ex.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Database Results Card (shown only if records returned) */}
      {matchedIntent && matchedIntent.instantResults && matchedIntent.instantResults.length > 0 && (
        <View
          style={[
            styles.resultsCard,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : C.card || "#FFFFFF",
              borderColor: isDark
                ? "rgba(255,255,255,0.12)"
                : C.border || "#E2E8F0",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.resultsHeader}>
            <View style={styles.resultsHeaderLeft}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: matchedIntent.color },
                ]}
              >
                <Ionicons
                  name={matchedIntent.icon as any}
                  size={15}
                  color="#FFFFFF"
                />
              </View>
              <Text
                style={[
                  styles.moduleName,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
              >
                {matchedIntent.moduleName}
              </Text>
            </View>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: matchedIntent.bg },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: matchedIntent.color },
                ]}
              >
                {matchedIntent.instantResults.length} Found in DB
              </Text>
            </View>
          </View>

          {/* Result Items */}
          <View style={styles.itemsList}>
            {matchedIntent.instantResults.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "#F8FAFC",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.07)"
                      : "#F1F5F9",
                  },
                ]}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.itemSubtitle,
                      { color: isDark ? "rgba(255,255,255,0.6)" : "#64748B" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                  {item.price ? (
                    <Text
                      style={[
                        styles.itemPrice,
                        { color: matchedIntent.color },
                      ]}
                    >
                      {item.price}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: matchedIntent.color },
                  ]}
                  onPress={() => handleItemAction(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>
                    {item.actionText || "View"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Primary Route Button */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: matchedIntent.color },
            ]}
            onPress={() => router.push(matchedIntent.route as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {matchedIntent.actionLabel}
            </Text>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* No Results from DB State */}
      {hasSearched && !isLoading && (!matchedIntent || !matchedIntent.instantResults || matchedIntent.instantResults.length === 0) && (
        <View
          style={[
            styles.emptyCard,
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
          <Ionicons
            name="cube-outline"
            size={20}
            color={isDark ? "rgba(255,255,255,0.4)" : "#94A3B8"}
          />
          <Text
            style={[
              styles.emptyText,
              { color: isDark ? "rgba(255,255,255,0.6)" : "#64748B" },
            ]}
          >
            No matching records found in database for "{query}".
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 0,
  },
  iconBtn: {
    padding: 4,
    marginRight: 4,
  },
  micBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  chipsRow: {
    gap: 8,
    paddingRight: 12,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  resultsCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  resultsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleName: {
    fontSize: 13,
    fontWeight: "700",
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  itemsList: {
    gap: 6,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 2,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    flex: 1,
  },
});
