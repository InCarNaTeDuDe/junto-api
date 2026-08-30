import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  useWindowDimensions,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { INeedThisModal } from "./NeedThisModal";

interface QuickFeaturesProps {
  isDark?: boolean;
  onSelectFeature?: (featureId: string, query?: string) => void;
}

interface FeatureItem {
  id: string;
  name: string;
  subtitle: string;
  description?: string;
  badge?: string;
  category?: "social" | "market" | "help" | "travel";
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  route?: string;
  query?: string;
}

// Micro-animated icon component for Paytm-style lively UI
interface AnimatedFeatureIconProps {
  featureId: string;
  icon: keyof typeof Ionicons.glyphMap;
  size: number;
  color: string;
  index?: number;
}

const AnimatedFeatureIcon: React.FC<AnimatedFeatureIconProps> = ({
  featureId,
  icon,
  size,
  color,
  index = 0,
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const secondaryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger start time slightly based on index so icons oscillate out of phase (organic feel)
    const delay = (index % 5) * 180;
    let mainLoop: Animated.CompositeAnimation | null = null;
    let secLoop: Animated.CompositeAnimation | null = null;

    const timer = setTimeout(() => {
      if (featureId === "ridemate" || icon === "car") {
        // Car moving / cruising oscillation: horizontal drift + subtle engine suspension vibration
        mainLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 1200,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: -1,
              duration: 1200,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 800,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        );

        secLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(secondaryAnim, {
              toValue: 1,
              duration: 250,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(secondaryAnim, {
              toValue: 0,
              duration: 250,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
        );
      } else if (
        featureId === "roam" ||
        icon === "location" ||
        icon === "location-sharp"
      ) {
        // Location Pin: smooth floating bounce & gentle squish/tilt
        mainLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 1000,
              easing: Easing.bezier(0.33, 1, 0.68, 1),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: -0.4,
              duration: 800,
              easing: Easing.bezier(0.32, 0, 0.67, 0),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        );
      } else if (
        featureId === "ineedthis" ||
        featureId === "hostevent" ||
        icon === "sparkles"
      ) {
        // Sparkles: pulse & twinkle rotation
        mainLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: -1,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        );
      } else if (featureId === "helpme" || icon === "heart") {
        // Heartbeat pulse rhythm
        mainLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 180,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0.2,
              duration: 140,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 1.15,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 350,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.delay(1200),
          ]),
        );
      } else if (
        featureId === "ticketswap" ||
        featureId === "deals" ||
        icon === "ticket" ||
        icon === "pricetag"
      ) {
        // Tag / Ticket gentle pendulum swing
        mainLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 1100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: -1,
              duration: 1100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        );
      } else if (featureId === "services" || icon === "construct") {
        // Services wrench / tool oscillation tap
        mainLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 700,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: -0.6,
              duration: 600,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 500,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.delay(800),
          ]),
        );
      } else if (featureId === "newhere" || icon === "compass") {
        // Compass needle magnetic wobbling
        mainLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 1300,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: -1,
              duration: 1300,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        );
      } else {
        // Default gentle organic sway / float for other features
        mainLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 1400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: -1,
              duration: 1400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        );
      }

      mainLoop.start();
      if (secLoop) secLoop.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (mainLoop) mainLoop.stop();
      if (secLoop) secLoop.stop();
    };
  }, [animValue, secondaryAnim, featureId, icon, index]);

  // Build animated transform styles based on feature personality
  const getAnimatedStyle = () => {
    if (featureId === "ridemate" || icon === "car") {
      const translateX = animValue.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [-3.5, 0, 3.5],
      });
      const translateY = secondaryAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -1],
      });
      const rotate = animValue.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ["-2.5deg", "0deg", "2.5deg"],
      });
      return {
        transform: [{ translateX }, { translateY }, { rotate }],
      };
    }

    if (
      featureId === "roam" ||
      icon === "location" ||
      icon === "location-sharp"
    ) {
      const translateY = animValue.interpolate({
        inputRange: [-0.4, 0, 1],
        outputRange: [1, 0, -4],
      });
      const scale = animValue.interpolate({
        inputRange: [-0.4, 0, 1],
        outputRange: [0.95, 1, 1.08],
      });
      const rotate = animValue.interpolate({
        inputRange: [-0.4, 0, 1],
        outputRange: ["-3deg", "0deg", "3deg"],
      });
      return {
        transform: [{ translateY }, { scale }, { rotate }],
      };
    }

    if (
      featureId === "ineedthis" ||
      featureId === "hostevent" ||
      icon === "sparkles"
    ) {
      const scale = animValue.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0.92, 1, 1.15],
      });
      const rotate = animValue.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ["-8deg", "0deg", "8deg"],
      });
      return {
        transform: [{ scale }, { rotate }],
      };
    }

    if (featureId === "helpme" || icon === "heart") {
      const scale = animValue.interpolate({
        inputRange: [0, 0.2, 1, 1.15],
        outputRange: [1, 1.04, 1.18, 1.22],
      });
      return {
        transform: [{ scale }],
      };
    }

    if (
      featureId === "ticketswap" ||
      featureId === "deals" ||
      icon === "ticket" ||
      icon === "pricetag"
    ) {
      const rotate = animValue.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ["-7deg", "0deg", "7deg"],
      });
      const translateY = animValue.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [-1, 0, -1],
      });
      return {
        transform: [{ rotate }, { translateY }],
      };
    }

    if (featureId === "services" || icon === "construct") {
      const rotate = animValue.interpolate({
        inputRange: [-0.6, 0, 1],
        outputRange: ["-8deg", "0deg", "7deg"],
      });
      return {
        transform: [{ rotate }],
      };
    }

    if (featureId === "newhere" || icon === "compass") {
      const rotate = animValue.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ["-14deg", "0deg", "14deg"],
      });
      return {
        transform: [{ rotate }],
      };
    }

    // Default gentle float & tilt
    const translateY = animValue.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [-1.5, 0, 1.5],
    });
    const rotate = animValue.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ["-3deg", "0deg", "3deg"],
    });
    return {
      transform: [{ translateY }, { rotate }],
    };
  };

  return (
    <Animated.View style={getAnimatedStyle()}>
      <Ionicons name={icon} size={size} color={color} />
    </Animated.View>
  );
};

const ALL_FEATURES: FeatureItem[] = [
  {
    id: "ineedthis",
    name: "I Need This",
    subtitle: "Universal AI Router",
    description:
      "Don't decide menus. Type or speak what you need and JUNTO routes you automatically.",
    badge: "AI 🎯",
    category: "help",
    icon: "sparkles",
    color: "#6366F1",
    bg: "#EEF2FF",
  },
  {
    id: "daymate",
    name: "DayMates",
    subtitle: "Find activity partners",
    description:
      "Meet people for coffee, cricket, movies, lunch, or hangout today.",
    badge: "Popular",
    category: "social",
    icon: "people",
    color: "#2563EB",
    bg: "#EFF6FF",
    route: "/(screens)/add-daymate",
    query: "mates",
  },
  {
    id: "ticketswap",
    name: "Ticket Swap",
    subtitle: "Buy & Sell tickets",
    description:
      "Swap or sell last-minute concert, movie, and event passes nearby safely.",
    badge: "Hot",
    category: "market",
    icon: "ticket",
    color: "#EA580C",
    bg: "#FFF7ED",
    route: "/(screens)/add-ticket",
    query: "ticket",
  },
  {
    id: "asknearby",
    name: "Ask Nearby",
    subtitle: "Local Q&A & Advice",
    description:
      "Ask locals about real-time crowds, entry fees, parking, or recommendations.",
    badge: "Live",
    category: "help",
    icon: "megaphone",
    color: "#E11D48",
    bg: "#FFE4E6",
    route: "/(screens)/ask-nearby",
    query: "ask",
  },
  {
    id: "ridemate",
    name: "RideMate",
    subtitle: "Share a ride",
    description: "Carpool and share daily rides with people heading your way.",
    category: "travel",
    icon: "car",
    color: "#7C3AED",
    bg: "#EDE9FE",
    route: "/(screens)/rides",
    query: "ride",
  },
  {
    id: "roam",
    name: "Roam & Explore",
    subtitle: "Discover new areas",
    description:
      "Find trending spots, switch your neighborhood, and explore local hangouts.",
    category: "travel",
    icon: "location",
    color: "#059669",
    bg: "#D1FAE5",
    route: "/(screens)/location-search",
    query: "roam",
  },
  {
    id: "services",
    name: "Local Services",
    subtitle: "Find local experts",
    description:
      "Connect with verified local technicians, trainers, and service pros.",
    category: "market",
    icon: "construct",
    color: "#CA8A04",
    bg: "#FEFCE8",
    route: "/(screens)/services",
    query: "service",
  },
  {
    id: "hostevent",
    name: "Host an Event",
    subtitle: "Create activities",
    description:
      "Organize turf games, pub crawls, board game nights, or social mixers.",
    badge: "Create",
    category: "social",
    icon: "sparkles",
    color: "#9333EA",
    bg: "#FAF5FF",
    route: "/(tabs)/create",
    query: "create",
  },
  {
    id: "deals",
    name: "Local Deals",
    subtitle: "Buy / Sell nearby",
    description:
      "Sell your cycle, mobile, electronics or furniture with 1-tap voice assist.",
    category: "market",
    icon: "pricetag",
    color: "#F59E0B",
    bg: "#FEF3C7",
    route: "/(screens)/deals",
    query: "deals",
  },
  {
    id: "newhere",
    name: "New to City?",
    subtitle: "Guides & Community",
    description:
      "Essential local guides, top areas, meetup groups, and insider advice.",
    badge: "Guide",
    category: "social",
    icon: "compass",
    color: "#06B6D4",
    bg: "#ECFEFF",
    route: "/(screens)/new-here",
    query: "new",
  },
  {
    id: "activitychats",
    name: "Activity Chats",
    subtitle: "Community rooms",
    description:
      "Join real-time discussions for your favorite local activities.",
    category: "social",
    icon: "chatbubbles",
    color: "#0284C7",
    bg: "#E0F2FE",
    route: "/(tabs)/chats",
    query: "chats",
  },
];

const ROW_FEATURES: FeatureItem[] = [
  {
    id: "ineedthis",
    name: "I Need This",
    subtitle: "Universal AI",
    icon: "sparkles",
    color: "#6366F1",
    bg: "#EEF2FF",
  },
  {
    id: "ridemate",
    name: "RideMate",
    subtitle: "Share a ride",
    icon: "car",
    color: "#7C3AED",
    bg: "#EDE9FE",
    route: "/(screens)/rides",
    query: "ride",
  },
  {
    id: "roam",
    name: "Roam",
    subtitle: "I'm in a new place",
    icon: "location",
    color: "#059669",
    bg: "#D1FAE5",
    route: "/(screens)/location-search",
    query: "roam",
  },
  {
    id: "services",
    name: "Services",
    subtitle: "Find experts",
    icon: "construct",
    color: "#EA580C",
    bg: "#FFEDD5",
    route: "/(screens)/services",
    query: "service",
  },
  {
    id: "helpme",
    name: "HelpMe",
    subtitle: "Get help nearby",
    icon: "heart",
    color: "#E11D48",
    bg: "#FFE4E6",
    route: "/(screens)/ask-nearby",
    query: "help",
  },
  {
    id: "deals",
    name: "Local Deals",
    subtitle: "Buy / Sell nearby",
    icon: "pricetag",
    color: "#F59E0B",
    bg: "#FEF3C7",
    route: "/(screens)/deals",
    query: "deals",
  },
  {
    id: "all",
    name: "All",
    subtitle: "View more",
    icon: "grid",
    color: "#2563EB",
    bg: "#E0F2FE",
  },
];

export const QuickFeatures: React.FC<QuickFeaturesProps> = ({
  isDark,
  onSelectFeature,
}) => {
  const [showAllModal, setShowAllModal] = useState(false);
  const [showNeedModal, setShowNeedModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { width } = useWindowDimensions();
  const isCompact = width < 400;

  const handlePressRowItem = (item: FeatureItem) => {
    if (item.id === "ineedthis") {
      setShowNeedModal(true);
      return;
    }
    if (item.id === "all") {
      setShowAllModal(true);
      return;
    }

    if (onSelectFeature) {
      onSelectFeature(item.id, item.query);
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const handleLaunchFeature = (item: FeatureItem) => {
    setShowAllModal(false);
    if (item.id === "ineedthis") {
      setShowNeedModal(true);
      return;
    }
    if (onSelectFeature) {
      onSelectFeature(item.id, item.query);
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const filteredFeatures =
    selectedCategory === "all"
      ? ALL_FEATURES
      : ALL_FEATURES.filter((f) => f.category === selectedCategory);

  const modalBg = isDark ? "#0B0F19" : "#FFFFFF";
  const modalText = isDark ? "#F8FAFC" : "#0F172A";
  const modalSub = isDark ? "rgba(255,255,255,0.65)" : "#64748B";
  const cardBorder = isDark ? "#1E293B" : "#E2E8F0";

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ROW_FEATURES.map((item, idx) => {
          const circleBg = isDark ? `${item.color}25` : item.bg;

          return (
            <Pressable
              key={item.id}
              style={styles.itemWrapper}
              onPress={() => handlePressRowItem(item)}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: circleBg,
                    borderColor: isDark ? `${item.color}40` : "transparent",
                  },
                ]}
              >
                <AnimatedFeatureIcon
                  featureId={item.id}
                  icon={item.icon}
                  size={25}
                  color={item.color}
                  index={idx}
                />
              </View>
              <Text
                style={[
                  styles.itemName,
                  { color: isDark ? "#F8FAFC" : "#0F172A" },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.itemSub,
                  { color: isDark ? "rgba(255,255,255,0.6)" : "#64748B" },
                ]}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* View All Features Modal */}
      <Modal
        visible={showAllModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAllModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowAllModal(false)}
          />
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: modalBg, borderColor: cardBorder },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <View style={styles.modalTitleRow}>
                  <Text style={[styles.modalTitle, { color: modalText }]}>
                    All Junto Features
                  </Text>
                  <Text style={{ fontSize: 16 }}>✨</Text>
                </View>
                <Text style={[styles.modalSubtitle, { color: modalSub }]}>
                  Explore everything you can do around you
                </Text>
              </View>
              <Pressable
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                ]}
                onPress={() => setShowAllModal(false)}
              >
                <Ionicons name="close" size={20} color={modalText} />
              </Pressable>
            </View>

            {/* Category filter tabs */}
            <View style={styles.categoryTabs}>
              {[
                { id: "all", label: "All Features" },
                { id: "social", label: "DayMates & Social" },
                { id: "market", label: "Ticket Swap & Deals" },
                { id: "help", label: "Ask & Help" },
                { id: "travel", label: "Rides & Roam" },
              ].map((tab) => {
                const active = selectedCategory === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setSelectedCategory(tab.id)}
                    style={[
                      styles.categoryTab,
                      {
                        backgroundColor: active
                          ? isDark
                            ? "#38BDF820"
                            : "#EDE9FE"
                          : isDark
                            ? "#1E293B60"
                            : "#F8FAFC",
                        borderColor: active
                          ? isDark
                            ? "#38BDF8"
                            : "#8B5CF6"
                          : isDark
                            ? "#334155"
                            : "#E2E8F0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryTabText,
                        {
                          color: active
                            ? isDark
                              ? "#38BDF8"
                              : "#7C3AED"
                            : modalSub,
                          fontWeight: active ? "700" : "500",
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Features List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.featureGrid}
            >
              {filteredFeatures.map((f, idx) => {
                const iconBg = isDark ? `${f.color}25` : f.bg;
                const cBg = isDark ? "#131C2E" : "#FFFFFF";

                return (
                  <Pressable
                    key={f.id}
                    style={[
                      styles.featureCard,
                      {
                        backgroundColor: cBg,
                        borderColor: isDark ? "#1E293B" : "#F1F5F9",
                        width: isCompact ? "100%" : "48%",
                      },
                    ]}
                    onPress={() => handleLaunchFeature(f)}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View
                        style={[
                          styles.cardIconWrap,
                          { backgroundColor: iconBg },
                        ]}
                      >
                        <AnimatedFeatureIcon
                          featureId={f.id}
                          icon={f.icon}
                          size={20}
                          color={f.color}
                          index={idx}
                        />
                      </View>
                      {f.badge && (
                        <View
                          style={[
                            styles.badgeWrap,
                            {
                              backgroundColor: isDark
                                ? `${f.color}30`
                                : `${f.color}15`,
                            },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: f.color }]}>
                            {f.badge}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[styles.featureCardTitle, { color: modalText }]}
                      numberOfLines={1}
                    >
                      {f.name}
                    </Text>
                    <Text
                      style={[styles.featureCardDesc, { color: modalSub }]}
                      numberOfLines={2}
                    >
                      {f.description || f.subtitle}
                    </Text>

                    <View style={styles.cardFooter}>
                      <Text style={[styles.launchText, { color: f.color }]}>
                        Open Feature →
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Universal I Need This Modal */}
      <INeedThisModal
        visible={showNeedModal}
        onClose={() => setShowNeedModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    marginHorizontal: 16,
  },
  scrollContent: {
    // paddingHorizontal: 12,
    gap: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemWrapper: {
    alignItems: "center",
    width: 68,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  modalSheet: {
    maxHeight: "85%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 16,
    ...Platform.select({
      web: { boxShadow: "0 -8px 24px rgba(0,0,0,0.2)" },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  categoryTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryTabText: {
    fontSize: 11.5,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  featureCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 2,
    justifyContent: "space-between",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrap: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  featureCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  featureCardDesc: {
    fontSize: 11.5,
    lineHeight: 15,
    marginBottom: 8,
  },
  cardFooter: {
    marginTop: "auto",
    paddingTop: 4,
  },
  launchText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
});
