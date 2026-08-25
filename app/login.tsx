// @ts-nocheck
import { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "@/context/AuthContext";
import { signInWithGoogle } from "@/services/googleAuth";
import { router } from "expo-router";
import { ApiService } from "@/services/api";
import { useStyles } from "@/hooks/useStyles";
import { LightTheme, DarkTheme, Theme } from "@/theme";

import { WalkingCoffeeMascot } from "@/components/WalkingCoffeeMascot";

const C = {
  purple: "#7C3AED",
  purpleSoft: "#EDE7FE",
  ink: "#0F0A24",
  sub: "#6B6484",
  pink: "#FDE7EE",
  pinkInk: "#E85A7A",
  green: "#E7F4EC",
  greenInk: "#2E9E6A",
  card: "#FFFFFF",
  bgTop: "#F7EFF8",
  bgMid: "#FBE9E3",
  bgBot: "#F3EEFB",
};

const HERO_URI =
  "https://project--85afbc99-c3ff-405c-ba35-4948b5ecedc8.lovable.app/__l5e/assets-v1/94f1f95e-a09d-4a8c-b2e2-ca3d63139fea/junto-hero.jpg";
const HERO_ASPECT = 852 / 369;

const LOGIN_ILLUSTRATION = require("@/assets/login-illustration.png");
const WALKING_ICON = require("@/assets/walking.png");
const COFFEE_ICON = require("@/assets/coffee.png");
const TICKET_ICON = require("@/assets/ticket.png");
const BAG_ICON = require("@/assets/bag.png");

type FloatingBadgeProps = {
  style?: any;
  iconBg: string;
  imageSource?: any;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subTitle: string;
  delay?: number;
  duration?: number;
  distance?: number;
  s: any;
};

function FloatingBadge({
  style,
  iconBg,
  imageSource,
  iconName,
  iconColor,
  title,
  subTitle,
  delay = 0,
  duration = 3000,
  distance = 8,
  s,
}: FloatingBadgeProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    const timer = setTimeout(() => {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -distance,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== "web",
          }),
        ]),
      );
      anim.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (anim) anim.stop();
    };
  }, [delay, duration, distance, translateY]);

  return (
    <Animated.View
      style={[
        s.floatingBadge,
        style,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[s.badgeIconWrapper, { backgroundColor: iconBg }]}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={s.badgeIconImage}
            resizeMode="contain"
          />
        ) : (
          <Ionicons name={iconName!} size={18} color={iconColor} />
        )}
      </View>
      <View style={s.badgeTextWrapper}>
        <Text style={s.badgeTitle}>{title}</Text>
        <Text style={s.badgeSubTitle}>{subTitle}</Text>
      </View>
    </Animated.View>
  );
}

type FeatureProps = {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  title: string;
  sub: string;
  s: ReturnType<typeof createStyles>;
};
const Feature = ({ icon, tint, bg, title, sub, s }: FeatureProps) => (
  <View style={s.feat}>
    <View style={[s.featIcon, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={22} color={tint} />
    </View>
    <Text style={s.featTitle}>{title}</Text>
    <Text style={s.featSub}>{sub}</Text>
  </View>
);

type TrustProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  s: ReturnType<typeof createStyles>;
};
const Trust = ({ icon, title, sub, s }: TrustProps) => (
  <View style={s.trust}>
    <Ionicons name={icon} size={22} color={C.purple} />
    <Text style={s.trustTitle}>{title}</Text>
    <Text style={s.trustSub}>{sub}</Text>
  </View>
);

export default function Login() {
  const s = useMemo(() => createStyles(LightTheme), []);

  const { width } = useWindowDimensions();
  const wide = width >= 720;
  const pad = Math.min(28, Math.max(18, width * 0.05));
  const { login } = useAuthContext();

  const [loading, setLoading] = useState(false);

  const ctabuttonWidth = Math.min(420, width - 48);
  const headingSize = Math.max(26, Math.min(42, width * 0.075));

  async function handleLogin() {
    if (loading) return;
    try {
      setLoading(true);
      const googleUser = await signInWithGoogle();
      if (!googleUser) return;

      // googleUser.credential -> for web

      const data = await ApiService.post("/api/auth/google", {
        idToken:
          Platform.OS === "web" ? googleUser.credential : googleUser.idToken,
      });

      const userObj = {
        id:
          data?.user?.id ||
          (Platform.OS === "web" ? data.user?.id : googleUser.user.id),
        name:
          data?.user?.name ||
          (Platform.OS === "web" ? data.user?.name : googleUser.user?.name) ||
          "",
        email:
          data?.user?.email ||
          (Platform.OS === "web" ? data.user?.email : googleUser.user?.email) ||
          "",
        avatar:
          data?.user?.avatar ||
          (Platform.OS === "web"
            ? data.user?.avatar
            : googleUser.user?.photo) ||
          "",
        isVerified: true,
        rating: data?.user?.rating ?? 5,
        walletBalance: data?.user?.walletBalance ?? 0,
      };

      login(userObj, data?.accessToken);

      router.replace("/(tabs)");
    } catch (e) {
      console.error("Error during Google login", e);
      Alert.alert("Login Failed", String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: LightTheme.bg }}>
      <StatusBar barStyle="dark-content" />
      <View style={[StyleSheet.absoluteFill, s.bgGradient]} />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32, alignItems: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}>
            {/* Brand */}
            <View style={[s.brandRow, { paddingHorizontal: pad }]}>
              <View style={s.logo}>
                {/* <Ionicons name="people" size={26} color="#fff" /> */}
                <Image
                  source={require("@/assets/icon.png")}
                  style={{
                    width: 60,
                    height: 54,
                    borderRadius: 16,
                  }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ marginLeft: 12, flexShrink: 1 }}>
                <Text style={s.brand}>JUNTO</Text>
                <Text style={s.tag}>Let's do life together 💜</Text>
              </View>
            </View>

            {/* Headline */}
            <View style={{ marginTop: 22, paddingHorizontal: pad }}>
              <Text
                style={[
                  s.h1,
                  {
                    fontSize: headingSize,
                    lineHeight: headingSize * 1.2,
                  },
                ]}
              >
                Never be <Text style={s.h1Accent}>alone.</Text>
              </Text>

              <Text
                style={[
                  s.h1,
                  {
                    fontSize: headingSize,
                    lineHeight: headingSize * 1.2,
                  },
                ]}
              >
                Great moments
              </Text>

              <Text
                style={[
                  s.h1Script,
                  {
                    fontSize: headingSize,
                    lineHeight: headingSize * 1.25,
                  },
                ]}
              >
                are better together. 💜
              </Text>
              <Text style={s.lede}>
                Find your people for any activity.{"\n"}Share, connect & create
                memories.
              </Text>
            </View>

            {/* Animated Walking Coffee Bag Mascot */}
            {/* <WalkingCoffeeMascot scale={1.1} label="Walking for Coffee! ☕" /> */}

            {/* Hero Illustration with Animated Floating Badges */}
            <View style={s.hero}>
              <Image
                source={LOGIN_ILLUSTRATION}
                style={s.heroImg}
                resizeMode="cover"
              />

              {/* Floating Badge 1: Walking Buddy (Top Left) */}
              <FloatingBadge
                s={s}
                style={{ top: "6%", left: "3%" }}
                iconBg="#EEF2FF"
                imageSource={WALKING_ICON}
                iconName="walk"
                iconColor="#6366F1"
                title="Walking"
                subTitle="Buddy"
                delay={0}
                duration={3200}
                distance={8}
              />

              {/* Floating Badge 2: Coffee Buddy (Top Right) */}
              <FloatingBadge
                s={s}
                style={{ top: "6%", right: "3%" }}
                iconBg="#FEE2E2"
                imageSource={COFFEE_ICON}
                iconName="cafe"
                iconColor="#EF4444"
                title="Coffee"
                subTitle="Buddy"
                delay={500}
                duration={3600}
                distance={10}
              />

              {/* Floating Badge 3: Movie Tickets (Bottom Left) */}
              <FloatingBadge
                s={s}
                style={{ bottom: "18%", left: "3%" }}
                iconBg="#F3E8FF"
                imageSource={TICKET_ICON}
                iconName="ticket"
                iconColor="#8B5CF6"
                title="Movie"
                subTitle="Tickets"
                delay={1000}
                duration={3400}
                distance={7}
              />

              {/* Floating Badge 4: Lost & Found (Bottom Right) */}
              <FloatingBadge
                s={s}
                style={{ bottom: "18%", right: "3%" }}
                iconBg="#DCFCE7"
                imageSource={BAG_ICON}
                iconName="briefcase"
                iconColor="#10B981"
                title="Lost &"
                subTitle="Found"
                delay={1500}
                duration={3000}
                distance={9}
              />
            </View>

            {/* Pill sits under the hero with clean spacing */}
            <View style={[s.heroPill, { marginHorizontal: pad }]}>
              <Text style={s.heroPillText}>
                Little plans. Real people. Big memories.
              </Text>
            </View>

            {/* Features */}
            <View
              style={[
                s.featRow,
                { paddingHorizontal: pad },
                wide && { gap: 16 },
              ]}
            >
              <Feature
                icon="ticket"
                tint={C.purple}
                bg={C.purpleSoft}
                title="Exchange tickets"
                sub={"Buy & Sell\n movie tickets"}
                s={s}
              />
              <Feature
                icon="people"
                tint={C.pinkInk}
                bg={C.pink}
                title="Find your buddy"
                sub={"For walks, coffee,\ngym & more"}
                s={s}
              />
              <Feature
                icon="lock-closed"
                tint={C.greenInk}
                bg={C.green}
                title="Lost & Found"
                sub={"Help others.\nGet help."}
                s={s}
              />
            </View>

            {/* Google CTA */}
            <TouchableOpacity
              activeOpacity={0.7}
              // style={s.cta}
              style={[
                s.cta,
                {
                  width: ctabuttonWidth,
                  alignSelf: "center",
                },
              ]}
              onPress={handleLogin}
            >
              <Image
                source={require("@/assets/google.png")}
                style={s.googleIcon}
              />
              <Text style={s.ctaText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Social proof */}
            <View style={[s.proof, { paddingHorizontal: pad }]}>
              <View style={s.avatars}>
                {["1027", "1005", "1011"].map((id, i) => (
                  <Image
                    key={id}
                    source={{ uri: `https://i.pravatar.cc/80?img=${20 + i}` }}
                    style={[
                      s.avatar,
                      { marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i },
                    ]}
                  />
                ))}
              </View>
              {/* <Text style={s.proofText}>Loved by 50K+ users 💜</Text> */}
              <Text style={s.proofText}>
                💜 People are closer than you think
              </Text>
            </View>

            {/* Trust */}
            <View style={[s.trustRow, { paddingHorizontal: pad }]}>
              <Trust
                s={s}
                icon="shield-checkmark-outline"
                title="Verified"
                sub={"Real people,\nreal connections"}
              />
              <Trust
                s={s}
                icon="heart-outline"
                title="Safe & respectful"
                sub={"We keep our\ncommunity safe"}
              />
              <Trust
                s={s}
                icon="location-outline"
                title="Nearby"
                sub={"Connect with people\naround you"}
              />
              <Trust
                s={s}
                icon="lock-closed-outline"
                title="Private chats"
                sub={"Your conversations\nstay private"}
              />
            </View>

            {loading && (
              <View style={s.loadingOverlay} pointerEvents="auto">
                <View style={s.loadingCard}>
                  <ActivityIndicator size="large" color={C.primary} />

                  <Text style={s.loadingText}>Signing you in...</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createShadow = (C: Theme) =>
  Platform.select({
    ios: {
      shadowColor: C.black,
      shadowOpacity: C.bg === DarkTheme.bg ? 0.35 : 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    android: {
      elevation: C.bg === DarkTheme.bg ? 2 : 4,
    },
    default: {},
  });

const shadow = Platform.select({
  ios: {
    shadowColor: "#3B0A6B",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  android: { elevation: 4 },
  default: {},
});

export const createStyles = (C: Theme) => {
  const shadow = createShadow(C);
  return StyleSheet.create({
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    },
    loadingCard: {
      width: 180,
      paddingVertical: 24,
      paddingHorizontal: 20,

      backgroundColor: C.card,
      borderRadius: 20,

      borderWidth: 1,
      borderColor: C.border,

      alignItems: "center",

      ...shadow,
    },

    loadingText: {
      marginTop: 14,
      fontSize: 18,
      fontWeight: "700",
      color: C.text,
    },

    brandRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
    bgGradient: Platform.select({
      web: {
        backgroundImage: `linear-gradient(160deg, ${C.bg} 0%, ${C.bg2} 100%)`,
      },
      default: {
        backgroundColor: C.bg,
      },
    }) as any,
    logo: {
      width: 54,
      height: 54,
      borderRadius: 16,
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
      ...shadow,
    },

    brand: {
      fontSize: 26,
      fontWeight: "900",
      color: C.primary,
      letterSpacing: 1,
    },

    tag: {
      color: C.sub,
      marginTop: 2,
    },

    h1: {
      fontWeight: "900",
      color: C.text,
    },

    h1Script: {
      color: C.primary,
      fontStyle: "italic",
      fontWeight: "700",
      textDecorationLine: "underline",
      fontFamily: Platform.select({
        ios: "Snell Roundhand",
        android: "cursive",
        web: '"Dancing Script", "Snell Roundhand", cursive',
        default: "System",
      }),
    },
    h1Accent: {
      color: C.primary,
      textDecorationLine: "underline",
      fontStyle: "italic",
      fontFamily: Platform.select({
        ios: "Snell Roundhand",
        android: "cursive",
        web: '"Dancing Script", "Snell Roundhand", -webkit-body',
        default: "System",
      }),
    },
    lede: { color: C.sub, marginTop: 8, fontSize: 15, lineHeight: 22 },

    hero: {
      marginTop: 10,
      width: "100%",
      aspectRatio: 1.8,
      borderRadius: 20,
      position: "relative",
      overflow: "visible",
    },
    heroImg: {
      width: "100%",
      height: "100%",
      borderRadius: 20,
    },
    floatingBadge: {
      position: "absolute",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.9)",
      shadowColor: "#0F0A24",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 10,
      elevation: 6,
      zIndex: 20,
    },
    badgeIconWrapper: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 6,
    },
    badgeIconImage: {
      width: 20,
      height: 20,
    },
    badgeTextWrapper: {
      justifyContent: "center",
    },
    badgeTitle: {
      fontSize: 11,
      fontWeight: "800",
      color: "#0F172A",
      lineHeight: 13,
    },
    badgeSubTitle: {
      fontSize: 11,
      fontWeight: "800",
      color: "#0F172A",
      lineHeight: 13,
    },
    heroPill: {
      marginTop: -20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 999,
      alignItems: "center",
      zIndex: 25,
      ...shadow,
    },

    heroPillText: {
      color: C.primary,
      fontStyle: "italic",
      fontWeight: "700",
    },

    featRow: { flexDirection: "row", gap: 10, marginTop: 20 },
    feat: {
      flex: 1,
      backgroundColor: C.card,
      borderRadius: 22,
      padding: 10,
      borderWidth: 1,
      borderColor: C.border,
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 155,
      ...shadow,
    },

    featIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      justifyContent: "center",
      alignItems: "center",
      // marginBottom: 14,
    },

    featTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: C.text,
      textAlign: "center",
    },

    featSub: {
      fontSize: 12,
      color: C.sub,
      textAlign: "center",
      lineHeight: 18,
      marginTop: 6,
    },

    cta: {
      marginTop: 26,

      height: 52,
      backgroundColor: C.card,

      borderRadius: 18,

      borderWidth: 2,
      borderColor: C.primarySoft,

      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 18,

      ...shadow,
    },
    googleIcon: {
      width: 22,
      height: 22,
    },

    ctaText: {
      flex: 1,
      textAlign: "center",
      fontSize: 18,
      fontWeight: "700",
      color: C.text,
    },
    proof: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 18,
      gap: 12,
    },
    avatars: { flexDirection: "row" },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: C.bg,
    },
    proofText: { color: C.sub, fontWeight: "500" },

    trustRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 22,
      justifyContent: "space-between",
      rowGap: 18,
    },
    trust: { width: "23%", minWidth: 72, alignItems: "center" },
    trustTitle: {
      fontWeight: "800",
      color: C.text,
      fontSize: 12,
      marginTop: 6,
      textAlign: "center",
    },
    trustSub: {
      color: C.sub,
      fontSize: 10,
      textAlign: "center",
      marginTop: 2,
      lineHeight: 13,
    },
  });
};
