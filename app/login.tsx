// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   TouchableOpacity,
//   Alert,
//   ScrollView,
//   Dimensions,
// } from "react-native";
// import { router } from "expo-router";
// import {
//   SafeAreaView,
//   useSafeAreaInsets,
// } from "react-native-safe-area-context";

// import { useAuthContext } from "@/context/AuthContext";
// import { signInWithGoogle } from "@/services/googleAuth";
// import { useSharedValue } from "react-native-reanimated";
// import FloatingChip from "@/components/FloatingChips";

// const { width, height } = Dimensions.get("window");

// const isSmall = height < 750;
// const isTablet = width > 700;

// const headingSize = isTablet ? 46 : isSmall ? 32 : 40;
// const subtitleSize = isTablet ? 22 : isSmall ? 16 : 18;
// const illustrationHeight = isTablet ? 360 : Math.min(height * 0.28, 300);

// export default function LoginScreen() {
//   const insets = useSafeAreaInsets();

//   const { login } = useAuthContext();

//   const walkY = useSharedValue(0);
//   async function handleLogin() {
//     try {
//       const googleUser = await signInWithGoogle();

//       if (!googleUser) return;

//       console.log("Google User", googleUser);

//       // TODO:
//       // Send googleUser.idToken to backend
//       // POST /api/auth/google

//       const response = await fetch("/api/auth/google", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           idToken: googleUser.idToken,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to authenticate with backend");
//       }

//       const data = await response.json();

//       console.log("Backend Response", data);

//       login({
//         id: googleUser.user.id,
//         name: googleUser.user.name ?? "",
//         email: googleUser.user.email,
//         avatar: googleUser.user.photo ?? "",
//         isVerified: true,
//         rating: 0,
//         walletBalance: 0,
//       });

//       router.replace("/(tabs)");
//     } catch (e) {
//       console.error("Error during Google login", e);
//       Alert.alert("Login Failed", String(e));
//     }
//   }

//   return (
//     <SafeAreaView
//       style={{ flex: 1, backgroundColor: "#F8F8FF" }}
//       edges={["top", "bottom"]}
//     >
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{
//           flexGrow: 1,
//           paddingTop: insets.top,
//           paddingBottom: insets.bottom + 24,
//         }}
//       >
//         <View style={styles.wrapper}>
//           {/* Header */}

//           <View style={styles.header}>
//             <Image source={require("../assets/logo.png")} style={styles.logo} />

//             <Text style={styles.title}>JUNTO</Text>
//           </View>

//           {/* Heading */}

//           <View style={styles.textContainer}>
//             <Text
//               style={[
//                 styles.heading,
//                 {
//                   fontSize: headingSize,
//                 },
//               ]}
//             >
//               Good people.
//               {"\n"}
//               Great company. 💜
//             </Text>

//             <Text
//               style={[
//                 styles.subtitle,
//                 {
//                   fontSize: subtitleSize,
//                 },
//               ]}
//             >
//               Find buddies, exchange tickets,
//               {"\n"}
//               meet new people and help each other.
//             </Text>
//           </View>

//           {/* Hero */}

//           <View style={styles.heroContainer}>
//             <FloatingChip
//               style={[styles.chip, styles.walkChip]}
//               delay={0}
//               distance={10}
//             >
//               <Image
//                 source={require("../assets/walking.png")}
//                 style={styles.chipIcon}
//               />
//               <Text style={styles.chipText}>Walking Buddy</Text>
//             </FloatingChip>

//             <FloatingChip
//               style={[styles.chip, styles.coffeeChip]}
//               delay={500}
//               distance={10}
//             >
//               <Image
//                 source={require("../assets/coffee.png")}
//                 style={styles.chipIcon}
//               />
//               <Text style={styles.chipText}>Coffee Buddy</Text>
//             </FloatingChip>

//             <Image
//               source={require("../assets/login-illustration.png")}
//               resizeMode="contain"
//               style={{
//                 width: "100%",
//                 height: illustrationHeight,
//               }}
//             />

//             <FloatingChip
//               style={[styles.chip, styles.ticketChip]}
//               delay={1000}
//               distance={10}
//             >
//               <Image
//                 source={require("../assets/ticket.png")}
//                 style={styles.chipIcon}
//               />
//               <Text style={styles.chipText}>Movie Tickets</Text>
//             </FloatingChip>

//             <FloatingChip
//               style={[styles.chip, styles.bagChip]}
//               delay={1500}
//               distance={10}
//             >
//               <Image
//                 source={require("../assets/bag.png")}
//                 style={styles.chipIcon}
//               />
//               <Text style={styles.chipText}>Lost & Found</Text>
//             </FloatingChip>
//           </View>

//           {/* Bottom Card */}

//           <View style={styles.bottomCard}>
//             <Text style={styles.startTitle}>Let's get you started 👋</Text>

//             <Text style={styles.startSubtitle}>
//               Join the community in seconds.
//             </Text>

//             <TouchableOpacity style={styles.googleButton} onPress={handleLogin}>
//               <Image
//                 source={require("../assets/google.png")}
//                 style={styles.googleIcon}
//               />

//               <Text style={styles.googleText}>Continue with Google</Text>
//             </TouchableOpacity>

//             {/* <View style={styles.separator}>
//               <View style={styles.line} />
//               <Text style={styles.or}>or</Text>
//               <View style={styles.line} />
//             </View>

//             <TouchableOpacity style={styles.emailButton}>
//               <Text style={styles.emailText}>Continue with Email</Text>
//             </TouchableOpacity>

//             <Text style={styles.terms}>
//               By continuing you agree to our{" "}
//               <Text style={styles.link}>Terms of Service</Text> and{" "}
//               <Text style={styles.link}>Privacy Policy</Text>
//             </Text> */}
//           </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   wrapper: {
//     flex: 1,
//     width: "100%",
//     maxWidth: 430,
//     alignSelf: "center",
//     backgroundColor: "#FAFAFF",
//   },

//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 22,
//     paddingTop: 8,
//   },

//   logo: {
//     width: 50,
//     height: 50,
//     resizeMode: "contain",
//   },

//   title: {
//     marginLeft: 10,
//     fontSize: 34,
//     fontWeight: "800",
//     color: "#5E3BEE",
//     letterSpacing: 0.5,
//   },

//   textContainer: {
//     paddingHorizontal: 22,
//     marginTop: 18,
//   },

//   heading: {
//     fontWeight: "800",
//     color: "#1E2340",
//     lineHeight: 46,
//   },

//   subtitle: {
//     color: "#6F7489",
//     marginTop: 10,
//     lineHeight: 26,
//   },

//   heroContainer: {
//     position: "relative",
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 18,
//     paddingHorizontal: 12,
//   },

//   chip: {
//     position: "absolute",
//     backgroundColor: "#FFFFFF",
//     flexDirection: "row",
//     alignItems: "center",

//     paddingHorizontal: 12,
//     paddingVertical: 8,

//     borderRadius: 22,

//     borderWidth: 1,
//     borderColor: "#ECECEC",

//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.08,
//     shadowRadius: 10,
//     elevation: 5,

//     zIndex: 10,
//   },

//   chipIcon: {
//     width: 18,
//     height: 18,
//     resizeMode: "contain",
//     marginRight: 6,
//   },

//   chipText: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#1E2340",
//   },

//   walkChip: {
//     left: "6%",
//     top: "8%",
//   },

//   coffeeChip: {
//     right: "6%",
//     top: "8%",
//   },

//   ticketChip: {
//     left: "10%",
//     bottom: "10%",
//   },

//   bagChip: {
//     right: "10%",
//     bottom: "10%",
//   },

//   bottomCard: {
//     backgroundColor: "#FFFFFF",

//     marginTop: 12,

//     borderTopLeftRadius: 34,
//     borderTopRightRadius: 34,

//     paddingHorizontal: 24,
//     paddingTop: 24,
//     paddingBottom: 26,

//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: -3,
//     },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 12,
//   },

//   startTitle: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#1E2340",
//     textAlign: "center",
//   },

//   startSubtitle: {
//     fontSize: 15,
//     color: "#707070",
//     textAlign: "center",
//     marginTop: 8,
//     marginBottom: 22,
//   },

//   googleButton: {
//     height: 58,

//     borderRadius: 18,

//     backgroundColor: "#FFFFFF",

//     borderWidth: 1,
//     borderColor: "#DADCE0",

//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",

//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.06,
//     shadowRadius: 6,
//     elevation: 2,
//   },

//   googleIcon: {
//     width: 22,
//     height: 22,
//     resizeMode: "contain",
//     marginRight: 12,
//   },

//   googleText: {
//     fontSize: 17,
//     fontWeight: "700",
//     color: "#1E2340",
//   },

//   separator: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 22,
//   },

//   line: {
//     flex: 1,
//     height: 1,
//     backgroundColor: "#E4E4E4",
//   },

//   or: {
//     marginHorizontal: 14,
//     color: "#999",
//     fontSize: 14,
//     fontWeight: "500",
//   },

//   emailButton: {
//     height: 58,
//     borderRadius: 18,
//     backgroundColor: "#5E3BEE",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   emailText: {
//     color: "#FFFFFF",
//     fontWeight: "700",
//     fontSize: 17,
//   },

//   terms: {
//     marginTop: 20,
//     fontSize: 12,
//     lineHeight: 20,
//     color: "#777",
//     textAlign: "center",
//   },

//   link: {
//     color: "#5E3BEE",
//     fontWeight: "600",
//   },
// });
//
/**
 * Login.tsx — "Junto" onboarding / sign-in screen
 * Expo SDK 54 · React 19 · React Native · TypeScript
 *
 * One-time install:
 *   npx expo install expo-linear-gradient react-native-svg @expo/vector-icons react-native-safe-area-context
 *
 * Assumes your app root is already wrapped in <SafeAreaProvider> (default in
 * Expo Router / expo-template-default). Drop this file in and render <Login />.
 */
// import { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Pressable,
//   Image,
//   useWindowDimensions,
//   StatusBar,
//   Platform,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import { scale, verticalScale, moderateScale } from "react-native-size-matters";

// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { useAuthContext } from "@/context/AuthContext";
// import { signInWithGoogle } from "@/services/googleAuth";
// import { router } from "expo-router";

// const C = {
//   purple: "#7C3AED",
//   purpleSoft: "#EDE7FE",
//   ink: "#0F0A24",
//   sub: "#6B6484",
//   pink: "#FDE7EE",
//   pinkInk: "#E85A7A",
//   green: "#E7F4EC",
//   greenInk: "#2E9E6A",
//   card: "#FFFFFF",
//   bgTop: "#F7EFF8",
//   bgMid: "#FBE9E3",
//   bgBot: "#F3EEFB",
// };

// const HERO_URI =
//   "https://project--85afbc99-c3ff-405c-ba35-4948b5ecedc8.lovable.app/__l5e/assets-v1/94f1f95e-a09d-4a8c-b2e2-ca3d63139fea/junto-hero.jpg";
// const HERO_ASPECT = 852 / 369;

// type FeatureProps = {
//   icon: keyof typeof Ionicons.glyphMap;
//   tint: string;
//   bg: string;
//   title: string;
//   sub: string;
// };
// const Feature = ({ icon, tint, bg, title, sub }: FeatureProps) => (
//   <View style={s.feat}>
//     <View style={[s.featIcon, { backgroundColor: bg }]}>
//       <Ionicons name={icon} size={moderateScale(22)} color={tint} />
//     </View>
//     <Text style={s.featTitle}>{title}</Text>
//     <Text style={s.featSub}>{sub}</Text>
//   </View>
// );

// type TrustProps = {
//   icon: keyof typeof Ionicons.glyphMap;
//   title: string;
//   sub: string;
// };
// const Trust = ({ icon, title, sub }: TrustProps) => (
//   <View style={s.trust}>
//     <Ionicons name={icon} size={moderateScale(22)} color={C.purple} />
//     <Text style={s.trustTitle}>{title}</Text>
//     <Text style={s.trustSub}>{sub}</Text>
//   </View>
// );

// export default function Login() {
//   const { width } = useWindowDimensions();
//   const wide = width >= 720;
//   const pad = Math.min(28, Math.max(18, width * 0.05));

//   const heroHeight = width * 0.43;

//   const [loading, setLoading] = useState(false);

//   const { login } = useAuthContext();

//   async function handleLogin() {
//     if (loading) return; // Prevent multiple logins
//     try {
//       setLoading(true);

//       await new Promise((resolve) => setTimeout(resolve, 10000)); // Optional: simulate network delay
//       const googleUser = await signInWithGoogle();

//       if (!googleUser) return;

//       console.log("Google User", googleUser);

//       // TODO:
//       // Send googleUser.idToken to backend
//       // POST /api/auth/google

//       const response = await fetch("/api/auth/google", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           idToken: googleUser.idToken,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to authenticate with backend");
//       }

//       const data = await response.json();

//       console.log("Backend Response", data);

//       login({
//         // authToken: googleUser.accessToken,
//         id: googleUser.user.id,
//         name: googleUser.user.name ?? "",
//         email: googleUser.user.email,
//         avatar: googleUser.user.photo ?? "",
//         isVerified: true,
//         rating: 0,
//         walletBalance: 0,
//       });

//       router.replace("/(tabs)");
//     } catch (e) {
//       console.error("Error during Google login", e);
//       Alert.alert("Login Failed", String(e));
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <View style={{ flex: 1, backgroundColor: C.bgTop }}>
//       <StatusBar barStyle="dark-content" />
//       <View style={[StyleSheet.absoluteFill, s.bgGradient]} />
//       <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
//         <ScrollView
//           contentContainerStyle={{ paddingBottom: 32, alignItems: "center" }}
//           showsVerticalScrollIndicator={false}
//         >
//           <View style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}>
//             {/* Brand */}
//             <View style={[s.brandRow, { paddingHorizontal: pad }]}>
//               <View style={s.logo}>
//                 <Ionicons name="people" size={26} color="#fff" />
//               </View>
//               <View style={{ marginLeft: 12, flexShrink: 1 }}>
//                 <Text style={s.brand}>JUNTO</Text>
//                 <Text style={s.tag}>Let's do life together 💜</Text>
//               </View>
//             </View>

//             {/* Headline */}
//             <View style={{ marginTop: 22, paddingHorizontal: pad }}>
//               <Text style={[s.h1, wide && { fontSize: 44 }]}>
//                 Never be <Text style={s.h1Accent}>alone.</Text>
//               </Text>
//               <Text style={[s.h1, wide && { fontSize: 44 }]}>
//                 Great moments
//               </Text>
//               <Text style={[s.h1Script, wide && { fontSize: 40 }]}>
//                 are better together. 💜
//               </Text>
//               <Text style={s.lede}>
//                 Find your people for any activity.{"\n"}Share, connect & create
//                 memories.
//               </Text>
//             </View>

//             {/* Hero - full image, no overlays clipping it */}
//             <View style={s.hero}>
//               <Image
//                 source={{ uri: HERO_URI }}
//                 style={s.heroImg}
//                 resizeMode="contain"
//               />
//             </View>

//             {/* Pill sits just under the hero, slightly overlapping */}
//             <View style={[s.heroPill, { marginHorizontal: pad }]}>
//               <Text style={s.heroPillText}>
//                 Little plans. Real people. Big memories.
//               </Text>
//             </View>

//             {/* Features */}
//             <View
//               style={[
//                 s.featRow,
//                 { paddingHorizontal: pad },
//                 wide && { gap: 16 },
//               ]}
//             >
//               <Feature
//                 icon="ticket"
//                 tint={C.purple}
//                 bg={C.purpleSoft}
//                 title="Exchange tickets"
//                 sub={"Get the best deals\non movie tickets"}
//               />
//               <Feature
//                 icon="people"
//                 tint={C.pinkInk}
//                 bg={C.pink}
//                 title="Find your buddy"
//                 sub={"For walks, coffee,\ngym & more"}
//               />
//               <Feature
//                 icon="lock-closed"
//                 tint={C.greenInk}
//                 bg={C.green}
//                 title="Lost & Found"
//                 sub={"Help others.\nGet help."}
//               />
//             </View>

//             {/* Google CTA */}
//             <Pressable
//               style={({ pressed }) => [
//                 s.cta,
//                 { marginHorizontal: pad },
//                 pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
//               ]}
//               onPress={handleLogin}
//               android_ripple={{ color: "#EDE7FE" }}
//             >
//               <Image
//                 source={{
//                   uri: "https://developers.google.com/identity/images/g-logo.png",
//                 }}
//                 style={{ width: 22, height: 22 }}
//               />
//               <Text style={s.ctaText}>Continue with Google</Text>
//               <Ionicons name="chevron-forward" size={20} color={C.ink} />
//             </Pressable>

//             {/* Social proof */}
//             <View style={[s.proof, { paddingHorizontal: pad }]}>
//               <View style={s.avatars}>
//                 {["1027", "1005", "1011"].map((id, i) => (
//                   <Image
//                     key={id}
//                     source={{ uri: `https://i.pravatar.cc/80?img=${20 + i}` }}
//                     style={[
//                       s.avatar,
//                       { marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i },
//                     ]}
//                   />
//                 ))}
//               </View>
//               <Text style={s.proofText}>Loved by 50K+ users 💜</Text>
//             </View>

//             {/* Trust */}
//             <View style={[s.trustRow, { paddingHorizontal: pad }]}>
//               <Trust
//                 icon="shield-checkmark-outline"
//                 title="Verified"
//                 sub={"Real people,\nreal connections"}
//               />
//               <Trust
//                 icon="heart-outline"
//                 title="Safe & respectful"
//                 sub={"We keep our\ncommunity safe"}
//               />
//               <Trust
//                 icon="location-outline"
//                 title="Nearby"
//                 sub={"Connect with people\naround you"}
//               />
//               <Trust
//                 icon="lock-closed-outline"
//                 title="Private chats"
//                 sub={"Your conversations\nstay private"}
//               />
//             </View>

//             {loading && (
//               <View style={s.loadingOverlay}>
//                 <ActivityIndicator size="large" color="#7C3AED" />
//                 <Text style={s.loadingText}>Signing you in...</Text>
//               </View>
//             )}
//           </View>
//         </ScrollView>
//       </SafeAreaView>
//     </View>
//   );
// }

// const shadow = Platform.select({
//   ios: {
//     shadowColor: "#3B0A6B",
//     shadowOpacity: 0.08,
//     shadowRadius: 20,
//     shadowOffset: { width: 0, height: 10 },
//   },
//   android: { elevation: 4 },
//   default: {},
// });

// const s = StyleSheet.create({
//   loadingOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(255,255,255,0.75)", // translucent white
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 999,
//   },

//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#222",
//   },
//   brandRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
//   bgGradient: Platform.select({
//     web: {
//       // @ts-ignore - web-only CSS
//       backgroundImage: `linear-gradient(160deg, ${C.bgTop} 0%, ${C.bgMid} 55%, ${C.bgBot} 100%)`,
//     },
//     default: { backgroundColor: C.bgMid },
//   }) as any,
//   logo: {
//     width: scale(54),
//     height: scale(54),
//     borderRadius: moderateScale(16),
//     backgroundColor: C.purple,
//     alignItems: "center",
//     justifyContent: "center",
//     ...shadow,
//   },
//   brand: {
//     fontSize: moderateScale(26),
//     fontWeight: "900",
//     color: C.purple,
//     letterSpacing: 1,
//   },
//   tag: { color: C.sub, marginTop: 2 },

//   h1: {
//     fontSize: moderateScale(34),
//     lineHeight: moderateScale(42),
//     fontWeight: "900",
//     color: C.ink,
//   },
//   h1Accent: {
//     color: C.purple,
//     textDecorationLine: "underline",
//     fontStyle: "italic",
//     fontFamily: Platform.select({
//       ios: "Snell Roundhand",
//       android: "cursive",
//       web: '"Dancing Script", "Snell Roundhand", cursive',
//       default: "System",
//     }),
//   },
//   h1Script: {
//     fontSize: 34,
//     color: C.purple,
//     marginTop: 6,
//     fontStyle: "italic",
//     fontWeight: "700",
//     textDecorationLine: "underline",
//     lineHeight: 44,
//     fontFamily: Platform.select({
//       ios: "Snell Roundhand",
//       android: "cursive",
//       web: '"Dancing Script", "Snell Roundhand", cursive',
//       default: "System",
//     }),
//   },

//   lede: {
//     fontSize: moderateScale(15),
//     lineHeight: moderateScale(22),
//     color: C.sub,
//     marginTop: 14,
//   },

//   hero: {
//     marginTop: 20,
//     width: "100%",
//     aspectRatio: HERO_ASPECT,
//     backgroundColor: "transparent",
//   },
//   heroImg: { width: "100%", height: "100%" },
//   heroPill: {
//     marginTop: -26,
//     backgroundColor: "#fff",
//     paddingVertical: 12,
//     paddingHorizontal: 18,
//     borderRadius: 999,
//     alignItems: "center",
//     ...shadow,
//   },

//   heroPillText: { color: C.purple, fontStyle: "italic", fontWeight: "600" },

//   featRow: { flexDirection: "row", gap: 10, marginTop: 20 },

//   feat: {
//     flex: 1,
//     backgroundColor: C.card,
//     borderRadius: moderateScale(18),
//     padding: moderateScale(14),
//     alignItems: "center",
//     ...shadow,
//   },
//   featIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 10,
//   },
//   featTitle: {
//     fontWeight: "800",
//     color: C.ink,
//     fontSize: 13,
//     textAlign: "center",
//   },
//   featSub: {
//     color: C.sub,
//     fontSize: 11,
//     textAlign: "center",
//     marginTop: 4,
//     lineHeight: 15,
//   },

//   cta: {
//     marginTop: 22,
//     backgroundColor: "#fff",
//     borderRadius: 999,
//     paddingVertical: moderateScale(16),
//     paddingHorizontal: moderateScale(20),
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 14,
//     borderWidth: 1,
//     borderColor: C.purpleSoft,
//     ...shadow,
//   },
//   ctaText: {
//     flex: 1,
//     textAlign: "center",
//     fontSize: 17,
//     fontWeight: "700",
//     color: C.ink,
//   },

//   proof: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 18,
//     gap: 12,
//   },
//   avatars: { flexDirection: "row" },
//   avatar: {
//     width: scale(28),
//     height: scale(28),
//     borderRadius: scale(14),
//     borderWidth: 2,
//     borderColor: "#fff",
//   },
//   proofText: { color: C.sub, fontWeight: "500" },

//   trustRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     marginTop: 22,
//     justifyContent: "space-between",
//     rowGap: 18,
//   },
//   trust: { width: "23%", minWidth: 72, alignItems: "center" },
//   trustTitle: {
//     fontWeight: "800",
//     color: C.ink,
//     fontSize: 12,
//     marginTop: 6,
//     textAlign: "center",
//   },
//   trustSub: {
//     color: C.sub,
//     fontSize: 10,
//     textAlign: "center",
//     marginTop: 2,
//     lineHeight: 13,
//   },
// });

// -- GAIS generated ------------
// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "@/context/AuthContext";
import { signInWithGoogle } from "@/services/googleAuth";
import { router } from "expo-router";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import { ApiService } from "@/services/api";

import HERO_URI from "@/assets/hero.jpg";

const C = {
  purple: "#6366F1", // Indigo / Royal Purple
  purpleSoft: "#EEF2FF",
  purpleDeep: "#4F46E5",
  ink: "#0F0A24",
  sub: "#64748B",
  bg: "#FAFAFE", // Super soft elegant cream-off-white
};

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthContext();

  async function handleLogin() {
    if (loading) return;
    try {
      setLoading(true);
      const googleUser = await signInWithGoogle();
      if (!googleUser) return;

      // googleUser.credential -> for web

      const response = await ApiService.post("/api/auth/google", {
        idToken:
          Platform.OS === "web" ? googleUser.credential : googleUser.idToken,
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate with backend");
      }

      const data = await response.json();
      const userObj =
        Platform.OS === "web"
          ? {
              id: data.user.id,
              name: data.user.name ?? "",
              email: data.user.email,
              avatar: data.user.avatar ?? "",
              jwtToken: data.accessToken ?? "",
              isVerified: true,
              rating: 0,
              walletBalance: 0,
            }
          : {
              id: googleUser.user.id,
              name: googleUser.user.name ?? "",
              email: googleUser.user.email,
              avatar: googleUser.user.photo ?? "",
              jwtToken: data.accessToken ?? "",
              isVerified: true,
              rating: 0,
              walletBalance: 0,
            };

      login(userObj);

      router.replace("/(tabs)");
    } catch (e) {
      console.error("Error during Google login", e);
      Alert.alert("Login Failed", String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }} id="login-screen-root">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={s.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={s.container}>
            {/* Brand Header */}
            <View style={s.brandRow} id="brand-header">
              <View style={s.logo}>
                <Ionicons name="people" size={moderateScale(24)} color="#fff" />
              </View>
              <Text style={s.brand}>Junto</Text>
            </View>

            {/* Premium Interactive Headlines */}
            <View style={s.headlineContainer} id="headline-section">
              <Text style={s.h1}>Good people.</Text>
              <Text style={s.h1}>
                Great company. <Text style={s.purpleHeart}>💜</Text>
              </Text>
              <Text style={s.lede}>
                Find buddies, share moments,{"\n"}exchange and help each other.
              </Text>
            </View>

            {/* Premium Illustration Canvas with floating badge elements */}
            <View style={s.heroContainer} id="hero-banner-container">
              <Image source={HERO_URI} style={s.heroImg} resizeMode="cover" />

              {/* Floating Badge 1: Walking Buddy */}
              <View
                style={[s.floatingBadge, s.badgeLeft1]}
                id="badge-walking-buddy"
              >
                <View style={[s.badgeIconBg, { backgroundColor: "#EEF2FF" }]}>
                  <Ionicons
                    name="walk"
                    size={moderateScale(15)}
                    color="#4F46E5"
                  />
                </View>
                <Text style={s.badgeText}>Walking{"\n"}Buddy</Text>
              </View>

              {/* Floating Badge 2: Coffee Buddy */}
              <View
                style={[s.floatingBadge, s.badgeRight1]}
                id="badge-coffee-buddy"
              >
                <View style={[s.badgeIconBg, { backgroundColor: "#FFF5F5" }]}>
                  <Ionicons
                    name="cafe"
                    size={moderateScale(15)}
                    color="#EF4444"
                  />
                </View>
                <Text style={s.badgeText}>Coffee{"\n"}Buddy</Text>
              </View>

              {/* Floating Badge 3: Movie Tickets */}
              <View
                style={[s.floatingBadge, s.badgeLeft2]}
                id="badge-movie-tickets"
              >
                <View style={[s.badgeIconBg, { backgroundColor: "#F5F3FF" }]}>
                  <Ionicons
                    name="ticket"
                    size={moderateScale(15)}
                    color="#8B5CF6"
                  />
                </View>
                <Text style={s.badgeText}>Movie{"\n"}Tickets</Text>
              </View>

              {/* Floating Badge 4: Lost & Found */}
              <View
                style={[s.floatingBadge, s.badgeRight2]}
                id="badge-lost-found"
              >
                <View style={[s.badgeIconBg, { backgroundColor: "#ECFDF5" }]}>
                  <Ionicons
                    name="briefcase"
                    size={moderateScale(15)}
                    color="#10B981"
                  />
                </View>
                <Text style={s.badgeText}>Lost &{"\n"}Found</Text>
              </View>
            </View>

            {/* Bottom Form Sheet exactly like BuddyUp layout */}
            <View style={s.bottomCard} id="bottom-onboarding-card">
              <Text style={s.cardTitle}>Let's get you started 👋</Text>
              <Text style={s.cardSubtitle}>
                Join a community where good things happen.
              </Text>

              {/* Continue with Google button */}
              <Pressable
                id="google-signin-btn"
                onPress={handleLogin}
                style={({ pressed }) => [
                  {
                    width: "100%",
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                  },
                ]}
              >
                <View style={s.googleBtn}>
                  <Image
                    source={{
                      uri: "https://developers.google.com/identity/images/g-logo.png",
                    }}
                    style={s.googleIcon}
                  />
                  <Text style={s.googleBtnText}>Continue with Google</Text>
                </View>
              </Pressable>

              {/* Elegant social proof trusted by 10k+ users */}
              <View style={s.proof} id="social-proof">
                <View style={s.avatars}>
                  {["1027", "1005", "1011"].map((id, i) => (
                    <Image
                      key={id}
                      source={{ uri: `https://i.pravatar.cc/80?img=${20 + i}` }}
                      style={[
                        s.avatar,
                        { marginLeft: i === 0 ? 0 : scale(-8), zIndex: 3 - i },
                      ]}
                    />
                  ))}
                </View>
                <Text style={s.proofText}>Trusted by 10k+ users 💜</Text>
              </View>

              {/* Compliance Text */}
              <Text style={s.disclaimerText}>
                By continuing, you agree to our{" "}
                <Text style={s.linkText}>Terms of Service</Text> and{" "}
                <Text style={s.linkText}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Loading overlay */}
      {loading && (
        <View style={s.loadingOverlay} id="signing-in-overlay">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={s.loadingText}>Connecting to Junto...</Text>
        </View>
      )}
    </View>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#0F0A24",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 3 },
  default: {},
});

const s = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#FDFBFC", // soft cozy off-white
  },
  container: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#4F46E5",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(24),
    marginTop: verticalScale(16),
    gap: scale(10),
  },
  logo: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(14),
    backgroundColor: "#4F46E5", // Purple logo background
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  brand: {
    fontSize: moderateScale(26),
    fontWeight: "950",
    color: "#4F46E5",
    letterSpacing: -0.5,
  },

  headlineContainer: {
    marginTop: verticalScale(18),
    paddingHorizontal: scale(24),
  },
  h1: {
    fontSize: moderateScale(30),
    fontWeight: "950",
    color: "#0F0A24",
    lineHeight: moderateScale(36),
    letterSpacing: -0.5,
  },
  purpleHeart: {
    fontSize: moderateScale(28),
  },
  lede: {
    fontSize: moderateScale(13.5),
    color: "#64748B",
    fontWeight: "500",
    lineHeight: moderateScale(19),
    marginTop: verticalScale(10),
  },

  // Hero canvas with floating badges
  heroContainer: {
    width: "100%",
    aspectRatio: 1.25,
    backgroundColor: "transparent",
    marginTop: verticalScale(12),
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  heroImg: {
    width: "100%",
    height: "100%",
  },

  // Floating Badges Styling
  floatingBadge: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(18),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    borderWidth: 1.2,
    borderStyle: "solid",
    borderColor: "rgba(15, 10, 36, 0.06)",
    ...Platform.select({
      ios: {
        shadowColor: "#0F0A24",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
      default: {
        boxShadow: "0px 4px 10px rgba(15, 10, 36, 0.07)",
      },
    }),
  },
  badgeIconBg: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#0F0A24",
    lineHeight: moderateScale(13),
  },
  badgeLeft1: {
    top: "14%",
    left: "5%",
  },
  badgeRight1: {
    top: "16%",
    right: "5%",
  },
  badgeLeft2: {
    bottom: "22%",
    left: "4%",
  },
  badgeRight2: {
    bottom: "26%",
    right: "4%",
  },

  // Bottom Card Onboarding panel
  bottomCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(36),
    borderTopRightRadius: moderateScale(36),
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(24),
    marginTop: verticalScale(-25),
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(15,10,36,0.03)",
    ...Platform.select({
      ios: {
        shadowColor: "#0F0A24",
        shadowOpacity: 0.04,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -8 },
      },
      android: { elevation: 4 },
      default: {
        boxShadow: "0px -8px 24px rgba(15, 10, 36, 0.04)",
      },
    }),
  },
  cardTitle: {
    fontSize: moderateScale(18),
    fontWeight: "900",
    color: "#0F0A24",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
    marginTop: verticalScale(4),
    marginBottom: verticalScale(16),
  },

  // Buttons
  googleBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(24),
    borderWidth: 1.5,
    borderStyle: "solid",
    borderColor: "#E2E8F0",
    paddingVertical: verticalScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(12),
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#0F0A24",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
      default: {
        boxShadow: "0px 4px 12px rgba(15, 10, 36, 0.05)",
      },
    }),
  },
  googleIcon: {
    width: scale(20),
    height: scale(20),
  },
  googleBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "900",
    color: "#0F0A24",
  },

  // Social proof
  proof: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(16),
    gap: scale(8),
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  proofText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#64748B",
  },

  disclaimerText: {
    fontSize: moderateScale(10.5),
    color: "#94A3B8",
    textAlign: "center",
    marginTop: verticalScale(16),
    lineHeight: moderateScale(15),
    paddingHorizontal: scale(10),
  },
  linkText: {
    color: "#4F46E5",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
