// // @ts-nocheck
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Pressable,
//   ScrollView,
//   useWindowDimensions,
//   Platform,
//   TextInput,
//   TouchableOpacity,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { scale, verticalScale, moderateScale } from "react-native-size-matters";
// import { router } from "expo-router";

// // ─────────────────────────────────────────────────────────
// // THEME TYPE — match your existing Theme interface
// // ─────────────────────────────────────────────────────────
// interface Theme {
//   bg: string;
//   card: string;
//   text: string;
//   sub: string;
//   border: string;
//   primary: string;
//   inputBg: string;
// }

// // Light / dark fallbacks — swap with your actual theme hook
// const LIGHT: Theme = {
//   bg: "#FFFFFF",
//   card: "#F8FAFC",
//   text: "#0F0A24",
//   sub: "#64748B",
//   border: "#E2E8F0",
//   primary: "#7C3AED",
//   inputBg: "#F8FAFC",
// };

// const DARK: Theme = {
//   bg: "#0D0B1E",
//   card: "#160D3A",
//   text: "#FFFFFF",
//   sub: "#94A3B8",
//   border: "#2D2060",
//   primary: "#A78BFA",
//   inputBg: "#160D3A",
// };

// // ─────────────────────────────────────────────────────────
// // OPTIONS DATA
// // ─────────────────────────────────────────────────────────
// const OPTIONS = [
//   {
//     id: "day_mates",
//     title: "Find Day Mates",
//     description: "Meet people for cricket, lunch, coffee, or movies today.",
//     icon: "people-outline" as keyof typeof Ionicons.glyphMap,
//     cardBg: "#F0EEFF",
//     iconCircleBg: "#DDD6FE",
//     iconColor: "#6D28D9",
//     arrowBg: "#7C3AED",
//     decColor: "rgba(167,139,250,0.22)",
//   },
//   {
//     id: "sell_ticket",
//     title: "Sell Ticket",
//     description: "Sell last-minute extra tickets to people nearby securely.",
//     icon: "ticket-outline" as keyof typeof Ionicons.glyphMap,
//     cardBg: "#FFF7ED",
//     iconCircleBg: "#FDE68A",
//     iconColor: "#D97706",
//     arrowBg: "#F59E0B",
//     decColor: "rgba(251,191,36,0.22)",
//   },
//   {
//     id: "host_event",
//     title: "Host Event",
//     description: "Organize pub crawls, turf games, or community mixers.",
//     icon: "ribbon-outline" as keyof typeof Ionicons.glyphMap,
//     cardBg: "#FFF0F6",
//     iconCircleBg: "#FBCFE8",
//     iconColor: "#BE185D",
//     arrowBg: "#EC4899",
//     decColor: "rgba(244,114,182,0.22)",
//   },
//   {
//     id: "ask_nearby",
//     title: "Ask Something Nearby",
//     description: "Ask questions about crowds, entry-fees, or recommend bars.",
//     icon: "megaphone-outline" as keyof typeof Ionicons.glyphMap,
//     cardBg: "#EFF6FF",
//     iconCircleBg: "#BFDBFE",
//     iconColor: "#1D4ED8",
//     arrowBg: "#3B82F6",
//     decColor: "rgba(96,165,250,0.22)",
//   },
// ];

// // ─────────────────────────────────────────────────────────
// // STYLE FACTORY  (same pattern as your createStyles)
// // ─────────────────────────────────────────────────────────
// const GRID_GAP = scale(10);
// const GRID_H_PAD = scale(16);

// const createShadow = (C: Theme) =>
//   Platform.select({
//     ios: {
//       shadowColor: C.text,
//       shadowOpacity: 0.12,
//       shadowRadius: 18,
//       shadowOffset: { width: 0, height: -6 },
//     },
//     android: { elevation: 8 },
//     default: {},
//   });

// export const createStyles = (C: Theme) => {
//   const shadow = createShadow(C);

//   return StyleSheet.create({
//     // ── Layout ──────────────────────────────────────────
//     container: { flex: 1, justifyContent: "flex-end" },

//     backdrop: {
//       ...StyleSheet.absoluteFillObject,
//       backgroundColor: "rgba(15, 10, 36, 0.5)",
//       ...Platform.select({
//         web: {
//           backdropFilter: "blur(6px)",
//           WebkitBackdropFilter: "blur(6px)",
//         },
//       }),
//     },

//     sheet: {
//       backgroundColor: C.bg,
//       borderTopLeftRadius: moderateScale(36),
//       borderTopRightRadius: moderateScale(36),
//       paddingHorizontal: GRID_H_PAD,
//       paddingBottom: verticalScale(16),
//       ...shadow,
//     },

//     // ── Handle ──────────────────────────────────────────
//     dragHandle: {
//       width: scale(56),
//       height: verticalScale(5),
//       backgroundColor: C.border,
//       borderRadius: 999,
//       alignSelf: "center",
//       marginTop: verticalScale(12),
//     },

//     // ── Header ──────────────────────────────────────────
//     header: {
//       flexDirection: "row",
//       alignItems: "flex-start",
//       justifyContent: "space-between",
//       borderBottomWidth: 1,
//       borderBottomColor: C.border,
//       paddingVertical: verticalScale(14),
//     },
//     headerLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
//     headerTitle: {
//       fontWeight: "900",
//       color: C.text,
//       fontSize: moderateScale(16),
//       flex: 1,
//     },
//     headerTitleAccent: { color: "#7C3AED" },
//     headerSub: {
//       fontSize: moderateScale(12),
//       color: C.sub,
//       fontWeight: "500",
//       marginTop: verticalScale(2),
//     },
//     backBtn: {
//       width: scale(32),
//       height: scale(32),
//       borderRadius: scale(16),
//       backgroundColor: C.card,
//       alignItems: "center",
//       justifyContent: "center",
//       marginRight: scale(8),
//       marginTop: verticalScale(2),
//     },
//     closeBtn: {
//       width: scale(32),
//       height: scale(32),
//       borderRadius: scale(16),
//       backgroundColor: C.card,
//       alignItems: "center",
//       justifyContent: "center",
//       marginTop: verticalScale(2),
//     },

//     // ── 2×2 Grid ────────────────────────────────────────
//     gridWrapper: {
//       marginTop: verticalScale(14),
//       marginBottom: verticalScale(12),
//     },
//     gridRow: {
//       flexDirection: "row",
//       marginBottom: scale(8),
//     },
//     gridCard: {
//       flex: 1,
//       borderRadius: moderateScale(18),
//       padding: scale(10),
//       alignItems: "center",
//       justifyContent: "center",
//       minHeight: verticalScale(150),
//       overflow: "hidden",
//       marginHorizontal: scale(4),
//     },
//     dec1: {
//       position: "absolute",
//       width: scale(45),
//       height: scale(45),
//       borderRadius: 999,
//       top: -scale(12),
//       left: -scale(12),
//     },
//     dec2: {
//       position: "absolute",
//       width: scale(28),
//       height: scale(28),
//       borderRadius: 999,
//       bottom: scale(4),
//       right: -scale(8),
//     },
//     gridIconCircle: {
//       width: scale(50),
//       height: scale(50),
//       borderRadius: scale(25),
//       alignItems: "center",
//       justifyContent: "center",
//       marginBottom: verticalScale(8),
//     },
//     gridTitle: {
//       fontWeight: "700",
//       color: "#0F0A24",
//       fontSize: moderateScale(12),
//       textAlign: "center",
//       marginBottom: verticalScale(3),
//     },
//     gridDesc: {
//       color: "#64748B",
//       fontSize: moderateScale(9),
//       textAlign: "center",
//       lineHeight: moderateScale(12),
//       fontWeight: "500",
//       marginBottom: verticalScale(6),
//     },
//     gridArrow: {
//       width: scale(28),
//       height: scale(28),
//       borderRadius: scale(14),
//       alignItems: "center",
//       justifyContent: "center",
//     },

//     // ── Footer banner ────────────────────────────────────
//     footerBanner: {
//       flexDirection: "row",
//       alignItems: "center",
//       backgroundColor: C.card,
//       borderRadius: moderateScale(16),
//       padding: scale(14),
//       gap: scale(10),
//     },
//     footerIconWrap: {
//       width: scale(36),
//       height: scale(36),
//       borderRadius: scale(18),
//       backgroundColor: C.border,
//       alignItems: "center",
//       justifyContent: "center",
//     },
//     footerTitle: {
//       fontWeight: "800",
//       color: C.text,
//       fontSize: moderateScale(12.5),
//     },
//     footerSub: {
//       color: C.sub,
//       fontSize: moderateScale(11),
//       fontWeight: "500",
//       marginTop: 2,
//     },

//     // ── Shared form styles ───────────────────────────────
//     formScroll: { marginTop: verticalScale(8) },
//     formWrapper: { paddingVertical: verticalScale(8) },
//     sectionSubtitle: {
//       fontSize: moderateScale(13),
//       color: C.sub,
//       fontWeight: "600",
//       marginBottom: verticalScale(8),
//     },
//     label: {
//       fontSize: moderateScale(11.5),
//       fontWeight: "800",
//       color: C.sub,
//       textTransform: "uppercase",
//       letterSpacing: 0.5,
//       marginTop: verticalScale(14),
//       marginBottom: verticalScale(4),
//     },
//     input: {
//       backgroundColor: C.inputBg,
//       borderWidth: 1,
//       borderColor: C.border,
//       borderRadius: moderateScale(16),
//       paddingHorizontal: scale(16),
//       paddingVertical: verticalScale(12),
//       fontSize: moderateScale(14),
//       color: C.text,
//       fontWeight: "600",
//       marginTop: verticalScale(4),
//     },
//     inputMultiline: { height: verticalScale(80), textAlignVertical: "top" },
//     rowFields: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       width: "100%",
//     },
//     chipRow: {
//       flexDirection: "row",
//       flexWrap: "wrap",
//       gap: scale(8),
//       marginTop: verticalScale(6),
//     },
//     chip: {
//       paddingHorizontal: scale(14),
//       paddingVertical: verticalScale(8),
//       borderRadius: moderateScale(12),
//       borderWidth: 1,
//       borderColor: C.border,
//       backgroundColor: C.bg,
//     },
//     chipSelected: { borderColor: "#7C3AED", backgroundColor: "#EDE7FE" },
//     chipText: { fontSize: moderateScale(13), fontWeight: "600", color: C.sub },
//     chipTextSelected: { color: "#7C3AED", fontWeight: "700" },
//     counterRow: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       backgroundColor: C.inputBg,
//       paddingHorizontal: scale(16),
//       paddingVertical: verticalScale(12),
//       borderRadius: moderateScale(16),
//       borderWidth: 1,
//       borderColor: C.border,
//       marginTop: verticalScale(6),
//     },
//     counterLabel: {
//       fontSize: moderateScale(12.5),
//       color: C.sub,
//       fontWeight: "600",
//       flex: 1,
//       marginRight: scale(10),
//     },
//     counterControls: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: scale(14),
//     },
//     counterBtn: {
//       width: scale(32),
//       height: scale(32),
//       borderRadius: moderateScale(10),
//       backgroundColor: C.border,
//       alignItems: "center",
//       justifyContent: "center",
//     },
//     counterBtnText: {
//       fontSize: moderateScale(18),
//       fontWeight: "bold",
//       color: C.text,
//     },
//     counterVal: {
//       fontSize: moderateScale(15),
//       fontWeight: "800",
//       color: C.text,
//       minWidth: scale(20),
//       textAlign: "center",
//     },
//     submitBtn: {
//       borderRadius: moderateScale(18),
//       paddingVertical: verticalScale(14),
//       alignItems: "center",
//       justifyContent: "center",
//       marginTop: verticalScale(24),
//       elevation: 4,
//     },
//     submitBtnText: {
//       color: "#FFFFFF",
//       fontSize: moderateScale(14),
//       fontWeight: "900",
//       letterSpacing: 0.5,
//     },
//   });
// };

// // Day Mates form is always dark — static stylesheet
// const dm = StyleSheet.create({
//   wrapper: { paddingTop: verticalScale(4), paddingBottom: verticalScale(8) },
//   bannerCard: {
//     flexDirection: "row",
//     backgroundColor: "#160D3A",
//     borderRadius: moderateScale(20),
//     padding: moderateScale(16),
//     marginBottom: verticalScale(14),
//     overflow: "hidden",
//     alignItems: "center",
//   },
//   bannerLeft: { flex: 1.6, paddingRight: scale(8) },
//   bannerBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(124, 58, 237, 0.35)",
//     paddingHorizontal: scale(10),
//     paddingVertical: verticalScale(4),
//     borderRadius: 999,
//     alignSelf: "flex-start",
//     marginBottom: verticalScale(8),
//   },
//   bannerBadgeText: {
//     color: "#C4B5FD",
//     fontSize: moderateScale(10),
//     fontWeight: "700",
//   },
//   bannerTitle: {
//     color: "#FFFFFF",
//     fontSize: moderateScale(15),
//     fontWeight: "900",
//     lineHeight: moderateScale(21),
//     marginBottom: verticalScale(6),
//   },
//   bannerTitleAccent: { color: "#A78BFA" },
//   bannerDesc: {
//     color: "rgba(255,255,255,0.55)",
//     fontSize: moderateScale(11),
//     lineHeight: moderateScale(15),
//     fontWeight: "500",
//   },
//   bannerRight: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     position: "relative",
//   },
//   heartBubble: {
//     position: "absolute",
//     top: -verticalScale(4),
//     right: scale(4),
//     backgroundColor: "#4C1D95",
//     borderRadius: 999,
//     width: scale(26),
//     height: scale(26),
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   searchBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#160D3A",
//     borderRadius: moderateScale(14),
//     paddingHorizontal: scale(14),
//     paddingVertical: verticalScale(12),
//     marginBottom: verticalScale(16),
//     gap: scale(10),
//   },
//   searchInput: {
//     flex: 1,
//     color: "#FFFFFF",
//     fontSize: moderateScale(13),
//     fontWeight: "500",
//     padding: 0,
//   },
//   sectionLabel: {
//     color: "#FFFFFF",
//     fontSize: moderateScale(14),
//     fontWeight: "700",
//     marginBottom: verticalScale(10),
//   },
//   activityScroll: {
//     paddingBottom: verticalScale(2),
//     marginBottom: verticalScale(16),
//     gap: scale(8),
//     flexDirection: "row",
//   },
//   activityChip: {
//     paddingHorizontal: scale(14),
//     paddingVertical: verticalScale(9),
//     borderRadius: moderateScale(12),
//     borderWidth: 1.5,
//     borderColor: "#2D2060",
//     backgroundColor: "#160D3A",
//   },
//   activityChipSelected: { borderColor: "#7C3AED" },
//   activityChipText: {
//     color: "#64748B",
//     fontSize: moderateScale(13),
//     fontWeight: "600",
//   },
//   activityChipTextSelected: { color: "#FFFFFF" },
//   timeRow: {
//     flexDirection: "row",
//     gap: scale(8),
//     marginBottom: verticalScale(16),
//   },
//   timeChip: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: verticalScale(11),
//     borderRadius: moderateScale(14),
//     backgroundColor: "#160D3A",
//     borderWidth: 1.5,
//     borderColor: "#2D2060",
//     gap: verticalScale(3),
//   },
//   timeChipSelected: { backgroundColor: "#3B1FAB", borderColor: "#7C3AED" },
//   timeChipIcon: { fontSize: moderateScale(14) },
//   timeChipText: {
//     color: "#64748B",
//     fontSize: moderateScale(10.5),
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   timeChipTextSelected: { color: "#FFFFFF", fontWeight: "700" },
//   counterCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#160D3A",
//     borderRadius: moderateScale(16),
//     paddingHorizontal: scale(16),
//     paddingVertical: verticalScale(14),
//     marginBottom: verticalScale(16),
//   },
//   counterCenter: { flex: 1, alignItems: "center" },
//   counterNum: {
//     color: "#FFFFFF",
//     fontSize: moderateScale(22),
//     fontWeight: "900",
//     lineHeight: moderateScale(26),
//   },
//   counterSub: {
//     color: "#4B5563",
//     fontSize: moderateScale(11),
//     fontWeight: "600",
//   },
//   counterBtns: { flexDirection: "row", gap: scale(10) },
//   counterBtn: {
//     width: scale(36),
//     height: scale(36),
//     borderRadius: moderateScale(10),
//     backgroundColor: "#2D2060",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   counterBtnText: {
//     color: "#FFFFFF",
//     fontSize: moderateScale(20),
//     fontWeight: "700",
//     lineHeight: moderateScale(22),
//   },
//   locationCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#160D3A",
//     borderRadius: moderateScale(16),
//     paddingHorizontal: scale(16),
//     paddingVertical: verticalScale(14),
//     marginBottom: verticalScale(16),
//     gap: scale(10),
//   },
//   locationText: {
//     flex: 1,
//     color: "#FFFFFF",
//     fontSize: moderateScale(14),
//     fontWeight: "600",
//   },
//   locationRight: { flexDirection: "row", alignItems: "center", gap: scale(2) },
//   changeText: {
//     color: "#94A3B8",
//     fontSize: moderateScale(13),
//     fontWeight: "500",
//   },
//   trustRow: {
//     flexDirection: "row",
//     backgroundColor: "#160D3A",
//     borderRadius: moderateScale(16),
//     paddingVertical: verticalScale(14),
//     paddingHorizontal: scale(8),
//     marginBottom: verticalScale(22),
//   },
//   trustItem: {
//     flex: 1,
//     alignItems: "center",
//     gap: verticalScale(4),
//     paddingHorizontal: scale(4),
//   },
//   trustTitle: {
//     color: "#FFFFFF",
//     fontSize: moderateScale(11),
//     fontWeight: "700",
//     textAlign: "center",
//   },
//   trustDesc: {
//     color: "#4B5563",
//     fontSize: moderateScale(9.5),
//     textAlign: "center",
//     lineHeight: moderateScale(13),
//     fontWeight: "500",
//   },
// });

// // ─────────────────────────────────────────────────────────
// // COMPONENT
// // ─────────────────────────────────────────────────────────
// interface CreateModalProps {
//   onClose?: () => void;
//   onSelectOption?: (optionId: string) => void;
//   theme?: "light" | "dark"; // pass from your theme context
// }

// export default function CreateModal({
//   onClose,
//   onSelectOption,
//   theme = "light",
// }: CreateModalProps) {
//   const { height, width: screenW } = useWindowDimensions();

//   // Swap theme token object — replace with your own hook/context
//   const C = theme === "dark" ? DARK : LIGHT;
//   const s = createStyles(C);

//   // Remove cardW — use flex: 0.5 instead (more reliable than pixel calculations)

//   const [selectedOption, setSelectedOption] = useState<string | null>(null);

//   // Day Mates form state
//   const [dayMateActivity, setDayMateActivity] = useState("Cricket");
//   const [dayMateTime, setDayMateTime] = useState("Today Evening");
//   const [dayMateMatesNeeded, setDayMateMatesNeeded] = useState(2);
//   const [searchActivity, setSearchActivity] = useState("");
//   const [dayMateLocation] = useState("Bandra, Mumbai");

//   // Sell Ticket form state
//   const [ticketEventName, setTicketEventName] = useState("");
//   const [ticketOrigPrice, setTicketOrigPrice] = useState("");
//   const [ticketSellPrice, setTicketSellPrice] = useState("");
//   const [ticketQty, setTicketQty] = useState(1);

//   // Host Event form state
//   const [hostEventName, setHostEventName] = useState("");
//   const [hostLocation, setHostLocation] = useState("");
//   const [hostType, setHostType] = useState("Turf Game");
//   const [hostMaxPeople, setHostMaxPeople] = useState(15);

//   // Ask Nearby form state
//   const [askQuestion, setAskQuestion] = useState("");
//   const [askTopic, setAskTopic] = useState("Crowds");
//   const [askUrgency, setAskUrgency] = useState("Normal");

//   const isDayMates = selectedOption === "day_mates";

//   const handleOptionClick = (id: string) => setSelectedOption(id);
//   const handleBack = () => setSelectedOption(null);
//   const handleFormSubmit = () => {
//     if (onSelectOption && selectedOption) onSelectOption(selectedOption);
//     setSelectedOption(null);
//     onClose?.();
//   };
//   const handleModalClose = () => {
//     if (router.canGoBack()) router.back();
//     else router.replace("/(tabs)");
//   };

//   // ── Form content ──────────────────────────────────────
//   const renderFormContent = () => {
//     switch (selectedOption) {
//       case "day_mates":
//         return (
//           <View style={dm.wrapper}>
//             {/* Banner */}
//             <View style={dm.bannerCard}>
//               <View style={dm.bannerLeft}>
//                 <View style={dm.bannerBadge}>
//                   <Ionicons
//                     name="people"
//                     size={moderateScale(11)}
//                     color="#C4B5FD"
//                   />
//                   <Text style={dm.bannerBadgeText}>
//                     {"  "}Make plans. Meet people.
//                   </Text>
//                 </View>
//                 <Text style={dm.bannerTitle}>
//                   {"Let's plan something\n"}
//                   <Text style={dm.bannerTitleAccent}>amazing</Text>
//                   {" today! ✨"}
//                 </Text>
//                 <Text style={dm.bannerDesc}>
//                   Tell us what you're in the mood for and we'll help you find
//                   the perfect company.
//                 </Text>
//               </View>
//               <View style={dm.bannerRight}>
//                 <Text
//                   style={{ fontSize: moderateScale(52), textAlign: "center" }}
//                 >
//                   🧑‍🤝‍🧑
//                 </Text>
//                 <View style={dm.heartBubble}>
//                   <Text style={{ fontSize: moderateScale(13) }}>💜</Text>
//                 </View>
//               </View>
//             </View>

//             {/* Search */}
//             <View style={dm.searchBar}>
//               <Ionicons
//                 name="search-outline"
//                 size={moderateScale(16)}
//                 color="#64748B"
//               />
//               <TextInput
//                 style={dm.searchInput}
//                 placeholder="Search activities..."
//                 placeholderTextColor="#4B5563"
//                 value={searchActivity}
//                 onChangeText={setSearchActivity}
//               />
//             </View>

//             {/* Activity chips */}
//             <Text style={dm.sectionLabel}>What do you want to do?</Text>
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={dm.activityScroll}
//             >
//               {[
//                 { label: "Cricket", emoji: "🏏" },
//                 { label: "Coffee", emoji: "☕" },
//                 { label: "Lunch", emoji: "🍕" },
//                 { label: "Movie", emoji: "🎬" },
//                 { label: "Drinks", emoji: "🍺" },
//               ].map(({ label, emoji }) => (
//                 <TouchableOpacity
//                   key={label}
//                   activeOpacity={0.8}
//                   style={[
//                     dm.activityChip,
//                     dayMateActivity === label && dm.activityChipSelected,
//                   ]}
//                   onPress={() => setDayMateActivity(label)}
//                 >
//                   <Text
//                     style={[
//                       dm.activityChipText,
//                       dayMateActivity === label && dm.activityChipTextSelected,
//                     ]}
//                   >
//                     {label} {emoji}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>

//             {/* Time chips */}
//             <Text style={dm.sectionLabel}>When would you like to meet?</Text>
//             <View style={dm.timeRow}>
//               {[
//                 { label: "Today Afternoon", icon: "☀️" },
//                 { label: "Today Evening", icon: "🌆" },
//                 { label: "Tonight", icon: "🌙" },
//               ].map(({ label, icon }) => (
//                 <TouchableOpacity
//                   key={label}
//                   activeOpacity={0.8}
//                   style={[
//                     dm.timeChip,
//                     dayMateTime === label && dm.timeChipSelected,
//                   ]}
//                   onPress={() => setDayMateTime(label)}
//                 >
//                   <Text style={dm.timeChipIcon}>{icon}</Text>
//                   <Text
//                     style={[
//                       dm.timeChipText,
//                       dayMateTime === label && dm.timeChipTextSelected,
//                     ]}
//                   >
//                     {label}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             {/* Mates counter */}
//             <Text style={dm.sectionLabel}>How many mates?</Text>
//             <View style={dm.counterCard}>
//               <Ionicons
//                 name="people-outline"
//                 size={moderateScale(28)}
//                 color="#7C3AED"
//                 style={{ marginRight: scale(10) }}
//               />
//               <View style={dm.counterCenter}>
//                 <Text style={dm.counterNum}>{dayMateMatesNeeded}</Text>
//                 <Text style={dm.counterSub}>people</Text>
//               </View>
//               <View style={dm.counterBtns}>
//                 <TouchableOpacity
//                   activeOpacity={0.7}
//                   style={dm.counterBtn}
//                   onPress={() =>
//                     setDayMateMatesNeeded(Math.max(1, dayMateMatesNeeded - 1))
//                   }
//                 >
//                   <Text style={dm.counterBtnText}>−</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   activeOpacity={0.7}
//                   style={dm.counterBtn}
//                   onPress={() =>
//                     setDayMateMatesNeeded(Math.min(10, dayMateMatesNeeded + 1))
//                   }
//                 >
//                   <Text style={dm.counterBtnText}>+</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* Location */}
//             <Text style={dm.sectionLabel}>Near my location</Text>
//             <TouchableOpacity activeOpacity={0.8} style={dm.locationCard}>
//               <Ionicons
//                 name="location-outline"
//                 size={moderateScale(18)}
//                 color="#94A3B8"
//               />
//               <Text style={dm.locationText}>{dayMateLocation}</Text>
//               <View style={dm.locationRight}>
//                 <Text style={dm.changeText}>Change</Text>
//                 <Ionicons
//                   name="chevron-forward"
//                   size={moderateScale(14)}
//                   color="#94A3B8"
//                 />
//               </View>
//             </TouchableOpacity>

//             {/* Trust row */}
//             <View style={dm.trustRow}>
//               {[
//                 {
//                   icon: "shield-checkmark-outline" as const,
//                   color: "#10B981",
//                   title: "Safe & Trusted",
//                   desc: "Your safety is our priority",
//                 },
//                 {
//                   icon: "people-outline" as const,
//                   color: "#3B82F6",
//                   title: "Real People",
//                   desc: "Connect with verified users",
//                 },
//                 {
//                   icon: "flash-outline" as const,
//                   color: "#F59E0B",
//                   title: "Quick Connect",
//                   desc: "Find mates near you",
//                 },
//               ].map(({ icon, color, title, desc }) => (
//                 <View key={title} style={dm.trustItem}>
//                   <Ionicons
//                     name={icon}
//                     size={moderateScale(20)}
//                     color={color}
//                   />
//                   <Text style={dm.trustTitle}>{title}</Text>
//                   <Text style={dm.trustDesc}>{desc}</Text>
//                 </View>
//               ))}
//             </View>

//             <TouchableOpacity
//               activeOpacity={0.9}
//               onPress={handleFormSubmit}
//               style={[s.submitBtn, { backgroundColor: "#7C3AED" }]}
//             >
//               <Text style={s.submitBtnText}>Find My Day Mates 👥</Text>
//             </TouchableOpacity>
//           </View>
//         );

//       case "sell_ticket":
//         return (
//           <View style={s.formWrapper}>
//             <Text style={s.sectionSubtitle}>
//               Enter ticket pricing & availability details
//             </Text>
//             <Text style={s.label}>Event / Movie Name</Text>
//             <TextInput
//               style={s.input}
//               placeholder="e.g., Coldplay Music of the Spheres"
//               placeholderTextColor="#94A3B8"
//               value={ticketEventName}
//               onChangeText={setTicketEventName}
//             />
//             <View style={s.rowFields}>
//               <View style={{ flex: 1, marginRight: scale(10) }}>
//                 <Text style={s.label}>Original Price (₹)</Text>
//                 <TextInput
//                   style={s.input}
//                   placeholder="e.g., 5000"
//                   keyboardType="numeric"
//                   placeholderTextColor="#94A3B8"
//                   value={ticketOrigPrice}
//                   onChangeText={setTicketOrigPrice}
//                 />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Text style={s.label}>Selling Price (₹)</Text>
//                 <TextInput
//                   style={s.input}
//                   placeholder="e.g., 3500"
//                   keyboardType="numeric"
//                   placeholderTextColor="#94A3B8"
//                   value={ticketSellPrice}
//                   onChangeText={setTicketSellPrice}
//                 />
//               </View>
//             </View>
//             <Text style={s.label}>Ticket Quantity</Text>
//             <View style={s.counterRow}>
//               <Text style={s.counterLabel}>How many extra tickets?</Text>
//               <View style={s.counterControls}>
//                 <TouchableOpacity
//                   activeOpacity={0.7}
//                   style={s.counterBtn}
//                   onPress={() => setTicketQty(Math.max(1, ticketQty - 1))}
//                 >
//                   <Text style={s.counterBtnText}>-</Text>
//                 </TouchableOpacity>
//                 <Text style={s.counterVal}>{ticketQty}</Text>
//                 <TouchableOpacity
//                   activeOpacity={0.7}
//                   style={s.counterBtn}
//                   onPress={() => setTicketQty(Math.min(8, ticketQty + 1))}
//                 >
//                   <Text style={s.counterBtnText}>+</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//             <TouchableOpacity
//               activeOpacity={0.9}
//               style={[s.submitBtn, { backgroundColor: "#F59E0B" }]}
//               onPress={handleFormSubmit}
//               disabled={!ticketEventName}
//             >
//               <Text style={s.submitBtnText}>Post Ticket Deal 🎟️</Text>
//             </TouchableOpacity>
//           </View>
//         );

//       case "host_event":
//         return (
//           <View style={s.formWrapper}>
//             <Text style={s.sectionSubtitle}>
//               Host social mixers, games or community events
//             </Text>
//             <Text style={s.label}>Event Title</Text>
//             <TextInput
//               style={s.input}
//               placeholder="e.g., Koramangala Friday Pub Crawl"
//               placeholderTextColor="#94A3B8"
//               value={hostEventName}
//               onChangeText={setHostEventName}
//             />
//             <Text style={s.label}>Venue / Spot Location</Text>
//             <TextInput
//               style={s.input}
//               placeholder="e.g., Astro Arena Turf, Toit"
//               placeholderTextColor="#94A3B8"
//               value={hostLocation}
//               onChangeText={setHostLocation}
//             />
//             <Text style={s.label}>Event Category</Text>
//             <View style={s.chipRow}>
//               {[
//                 "Turf Game ⚽",
//                 "Pub Crawl 🍻",
//                 "Social Mixer 🎨",
//                 "Board Games ♟️",
//               ].map((type) => (
//                 <TouchableOpacity
//                   key={type}
//                   activeOpacity={0.8}
//                   style={[s.chip, hostType === type && s.chipSelected]}
//                   onPress={() => setHostType(type)}
//                 >
//                   <Text
//                     style={[
//                       s.chipText,
//                       hostType === type && s.chipTextSelected,
//                     ]}
//                   >
//                     {type}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//             <Text style={s.label}>Max Attendees</Text>
//             <View style={s.counterRow}>
//               <Text style={s.counterLabel}>Maximum attendees invited?</Text>
//               <View style={s.counterControls}>
//                 <TouchableOpacity
//                   activeOpacity={0.7}
//                   style={s.counterBtn}
//                   onPress={() =>
//                     setHostMaxPeople(Math.max(5, hostMaxPeople - 5))
//                   }
//                 >
//                   <Text style={s.counterBtnText}>-</Text>
//                 </TouchableOpacity>
//                 <Text style={s.counterVal}>{hostMaxPeople}</Text>
//                 <TouchableOpacity
//                   activeOpacity={0.7}
//                   style={s.counterBtn}
//                   onPress={() =>
//                     setHostMaxPeople(Math.min(100, hostMaxPeople + 5))
//                   }
//                 >
//                   <Text style={s.counterBtnText}>+</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//             <TouchableOpacity
//               activeOpacity={0.9}
//               style={[s.submitBtn, { backgroundColor: "#EC4899" }]}
//               onPress={handleFormSubmit}
//               disabled={!hostEventName || !hostLocation}
//             >
//               <Text style={s.submitBtnText}>Launch Community Event 🎉</Text>
//             </TouchableOpacity>
//           </View>
//         );

//       case "ask_nearby":
//         return (
//           <View style={s.formWrapper}>
//             <Text style={s.sectionSubtitle}>
//               Broadcast a localized question to active users
//             </Text>
//             <Text style={s.label}>Your Question</Text>
//             <TextInput
//               style={[s.input, s.inputMultiline]}
//               multiline
//               numberOfLines={3}
//               placeholder="e.g., Is the entry fee at Toit active tonight?"
//               placeholderTextColor="#94A3B8"
//               value={askQuestion}
//               onChangeText={setAskQuestion}
//             />
//             <Text style={s.label}>Select Topic</Text>
//             <View style={s.chipRow}>
//               {[
//                 "Crowds 🔥",
//                 "Entry Fees 💸",
//                 "Bars & Food 🍺",
//                 "Parking Info 🚗",
//               ].map((topic) => (
//                 <TouchableOpacity
//                   key={topic}
//                   activeOpacity={0.8}
//                   style={[s.chip, askTopic === topic && s.chipSelected]}
//                   onPress={() => setAskTopic(topic)}
//                 >
//                   <Text
//                     style={[
//                       s.chipText,
//                       askTopic === topic && s.chipTextSelected,
//                     ]}
//                   >
//                     {topic}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//             <Text style={s.label}>Urgency Level</Text>
//             <View style={s.chipRow}>
//               {["Normal Info", "Urgent Broadcast ⚡"].map((urg) => (
//                 <TouchableOpacity
//                   key={urg}
//                   activeOpacity={0.8}
//                   style={[s.chip, askUrgency === urg && s.chipSelected]}
//                   onPress={() => setAskUrgency(urg)}
//                 >
//                   <Text
//                     style={[
//                       s.chipText,
//                       askUrgency === urg && s.chipTextSelected,
//                     ]}
//                   >
//                     {urg}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//             <TouchableOpacity
//               activeOpacity={0.9}
//               style={[s.submitBtn, { backgroundColor: "#3B82F6" }]}
//               onPress={handleFormSubmit}
//               disabled={!askQuestion}
//             >
//               <Text style={s.submitBtnText}>Broadcast Question 📢</Text>
//             </TouchableOpacity>
//           </View>
//         );

//       default:
//         return null;
//     }
//   };

//   // ── RENDER ────────────────────────────────────────────
//   return (
//     <View style={s.container}>
//       {/* Backdrop */}
//       <Pressable style={s.backdrop} onPress={handleModalClose} />

//       {/* Sheet — day_mates overrides bg to dark */}
//       <View
//         style={[
//           s.sheet,
//           { maxHeight: height * 0.95 },
//           isDayMates && { backgroundColor: "#0D0B1E" },
//         ]}
//       >
//         {/* Drag handle */}
//         <View
//           style={[s.dragHandle, isDayMates && { backgroundColor: "#2D2060" }]}
//         />

//         {/* Header */}
//         <View
//           style={[s.header, isDayMates && { borderBottomColor: "#1A1040" }]}
//         >
//           <View style={s.headerLeft}>
//             {selectedOption && (
//               <Pressable
//                 onPress={handleBack}
//                 style={[
//                   s.backBtn,
//                   isDayMates && { backgroundColor: "#1A1040" },
//                 ]}
//                 hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
//               >
//                 <Ionicons
//                   name="arrow-back"
//                   size={moderateScale(20)}
//                   color={isDayMates ? "#FFFFFF" : C.text}
//                 />
//               </Pressable>
//             )}
//             <View style={{ flex: 1 }}>
//               {!selectedOption ? (
//                 <>
//                   <Text
//                     style={[s.headerTitle, isDayMates && { color: "#FFFFFF" }]}
//                   >
//                     What would <Text style={s.headerTitleAccent}>you</Text> like
//                     to do today? 🎉
//                   </Text>
//                   <Text
//                     style={[s.headerSub, isDayMates && { color: "#94A3B8" }]}
//                   >
//                     Choose an option to get started
//                   </Text>
//                 </>
//               ) : (
//                 <Text
//                   style={[
//                     s.headerTitle,
//                     { marginLeft: scale(8) },
//                     isDayMates && { color: "#FFFFFF" },
//                   ]}
//                 >
//                   {OPTIONS.find((o) => o.id === selectedOption)?.title}
//                 </Text>
//               )}
//             </View>
//           </View>
//           <Pressable
//             onPress={handleModalClose}
//             style={[s.closeBtn, isDayMates && { backgroundColor: "#1A1040" }]}
//             hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
//           >
//             <Ionicons
//               name="close"
//               size={moderateScale(20)}
//               color={isDayMates ? "#94A3B8" : C.sub}
//             />
//           </Pressable>
//         </View>

//         {/* Options grid or Form */}
//         {!selectedOption ? (
//           <ScrollView
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={{ paddingBottom: verticalScale(16) }}
//           >
//             {/* 2×2 grid */}
//             <View style={s.gridWrapper}>
//               {/* Row 1 */}
//               <View style={s.gridRow}>
//                 <Pressable
//                   style={({ pressed }) => [
//                     s.gridCard,
//                     { backgroundColor: OPTIONS[0].cardBg },
//                     pressed && { opacity: 0.85 },
//                   ]}
//                   onPress={() => handleOptionClick(OPTIONS[0].id)}
//                 >
//                   <View
//                     style={[s.dec1, { backgroundColor: OPTIONS[0].decColor }]}
//                   />
//                   <View
//                     style={[s.dec2, { backgroundColor: OPTIONS[0].decColor }]}
//                   />
//                   <View
//                     style={[
//                       s.gridIconCircle,
//                       { backgroundColor: OPTIONS[0].iconCircleBg },
//                     ]}
//                   >
//                     <Ionicons
//                       name={OPTIONS[0].icon}
//                       size={moderateScale(22)}
//                       color={OPTIONS[0].iconColor}
//                     />
//                   </View>
//                   <Text style={s.gridTitle}>{OPTIONS[0].title}</Text>
//                   <Text style={s.gridDesc} numberOfLines={2}>
//                     {OPTIONS[0].description}
//                   </Text>
//                   <View
//                     style={[
//                       s.gridArrow,
//                       { backgroundColor: OPTIONS[0].arrowBg },
//                     ]}
//                   >
//                     <Ionicons
//                       name="arrow-forward"
//                       size={moderateScale(12)}
//                       color="#fff"
//                     />
//                   </View>
//                 </Pressable>

//                 <Pressable
//                   style={({ pressed }) => [
//                     s.gridCard,
//                     { backgroundColor: OPTIONS[1].cardBg },
//                     pressed && { opacity: 0.85 },
//                   ]}
//                   onPress={() => handleOptionClick(OPTIONS[1].id)}
//                 >
//                   <View
//                     style={[s.dec1, { backgroundColor: OPTIONS[1].decColor }]}
//                   />
//                   <View
//                     style={[s.dec2, { backgroundColor: OPTIONS[1].decColor }]}
//                   />
//                   <View
//                     style={[
//                       s.gridIconCircle,
//                       { backgroundColor: OPTIONS[1].iconCircleBg },
//                     ]}
//                   >
//                     <Ionicons
//                       name={OPTIONS[1].icon}
//                       size={moderateScale(22)}
//                       color={OPTIONS[1].iconColor}
//                     />
//                   </View>
//                   <Text style={s.gridTitle}>{OPTIONS[1].title}</Text>
//                   <Text style={s.gridDesc} numberOfLines={2}>
//                     {OPTIONS[1].description}
//                   </Text>
//                   <View
//                     style={[
//                       s.gridArrow,
//                       { backgroundColor: OPTIONS[1].arrowBg },
//                     ]}
//                   >
//                     <Ionicons
//                       name="arrow-forward"
//                       size={moderateScale(12)}
//                       color="#fff"
//                     />
//                   </View>
//                 </Pressable>
//               </View>

//               {/* Row 2 */}
//               <View style={s.gridRow}>
//                 <Pressable
//                   style={({ pressed }) => [
//                     s.gridCard,
//                     { backgroundColor: OPTIONS[2].cardBg },
//                     pressed && { opacity: 0.85 },
//                   ]}
//                   onPress={() => handleOptionClick(OPTIONS[2].id)}
//                 >
//                   <View
//                     style={[s.dec1, { backgroundColor: OPTIONS[2].decColor }]}
//                   />
//                   <View
//                     style={[s.dec2, { backgroundColor: OPTIONS[2].decColor }]}
//                   />
//                   <View
//                     style={[
//                       s.gridIconCircle,
//                       { backgroundColor: OPTIONS[2].iconCircleBg },
//                     ]}
//                   >
//                     <Ionicons
//                       name={OPTIONS[2].icon}
//                       size={moderateScale(22)}
//                       color={OPTIONS[2].iconColor}
//                     />
//                   </View>
//                   <Text style={s.gridTitle}>{OPTIONS[2].title}</Text>
//                   <Text style={s.gridDesc} numberOfLines={2}>
//                     {OPTIONS[2].description}
//                   </Text>
//                   <View
//                     style={[
//                       s.gridArrow,
//                       { backgroundColor: OPTIONS[2].arrowBg },
//                     ]}
//                   >
//                     <Ionicons
//                       name="arrow-forward"
//                       size={moderateScale(12)}
//                       color="#fff"
//                     />
//                   </View>
//                 </Pressable>

//                 <Pressable
//                   style={({ pressed }) => [
//                     s.gridCard,
//                     { backgroundColor: OPTIONS[3].cardBg },
//                     pressed && { opacity: 0.85 },
//                   ]}
//                   onPress={() => handleOptionClick(OPTIONS[3].id)}
//                 >
//                   <View
//                     style={[s.dec1, { backgroundColor: OPTIONS[3].decColor }]}
//                   />
//                   <View
//                     style={[s.dec2, { backgroundColor: OPTIONS[3].decColor }]}
//                   />
//                   <View
//                     style={[
//                       s.gridIconCircle,
//                       { backgroundColor: OPTIONS[3].iconCircleBg },
//                     ]}
//                   >
//                     <Ionicons
//                       name={OPTIONS[3].icon}
//                       size={moderateScale(22)}
//                       color={OPTIONS[3].iconColor}
//                     />
//                   </View>
//                   <Text style={s.gridTitle}>{OPTIONS[3].title}</Text>
//                   <Text style={s.gridDesc} numberOfLines={2}>
//                     {OPTIONS[3].description}
//                   </Text>
//                   <View
//                     style={[
//                       s.gridArrow,
//                       { backgroundColor: OPTIONS[3].arrowBg },
//                     ]}
//                   >
//                     <Ionicons
//                       name="arrow-forward"
//                       size={moderateScale(12)}
//                       color="#fff"
//                     />
//                   </View>
//                 </Pressable>
//               </View>
//             </View>

//             {/* Footer banner */}
//             <View style={s.footerBanner}>
//               <View style={s.footerIconWrap}>
//                 <Text style={{ fontSize: moderateScale(16) }}>❤️</Text>
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Text style={s.footerTitle}>
//                   Good people. Good plans. Great days.
//                 </Text>
//                 <Text style={s.footerSub}>
//                   JUNTO makes every day better together. ✨
//                 </Text>
//               </View>
//             </View>
//           </ScrollView>
//         ) : (
//           <ScrollView
//             style={s.formScroll}
//             contentContainerStyle={{ paddingBottom: verticalScale(40) }}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             {renderFormContent()}
//           </ScrollView>
//         )}
//       </View>
//     </View>
//   );
// }
// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

/* ------------------------------------------------------------------ */
/*  Types & static data                                                */
/* ------------------------------------------------------------------ */

type OptionId = "day_mates" | "sell_ticket" | "host_event" | "ask_nearby";

type OptionDef = {
  id: OptionId;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  key: "dayMate" | "ticket" | "event" | "question";
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
    description: "Ask questions about crowds, entry-fees, or recommend bars.",
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

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
/*                                                                     */
/*  The screen is used inside your app that already ships              */
/*  useStyles(createStyles) — we reuse the same pattern so light /     */
/*  dark mode is driven by your existing ThemeProvider.                */
/* ------------------------------------------------------------------ */

import { useStyles } from "@/hooks/useStyles"; // adjust path if different
import { ApiService } from "@/services/api";
import { useLocation } from "@/context/LocationContext";

const createStyles = (t: any) => {
  // t is your existing theme object. We build a rich token map here so
  // per-card pastel accents adapt to light / dark.
  const isDark = t?.mode === "dark";

  return {
    ...t,
    // scatter card palettes
    dayMate: {
      bg: isDark ? "#2A1F4A" : "#EFEAFB",
      dec: isDark ? "#3A2A6B" : "#E1D6F7",
      circle: isDark ? "#4A2FCE" : "#D9CBFB",
      icon: isDark ? "#C4B5FD" : "#7C3AED",
      arrow: "#7C3AED",
    },
    ticket: {
      bg: isDark ? "#3A2A15" : "#FFF3E0",
      dec: isDark ? "#4A3820" : "#FCE4C4",
      circle: isDark ? "#7A4A1B" : "#FDD8A6",
      icon: isDark ? "#FBBF77" : "#EA580C",
      arrow: "#F97316",
    },
    event: {
      bg: isDark ? "#3E1B2C" : "#FDE7EE",
      dec: isDark ? "#5A2740" : "#F9D0DE",
      circle: isDark ? "#7A2A4A" : "#F7C0D0",
      icon: isDark ? "#F9A8C4" : "#DB2777",
      arrow: "#EC4899",
    },
    question: {
      bg: isDark ? "#1E2A4A" : "#E4EBFA",
      dec: isDark ? "#2A3860" : "#D0DBF3",
      circle: isDark ? "#2743A0" : "#C6D4F5",
      icon: isDark ? "#93B4F5" : "#2563EB",
      arrow: "#3B82F6",
    },

    // dark day-mates form surface (kept for day_mates form background)
    darkSurface: isDark ? "#0B0B1E" : "#0F1030",
    darkCard: isDark ? "#1B1C34" : "#1A1B36",
    darkBorder: isDark ? "#2A2C4A" : "#2A2C4A",
  };
};

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function CreateScreen() {
  const colors = useStyles(createStyles);

  const [selected, setSelected] = useState<OptionId | null>(null);

  // Day Mates form state
  const [activity, setActivity] = useState("Cricket");
  const [meetDate, setMeetDate] = useState<Date>(new Date());
  const [meetTime, setMeetTime] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [matesNeeded, setMatesNeeded] = useState(2);

  // Sell Ticket form state
  const [eventName, setEventName] = useState("");
  const [origPrice, setOrigPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [ticketQty, setTicketQty] = useState(1);

  // Host Event form state
  const [hostEventName, setHostEventName] = useState("");
  const [hostLocation, setHostLocation] = useState("");
  const [hostType, setHostType] = useState("Turf Game");
  const [maxPeople, setMaxPeople] = useState(15);

  // Ask Nearby form state
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState("Crowds");
  const [urgency, setUrgency] = useState("Normal Info");

  const close = () => router.back();
  const back = () => setSelected(null);

  const { selectedLocation } = useLocation();

  const addDayMate = async (d: any) => {
    console.log("DAY MATE added", d);
    if (!selectedLocation) {
      Alert.alert("Location required", "Please choose your location first.", [
        {
          text: "Choose Location",
          onPress: () => router.push("/(screens)/location-search"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);

      return false;
    }

    try {
      await ApiService.post("/api/activity", d);

      Alert.alert("Success", "Your Day Mate activity has been created.");

      return true;
    } catch (e) {
      Alert.alert("Failed", "Something went wrong.");
      return false;
    }
  };
  const addTicket = (d: any) => console.log("Ticket:", d);
  const addEvent = (d: any) => console.log("Event:", d);
  const addQuestion = (d: any) => console.log("Question:", d);

  const submit = async () => {
    if (selected === "day_mates") {
      await addDayMate({
        activity,
        activityEmoji:
          ACTIVITY_CHOICES.find((a) => a.label === activity)?.emoji ?? "🎉",
        date: meetDate.toISOString(),
        time: meetTime.toISOString(),
        matesNeeded,
        selectedLocation,
      });
    } else if (selected === "sell_ticket") {
      if (!eventName || !sellPrice) return;
      await addTicket({
        eventName,
        origPrice: Number(origPrice) || Number(sellPrice),
        sellPrice: Number(sellPrice),
        qty: ticketQty,
      });
    } else if (selected === "host_event") {
      if (!hostEventName || !hostLocation) return;
      await addEvent({
        name: hostEventName,
        location: hostLocation,
        type: hostType,
        maxPeople,
      });
    } else if (selected === "ask_nearby") {
      if (!question) return;
      await addQuestion({ question, topic, urgency });
    }
    // router.back();
  };

  const dateLabel = useMemo(
    () =>
      meetDate.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    [meetDate],
  );
  const timeLabel = useMemo(
    () =>
      meetTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    [meetTime],
  );

  /* -------------------------------------------------- */
  /* Render                                              */
  /* -------------------------------------------------- */

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {selected && (
            <Pressable
              onPress={back}
              style={[styles.roundBtn, { backgroundColor: colors.card }]}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={19} color={colors.foreground} />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            {!selected ? (
              <>
                <Text
                  style={[styles.headerTitle, { color: colors.foreground }]}
                >
                  What would <Text style={{ color: colors.primary }}>you</Text>{" "}
                  like to do today? 🎉
                </Text>
                <Text
                  style={[styles.headerSub, { color: colors.mutedForeground }]}
                >
                  Choose an option to get started
                </Text>
              </>
            ) : (
              <Text
                style={[
                  styles.headerTitle,
                  { color: colors.foreground, marginLeft: 6 },
                ]}
              >
                {OPTIONS.find((o) => o.id === selected)?.title}
              </Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={close}
          style={[styles.roundBtn, { backgroundColor: colors.card }]}
          hitSlop={10}
        >
          <Ionicons name="close" size={19} color={colors.mutedForeground} />
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
              const palette = colors[opt.key];
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setSelected(opt.id)}
                  style={({ pressed }) => [
                    styles.gridCard,
                    { backgroundColor: palette.bg },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View
                    style={[styles.dec1, { backgroundColor: palette.dec }]}
                  />
                  <View
                    style={[styles.dec2, { backgroundColor: palette.dec }]}
                  />
                  <View
                    style={[
                      styles.gridIconCircle,
                      { backgroundColor: palette.circle },
                    ]}
                  >
                    <Ionicons name={opt.icon} size={22} color={palette.icon} />
                  </View>
                  <Text
                    style={[styles.gridTitle, { color: colors.foreground }]}
                  >
                    {opt.title}
                  </Text>
                  <Text
                    style={[styles.gridDesc, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {opt.description}
                  </Text>
                  <View
                    style={[
                      styles.gridArrow,
                      { backgroundColor: palette.arrow },
                    ]}
                  >
                    <Ionicons name="arrow-forward" size={13} color="#fff" />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.footerBanner, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.footerIconWrap,
                { backgroundColor: colors.border },
              ]}
            >
              <Ionicons name="heart" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.footerTitle, { color: colors.foreground }]}>
                Good people. Good plans. Great days.
              </Text>
              <Text
                style={[styles.footerSub, { color: colors.mutedForeground }]}
              >
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
            <View
              style={[
                styles.darkWrapper,
                { backgroundColor: colors.darkSurface },
              ]}
            >
              <Text style={styles.sectionLabelDark}>
                What do you want to do?
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
              >
                {ACTIVITY_CHOICES.map((a) => (
                  <TouchableOpacity
                    key={a.label}
                    activeOpacity={0.8}
                    onPress={() => setActivity(a.label)}
                    style={[
                      styles.darkChip,
                      {
                        borderColor: colors.darkBorder,
                        backgroundColor: colors.darkCard,
                      },
                      activity === a.label && { borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.darkChipText,
                        activity === a.label && { color: "#FFFFFF" },
                      ]}
                    >
                      {a.label} {a.emoji}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Date + Time pickers */}
              <Text style={[styles.sectionLabelDark, { marginTop: 16 }]}>
                When would you like to meet?
              </Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowDate(true)}
                  style={[
                    styles.pickerChip,
                    {
                      borderColor: colors.darkBorder,
                      backgroundColor: colors.darkCard,
                    },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={16} color="#C4B5FD" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.pickerLabel}>Date</Text>
                    <Text style={styles.pickerValue}>{dateLabel}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowTime(true)}
                  style={[
                    styles.pickerChip,
                    {
                      borderColor: colors.darkBorder,
                      backgroundColor: colors.darkCard,
                    },
                  ]}
                >
                  <Ionicons name="time-outline" size={16} color="#C4B5FD" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.pickerLabel}>Time</Text>
                    <Text style={styles.pickerValue}>{timeLabel}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {showDate && (
                <DateTimePicker
                  value={meetDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  minimumDate={new Date()}
                  onChange={(_, d) => {
                    setShowDate(Platform.OS === "ios");
                    if (d) setMeetDate(d);
                  }}
                />
              )}
              {showTime && (
                <DateTimePicker
                  value={meetTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, d) => {
                    setShowTime(Platform.OS === "ios");
                    if (d) setMeetTime(d);
                  }}
                />
              )}

              <Text style={[styles.sectionLabelDark, { marginTop: 16 }]}>
                How many mates?
              </Text>
              <View
                style={[
                  styles.counterCardDark,
                  { backgroundColor: colors.darkCard },
                ]}
              >
                <Ionicons
                  name="people-outline"
                  size={26}
                  color={colors.primary}
                />
                <View style={styles.counterCenter}>
                  <Text style={styles.counterNumDark}>{matesNeeded}</Text>
                  <Text style={styles.counterSubDark}>people</Text>
                </View>
                <View style={styles.counterBtnsRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.counterBtnDark,
                      { backgroundColor: colors.darkBorder },
                    ]}
                    onPress={() => setMatesNeeded(Math.max(1, matesNeeded - 1))}
                  >
                    <Text style={styles.counterBtnTextDark}>−</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.counterBtnDark,
                      { backgroundColor: colors.darkBorder },
                    ]}
                    onPress={() =>
                      setMatesNeeded(Math.min(10, matesNeeded + 1))
                    }
                  >
                    <Text style={styles.counterBtnTextDark}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.sectionLabelDark, { marginTop: 16 }]}>
                Near my location
              </Text>
              <View
                style={[
                  styles.locationCard,
                  { backgroundColor: colors.darkCard },
                ]}
              >
                <Ionicons name="location-outline" size={18} color="#94A3B8" />
                <TextInput
                  value={`${selectedLocation?.name || ""},${selectedLocation?.state || ""}`}
                  // onChangeText={setLocation}
                  style={styles.locationInput}
                  placeholderTextColor="#64748B"
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={submit}
                style={[
                  styles.submitBtn,
                  { backgroundColor: colors.primary, marginTop: 20 },
                ]}
              >
                <Text style={styles.submitBtnText}>Find My Day Mates</Text>
              </TouchableOpacity>
            </View>
          )}

          {selected === "sell_ticket" && (
            <View style={styles.formWrapper}>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                Enter ticket pricing & availability details
              </Text>
              <FormLabel colors={colors} text="Event / Movie Name" />
              <FormInput
                colors={colors}
                placeholder="e.g., Coldplay Music of the Spheres"
                value={eventName}
                onChangeText={setEventName}
              />
              <View style={styles.rowFields}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <FormLabel colors={colors} text="Original Price (₹)" />
                  <FormInput
                    colors={colors}
                    placeholder="5000"
                    keyboardType="numeric"
                    value={origPrice}
                    onChangeText={setOrigPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormLabel colors={colors} text="Selling Price (₹)" />
                  <FormInput
                    colors={colors}
                    placeholder="3500"
                    keyboardType="numeric"
                    value={sellPrice}
                    onChangeText={setSellPrice}
                  />
                </View>
              </View>
              <FormLabel colors={colors} text="Ticket Quantity" />
              <View
                style={[
                  styles.counterRow,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                <Text
                  style={[
                    styles.counterLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  How many extra tickets?
                </Text>
                <Stepper
                  colors={colors}
                  value={ticketQty}
                  onChange={setTicketQty}
                  min={1}
                  max={8}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={!eventName || !sellPrice}
                onPress={submit}
                style={[
                  styles.submitBtn,
                  { backgroundColor: colors.ticket.arrow },
                  (!eventName || !sellPrice) && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.submitBtnText}>Post Ticket Deal</Text>
              </TouchableOpacity>
            </View>
          )}

          {selected === "host_event" && (
            <View style={styles.formWrapper}>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                Host social mixers, games or community events
              </Text>
              <FormLabel colors={colors} text="Event Title" />
              <FormInput
                colors={colors}
                placeholder="e.g., Koramangala Friday Pub Crawl"
                value={hostEventName}
                onChangeText={setHostEventName}
              />
              <FormLabel colors={colors} text="Venue / Spot Location" />
              <FormInput
                colors={colors}
                placeholder="e.g., Astro Arena Turf, Toit"
                value={hostLocation}
                onChangeText={setHostLocation}
              />
              <FormLabel colors={colors} text="Event Category" />
              <View style={styles.chipRow}>
                {EVENT_TYPES.map((t) => (
                  <Chip
                    key={t}
                    colors={colors}
                    label={t}
                    selected={hostType === t}
                    onPress={() => setHostType(t)}
                  />
                ))}
              </View>
              <FormLabel colors={colors} text="Max Attendees" />
              <View
                style={[
                  styles.counterRow,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                <Text
                  style={[
                    styles.counterLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Maximum attendees invited?
                </Text>
                <Stepper
                  colors={colors}
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
                  { backgroundColor: colors.event.arrow },
                  (!hostEventName || !hostLocation) && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.submitBtnText}>Launch Community Event</Text>
              </TouchableOpacity>
            </View>
          )}

          {selected === "ask_nearby" && (
            <View style={styles.formWrapper}>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                Broadcast a localized question to active users
              </Text>
              <FormLabel colors={colors} text="Your Question" />
              <TextInput
                style={[
                  styles.input,
                  styles.inputMultiline,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    color: colors.foreground,
                  },
                ]}
                multiline
                numberOfLines={3}
                placeholder="e.g., Is the entry fee at Toit active tonight?"
                placeholderTextColor={colors.mutedForeground}
                value={question}
                onChangeText={setQuestion}
              />
              <FormLabel colors={colors} text="Select Topic" />
              <View style={styles.chipRow}>
                {QUESTION_TOPICS.map((t) => (
                  <Chip
                    key={t}
                    colors={colors}
                    label={t}
                    selected={topic === t}
                    onPress={() => setTopic(t)}
                  />
                ))}
              </View>
              <FormLabel colors={colors} text="Urgency Level" />
              <View style={styles.chipRow}>
                {URGENCY_LEVELS.map((u) => (
                  <Chip
                    key={u}
                    colors={colors}
                    label={u}
                    selected={urgency === u}
                    onPress={() => setUrgency(u)}
                  />
                ))}
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={!question}
                onPress={submit}
                style={[
                  styles.submitBtn,
                  { backgroundColor: colors.question.arrow },
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

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function FormLabel({ colors, text }: { colors: any; text: string }) {
  return (
    <Text style={[styles.label, { color: colors.mutedForeground }]}>
      {text}
    </Text>
  );
}

function FormInput(props: any) {
  const { colors, ...rest } = props;
  return (
    <TextInput
      {...rest}
      placeholderTextColor={colors.mutedForeground}
      style={[
        styles.input,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
          color: colors.foreground,
        },
      ]}
    />
  );
}

function Chip({
  colors,
  label,
  selected,
  onPress,
}: {
  colors: any;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.border, backgroundColor: colors.background },
        selected && {
          borderColor: colors.primary,
          backgroundColor: colors.accent,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: colors.mutedForeground },
          selected && { color: colors.primary, fontWeight: "700" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Stepper({
  colors,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  colors: any;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <View style={styles.counterControls}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.counterBtn, { backgroundColor: colors.border }]}
        onPress={() => onChange(Math.max(min, value - step))}
      >
        <Text style={[styles.counterBtnText, { color: colors.foreground }]}>
          −
        </Text>
      </TouchableOpacity>
      <Text style={[styles.counterVal, { color: colors.foreground }]}>
        {value}
      </Text>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.counterBtn, { backgroundColor: colors.border }]}
        onPress={() => onChange(Math.min(max, value + step))}
      >
        <Text style={[styles.counterBtnText, { color: colors.foreground }]}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  headerTitle: { fontWeight: "900", fontSize: 16, flex: 1 },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  roundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
    marginBottom: 14,
  },
  gridCard: {
    width: "47.5%",
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 152,
    overflow: "hidden",
  },
  dec1: {
    position: "absolute",
    width: 45,
    height: 45,
    borderRadius: 999,
    top: -12,
    left: -12,
  },
  dec2: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 999,
    bottom: 4,
    right: -8,
  },
  gridIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gridTitle: {
    fontWeight: "800",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 4,
  },
  gridDesc: {
    fontSize: 10.5,
    textAlign: "center",
    lineHeight: 14,
    fontWeight: "500",
    marginBottom: 8,
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
  },
  footerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  footerTitle: { fontWeight: "800", fontSize: 13 },
  footerSub: { fontSize: 11.5, fontWeight: "500", marginTop: 2 },

  formWrapper: { paddingVertical: 8 },
  sectionSubtitle: { fontSize: 13, fontWeight: "600", marginBottom: 10 },
  label: {
    fontSize: 11.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  inputMultiline: { height: 84, textAlignVertical: "top" },
  rowFields: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  counterLabel: { fontSize: 12.5, fontWeight: "600", flex: 1, marginRight: 10 },
  counterControls: { flexDirection: "row", alignItems: "center", gap: 14 },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: { fontSize: 18, fontWeight: "bold" },
  counterVal: {
    fontSize: 15,
    fontWeight: "800",
    minWidth: 20,
    textAlign: "center",
  },
  submitBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  darkWrapper: {
    paddingTop: 14,
    paddingBottom: 24,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 12,
  },
  sectionLabelDark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  chipScroll: { gap: 8, flexDirection: "row", paddingBottom: 2 },
  darkChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  darkChipText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },

  pickerRow: { flexDirection: "row", gap: 10 },
  pickerChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerLabel: {
    color: "#94A3B8",
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  pickerValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },

  counterCardDark: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  counterCenter: { flex: 1, alignItems: "center" },
  counterNumDark: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  counterSubDark: { color: "#94A3B8", fontSize: 11, fontWeight: "600" },
  counterBtnsRow: { flexDirection: "row", gap: 10 },
  counterBtnDark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnTextDark: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  locationInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 6,
  },
});
