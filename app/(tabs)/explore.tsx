// // @ts-nocheck
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   Platform,
//   useWindowDimensions,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { scale, verticalScale, moderateScale } from "react-native-size-matters";
// import { ApiService } from "@/services/api";
// import { useLocation } from "@/context/LocationContext";

// interface Pin {
//   id: string;
//   lat: number; // percentage from top
//   lng: number; // percentage from left
//   title: string;
//   type: "ticket" | "day_mates" | "lost";
//   venue: string;
//   price?: string;
//   ownerName: string;
//   ownerAvatar: string;
// }

// const ACTIVE_PINS: Pin[] = [
//   {
//     id: "p1",
//     lat: 38,
//     lng: 28,
//     title: "Avengers: Endgame Ticket",
//     type: "ticket",
//     venue: "PVR Phoenix Marketcity",
//     price: "₹500",
//     ownerName: "Rohan",
//     ownerAvatar: "https://i.pravatar.cc/80?img=11",
//   },
//   {
//     id: "p2",
//     lat: 52,
//     lng: 68,
//     title: "Morning Walk Buddy",
//     // type: "buddy",
//     type: "day_mates",
//     venue: "Bandra Reclamation",
//     ownerName: "Ananya",
//     ownerAvatar: "https://i.pravatar.cc/80?img=20",
//   },
//   {
//     id: "p3",
//     lat: 68,
//     lng: 35,
//     title: "Black Wallet Lost",
//     type: "lost",
//     venue: "Near Dadar Station",
//     ownerName: "Neha",
//     ownerAvatar: "https://i.pravatar.cc/80?img=32",
//   },
//   {
//     id: "p4",
//     lat: 25,
//     lng: 72,
//     title: "Coldplay Ticket Sale",
//     type: "ticket",
//     venue: "National Gymkhana",
//     price: "₹4500",
//     ownerName: "Marcus",
//     ownerAvatar: "https://i.pravatar.cc/80?img=12",
//   },
// ];

// export default function ExploreScreen() {
//   const { width, height } = useWindowDimensions();
//   const [filterType, setFilterType] = useState<
//     "all" | "ticket" | "day_mates" | "lost"
//   >("all");

//   const { selectedLocation } = useLocation();
//   const [activePins, setActivePins] = useState<[]>([]);
//   const [selectedPin, setSelectedPin] = useState<Pin | null>(activePins[0]); // Default to Ananya's walk buddy

//   const filteredPins = activePins.filter((p) =>
//     filterType === "all" ? true : p.type === filterType,
//   );

//   useEffect(() => {
//     const loadActivePins = async () => {
//       try {
//         const d = await ApiService.post("/api/activity/explore");

//         setActivePins(d);
//       } catch (error) {
//         console.error(error);
//       }
//     };

//     loadActivePins();
//   }, []);

//   return (
//     <View style={s.container}>
//       {/* MAP CANVAS GRID */}
//       <View style={s.mapCanvas}>
//         {/* Abstract Map Grid Lines */}
//         <View style={s.gridContainer}>
//           {[...Array(12)].map((_, i) => (
//             <View
//               key={`v-${i}`}
//               style={[s.gridLineVert, { left: `${(i + 1) * 8}%` }]}
//             />
//           ))}
//           {[...Array(20)].map((_, i) => (
//             <View
//               key={`h-${i}`}
//               style={[s.gridLineHoriz, { top: `${(i + 1) * 5}%` }]}
//             />
//           ))}
//         </View>

//         {/* Ambient Glow Orbs */}
//         <View style={s.glowOrb1} />
//         <View style={s.glowOrb2} />

//         {/* Pulsing Interactive Pins */}
//         {filteredPins.map((pin) => {
//           const isSelected = selectedPin?.id === pin.id;
//           return (
//             <TouchableOpacity
//               key={pin.id}
//               onPress={() => setSelectedPin(pin)}
//               activeOpacity={0.8}
//               style={[
//                 s.markerWrapper,
//                 { top: `${pin.lat}%`, left: `${pin.lng}%` },
//               ]}
//             >
//               <View style={s.markerContainer}>
//                 {/* Visual Dot Ring */}
//                 <View
//                   style={[
//                     s.pingRing,
//                     pin.type === "ticket" && s.ringTicket,
//                     pin.type === "buddy" && s.ringBuddy,
//                     pin.type === "lost" && s.ringLost,
//                     isSelected && s.ringActive,
//                   ]}
//                 />

//                 {/* Main Marker Dot */}
//                 <View
//                   style={[
//                     s.markerPin,
//                     pin.type === "ticket" && { backgroundColor: "#7C3AED" },
//                     pin.type === "buddy" && { backgroundColor: "#D97706" },
//                     pin.type === "lost" && { backgroundColor: "#059669" },
//                     isSelected && s.markerSelected,
//                   ]}
//                 >
//                   <Ionicons
//                     name="location"
//                     size={moderateScale(12)}
//                     color="#FFFFFF"
//                   />
//                 </View>

//                 {isSelected && (
//                   <View style={s.markerLabel}>
//                     <Text style={s.markerLabelText}>{pin.ownerName}</Text>
//                   </View>
//                 )}
//               </View>
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       {/* FLOAT MAP SEARCH OVERLAY */}
//       <View style={s.floatingOverlay}>
//         <View style={s.infoCard}>
//           <View style={s.infoIconBg}>
//             <Ionicons
//               name="compass-outline"
//               size={moderateScale(18)}
//               color="#A78BFA"
//             />
//           </View>
//           <View style={s.infoTexts}>
//             <Text style={s.infoTitle}>Radar active around Mumbai</Text>
//             <Text style={s.infoDesc}>
//               Showing people within 5 km of your location
//             </Text>
//           </View>
//         </View>

//         {/* Horizontal Quick Filter Pills */}
//         <View style={s.filtersRow}>
//           {(
//             [
//               { id: "all", label: "All Items" },
//               { id: "ticket", label: "Tickets 🎟️" },
//               { id: "buddy", label: "Buddies 👥" },
//               { id: "lost", label: "Lost & Found 📢" },
//             ] as const
//           ).map((opt) => (
//             <TouchableOpacity
//               key={opt.id}
//               onPress={() => {
//                 setFilterType(opt.id);
//                 const matching = activePins.filter((p) =>
//                   opt.id === "all" ? true : p.type === opt.id,
//                 );
//                 if (matching.length > 0) setSelectedPin(matching[0]);
//               }}
//               activeOpacity={0.8}
//               style={[
//                 s.filterPill,
//                 filterType === opt.id && s.filterPillSelected,
//               ]}
//             >
//               <Text
//                 style={[
//                   s.filterPillText,
//                   filterType === opt.id && s.filterPillTextSelected,
//                 ]}
//               >
//                 {opt.label}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>

//       {/* FLOATING TARGET CARD DETAILS */}
//       <View style={s.bottomPanel}>
//         {selectedPin ? (
//           <View style={s.detailsCard}>
//             {/* Status dot */}
//             <View
//               style={[
//                 s.statusDot,
//                 selectedPin.type === "ticket" && { backgroundColor: "#7C3AED" },
//                 selectedPin.type === "buddy" && { backgroundColor: "#D97706" },
//                 selectedPin.type === "lost" && { backgroundColor: "#059669" },
//               ]}
//             />

//             <Image
//               source={{ uri: selectedPin.ownerAvatar }}
//               style={s.detailsAvatar}
//             />

//             <View style={s.detailsCol}>
//               <Text style={s.detailsBadgeText}>
//                 {selectedPin.type === "ticket"
//                   ? "MOVIE DEAL"
//                   : selectedPin.type === "buddy"
//                     ? "DAY MATE PLAN"
//                     : "LOST BROADCAST"}
//               </Text>

//               <Text style={s.detailsTitle} numberOfLines={1}>
//                 {selectedPin.title}
//               </Text>

//               <View style={s.detailsLocRow}>
//                 <Ionicons
//                   name="location-outline"
//                   size={moderateScale(11)}
//                   color="#94A3B8"
//                 />
//                 <Text style={s.detailsLocText} numberOfLines={1}>
//                   {selectedPin.venue}
//                 </Text>
//               </View>

//               <View style={s.detailsBottomRow}>
//                 <Text style={s.detailsByText}>
//                   Post by{" "}
//                   <Text style={s.detailsOwnerName}>
//                     {selectedPin.ownerName}
//                   </Text>
//                 </Text>

//                 {selectedPin.price ? (
//                   <Text style={s.detailsPrice}>{selectedPin.price}</Text>
//                 ) : (
//                   <View style={s.connectRow}>
//                     <Text style={s.connectText}>Connect</Text>
//                     <Ionicons
//                       name="arrow-forward-outline"
//                       size={moderateScale(10)}
//                       color="#A78BFA"
//                     />
//                   </View>
//                 )}
//               </View>
//             </View>
//           </View>
//         ) : (
//           <View style={s.emptyDetailsCard}>
//             <Text style={s.emptyDetailsText}>
//               Tap any active radar point to inspect
//             </Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// }

// const shadow = Platform.select({
//   ios: {
//     shadowColor: "#000000",
//     shadowOpacity: 0.35,
//     shadowRadius: 16,
//     shadowOffset: { width: 0, height: 8 },
//   },
//   android: {
//     elevation: 8,
//   },
//   default: {},
// });

// const s = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#070514",
//   },
//   mapCanvas: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "#0A071D",
//     overflow: "hidden",
//   },
//   gridContainer: {
//     ...StyleSheet.absoluteFillObject,
//     opacity: 0.06,
//   },
//   gridLineVert: {
//     position: "absolute",
//     top: 0,
//     bottom: 0,
//     width: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   gridLineHoriz: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     height: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   glowOrb1: {
//     position: "absolute",
//     top: "15%",
//     left: "5%",
//     width: scale(180),
//     height: scale(180),
//     borderRadius: scale(90),
//     backgroundColor: "rgba(124, 58, 237, 0.08)",
//   },
//   glowOrb2: {
//     position: "absolute",
//     bottom: "25%",
//     right: "5%",
//     width: scale(220),
//     height: scale(220),
//     borderRadius: scale(110),
//     backgroundColor: "rgba(59, 130, 246, 0.08)",
//   },
//   markerWrapper: {
//     position: "absolute",
//     transform: [{ translateX: scale(-16) }, { translateY: scale(-16) }],
//     zIndex: 10,
//   },
//   markerContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     position: "relative",
//   },
//   pingRing: {
//     position: "absolute",
//     width: scale(32),
//     height: scale(32),
//     borderRadius: scale(16),
//     opacity: 0.2,
//   },
//   ringTicket: { backgroundColor: "#7C3AED" },
//   ringBuddy: { backgroundColor: "#D97706" },
//   ringLost: { backgroundColor: "#059669" },
//   ringActive: {
//     transform: [{ scale: 1.3 }],
//     opacity: 0.4,
//   },
//   markerPin: {
//     width: scale(24),
//     height: scale(24),
//     borderRadius: scale(12),
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1.5,
//     borderColor: "transparent",
//   },
//   markerSelected: {
//     borderColor: "#FFFFFF",
//     transform: [{ scale: 1.2 }],
//   },
//   markerLabel: {
//     position: "absolute",
//     bottom: scale(28),
//     backgroundColor: "#120E2C",
//     borderRadius: scale(10),
//     paddingHorizontal: scale(6),
//     paddingVertical: scale(2),
//     borderWidth: 0.5,
//     borderColor: "rgba(255, 255, 255, 0.15)",
//   },
//   markerLabelText: {
//     fontSize: moderateScale(8),
//     color: "#FFFFFF",
//     fontWeight: "900",
//   },
//   floatingOverlay: {
//     position: "absolute",
//     top: verticalScale(16),
//     left: scale(20),
//     right: scale(20),
//     zIndex: 20,
//     gap: verticalScale(10),
//   },
//   infoCard: {
//     flexDirection: "row",
//     backgroundColor: "rgba(18, 14, 44, 0.85)",
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.05)",
//     borderRadius: scale(16),
//     padding: scale(10),
//     alignItems: "center",
//     gap: scale(10),
//   },
//   infoIconBg: {
//     width: scale(32),
//     height: scale(32),
//     borderRadius: scale(10),
//     backgroundColor: "rgba(124, 58, 237, 0.15)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   infoTexts: {
//     flex: 1,
//   },
//   infoTitle: {
//     fontSize: moderateScale(11.5),
//     fontWeight: "800",
//     color: "#FFFFFF",
//   },
//   infoDesc: {
//     fontSize: moderateScale(9),
//     color: "#94A3B8",
//     marginTop: scale(1),
//   },
//   filtersRow: {
//     flexDirection: "row",
//     gap: scale(6),
//   },
//   filterPill: {
//     backgroundColor: "rgba(18, 14, 44, 0.75)",
//     borderRadius: scale(14),
//     paddingHorizontal: scale(10),
//     paddingVertical: verticalScale(6),
//     borderWidth: 0.5,
//     borderColor: "rgba(255, 255, 255, 0.05)",
//   },
//   filterPillSelected: {
//     backgroundColor: "#7C3AED",
//     borderColor: "#A78BFA",
//   },
//   filterPillText: {
//     fontSize: moderateScale(9.5),
//     fontWeight: "800",
//     color: "#D1D5DB",
//   },
//   filterPillTextSelected: {
//     color: "#FFFFFF",
//   },
//   bottomPanel: {
//     position: "absolute",
//     bottom: verticalScale(20),
//     left: scale(20),
//     right: scale(20),
//     zIndex: 20,
//   },
//   detailsCard: {
//     backgroundColor: "rgba(18, 14, 44, 0.92)",
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.08)",
//     borderRadius: scale(24),
//     padding: scale(14),
//     flexDirection: "row",
//     gap: scale(12),
//     position: "relative",
//     ...shadow,
//   },
//   statusDot: {
//     position: "absolute",
//     top: scale(14),
//     right: scale(14),
//     width: scale(6),
//     height: scale(6),
//     borderRadius: scale(3),
//   },
//   detailsAvatar: {
//     width: scale(56),
//     height: scale(56),
//     borderRadius: scale(16),
//     backgroundColor: "rgba(255, 255, 255, 0.03)",
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.08)",
//   },
//   detailsCol: {
//     flex: 1,
//     justifyContent: "space-between",
//   },
//   detailsBadgeText: {
//     fontSize: moderateScale(8.5),
//     fontWeight: "900",
//     color: "#A78BFA",
//     letterSpacing: 0.5,
//   },
//   detailsTitle: {
//     fontSize: moderateScale(13.5),
//     fontWeight: "800",
//     color: "#FFFFFF",
//     marginTop: verticalScale(1),
//   },
//   detailsLocRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: scale(4),
//     marginTop: verticalScale(1),
//   },
//   detailsLocText: {
//     fontSize: moderateScale(9.5),
//     color: "#94A3B8",
//     fontWeight: "500",
//     flex: 1,
//   },
//   detailsBottomRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     borderTopWidth: 0.5,
//     borderColor: "rgba(255, 255, 255, 0.05)",
//     paddingTop: verticalScale(6),
//     marginTop: verticalScale(4),
//   },
//   detailsByText: {
//     fontSize: moderateScale(9.5),
//     color: "#94A3B8",
//   },
//   detailsOwnerName: {
//     fontWeight: "700",
//     color: "#FFFFFF",
//   },
//   detailsPrice: {
//     fontSize: moderateScale(11),
//     fontWeight: "900",
//     color: "#FBBF24",
//   },
//   connectRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: scale(2),
//   },
//   connectText: {
//     fontSize: moderateScale(9.5),
//     fontWeight: "800",
//     color: "#A78BFA",
//     textTransform: "uppercase",
//   },
//   emptyDetailsCard: {
//     backgroundColor: "rgba(18, 14, 44, 0.8)",
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.05)",
//     borderRadius: scale(20),
//     paddingVertical: scale(16),
//     alignItems: "center",
//     justifyContent: "center",
//     ...shadow,
//   },
//   emptyDetailsText: {
//     fontSize: moderateScale(11.5),
//     fontWeight: "700",
//     color: "#94A3B8",
//   },
// });

// // @ts-nocheck
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   Platform,
//   useWindowDimensions,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { scale, verticalScale, moderateScale } from "react-native-size-matters";
// import { ApiService } from "@/services/api";
// import { useLocation } from "@/context/LocationContext";

// interface Pin {
//   id: string;
//   lat: number; // percentage from top
//   lng: number; // percentage from left
//   title: string;
//   type: "ticket" | "day_mates" | "lost";
//   venue: string;
//   price?: string;
//   ownerName: string;
//   ownerAvatar: string;
// }

// const ACTIVE_PINS: Pin[] = [
//   {
//     id: "p1",
//     lat: 38,
//     lng: 28,
//     title: "Avengers: Endgame Ticket",
//     type: "ticket",
//     venue: "PVR Phoenix Marketcity",
//     price: "₹500",
//     ownerName: "Rohan",
//     ownerAvatar: "https://i.pravatar.cc/80?img=11",
//   },
//   {
//     id: "p2",
//     lat: 52,
//     lng: 68,
//     title: "Morning Walk Buddy",
//     // type: "buddy",
//     type: "day_mates",
//     venue: "Bandra Reclamation",
//     ownerName: "Ananya",
//     ownerAvatar: "https://i.pravatar.cc/80?img=20",
//   },
//   {
//     id: "p3",
//     lat: 68,
//     lng: 35,
//     title: "Black Wallet Lost",
//     type: "lost",
//     venue: "Near Dadar Station",
//     ownerName: "Neha",
//     ownerAvatar: "https://i.pravatar.cc/80?img=32",
//   },
//   {
//     id: "p4",
//     lat: 25,
//     lng: 72,
//     title: "Coldplay Ticket Sale",
//     type: "ticket",
//     venue: "National Gymkhana",
//     price: "₹4500",
//     ownerName: "Marcus",
//     ownerAvatar: "https://i.pravatar.cc/80?img=12",
//   },
// ];

// export default function ExploreScreen() {
//   const { width, height } = useWindowDimensions();
//   const [filterType, setFilterType] = useState<
//     "all" | "ticket" | "day_mates" | "lost"
//   >("all");

//   const { selectedLocation } = useLocation();
//   const [activePins, setActivePins] = useState<[]>([]);
//   const [selectedPin, setSelectedPin] = useState<Pin | null>(activePins[0]); // Default to Ananya's walk buddy

//   const filteredPins = activePins.filter((p) =>
//     filterType === "all" ? true : p.type === filterType,
//   );

//   useEffect(() => {
//     const loadActivePins = async () => {
//       try {
//         const d = await ApiService.post("/api/activity/explore");

//         setActivePins(d);
//       } catch (error) {
//         console.error(error);
//       }
//     };

//     loadActivePins();
//   }, []);

//   return (
//     <View style={s.container}>
//       {/* MAP CANVAS GRID */}
//       <View style={s.mapCanvas}>
//         {/* Abstract Map Grid Lines */}
//         <View style={s.gridContainer}>
//           {[...Array(12)].map((_, i) => (
//             <View
//               key={`v-${i}`}
//               style={[s.gridLineVert, { left: `${(i + 1) * 8}%` }]}
//             />
//           ))}
//           {[...Array(20)].map((_, i) => (
//             <View
//               key={`h-${i}`}
//               style={[s.gridLineHoriz, { top: `${(i + 1) * 5}%` }]}
//             />
//           ))}
//         </View>

//         {/* Ambient Glow Orbs */}
//         <View style={s.glowOrb1} />
//         <View style={s.glowOrb2} />

//         {/* Pulsing Interactive Pins */}
//         {filteredPins.map((pin) => {
//           const isSelected = selectedPin?.id === pin.id;
//           return (
//             <TouchableOpacity
//               key={pin.id}
//               onPress={() => setSelectedPin(pin)}
//               activeOpacity={0.8}
//               style={[
//                 s.markerWrapper,
//                 { top: `${pin.lat}%`, left: `${pin.lng}%` },
//               ]}
//             >
//               <View style={s.markerContainer}>
//                 {/* Visual Dot Ring */}
//                 <View
//                   style={[
//                     s.pingRing,
//                     pin.type === "ticket" && s.ringTicket,
//                     pin.type === "buddy" && s.ringBuddy,
//                     pin.type === "lost" && s.ringLost,
//                     isSelected && s.ringActive,
//                   ]}
//                 />

//                 {/* Main Marker Dot */}
//                 <View
//                   style={[
//                     s.markerPin,
//                     pin.type === "ticket" && { backgroundColor: "#7C3AED" },
//                     pin.type === "buddy" && { backgroundColor: "#D97706" },
//                     pin.type === "lost" && { backgroundColor: "#059669" },
//                     isSelected && s.markerSelected,
//                   ]}
//                 >
//                   <Ionicons
//                     name="location"
//                     size={moderateScale(12)}
//                     color="#FFFFFF"
//                   />
//                 </View>

//                 {isSelected && (
//                   <View style={s.markerLabel}>
//                     <Text style={s.markerLabelText}>{pin.ownerName}</Text>
//                   </View>
//                 )}
//               </View>
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       {/* FLOAT MAP SEARCH OVERLAY */}
//       <View style={s.floatingOverlay}>
//         <View style={s.infoCard}>
//           <View style={s.infoIconBg}>
//             <Ionicons
//               name="compass-outline"
//               size={moderateScale(18)}
//               color="#A78BFA"
//             />
//           </View>
//           <View style={s.infoTexts}>
//             <Text style={s.infoTitle}>Radar active around Mumbai</Text>
//             <Text style={s.infoDesc}>
//               Showing people within 5 km of your location
//             </Text>
//           </View>
//         </View>

//         {/* Horizontal Quick Filter Pills */}
//         <View style={s.filtersRow}>
//           {(
//             [
//               { id: "all", label: "All Items" },
//               { id: "ticket", label: "Tickets 🎟️" },
//               { id: "buddy", label: "Buddies 👥" },
//               { id: "lost", label: "Lost & Found 📢" },
//             ] as const
//           ).map((opt) => (
//             <TouchableOpacity
//               key={opt.id}
//               onPress={() => {
//                 setFilterType(opt.id);
//                 const matching = activePins.filter((p) =>
//                   opt.id === "all" ? true : p.type === opt.id,
//                 );
//                 if (matching.length > 0) setSelectedPin(matching[0]);
//               }}
//               activeOpacity={0.8}
//               style={[
//                 s.filterPill,
//                 filterType === opt.id && s.filterPillSelected,
//               ]}
//             >
//               <Text
//                 style={[
//                   s.filterPillText,
//                   filterType === opt.id && s.filterPillTextSelected,
//                 ]}
//               >
//                 {opt.label}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>

//       {/* FLOATING TARGET CARD DETAILS */}
//       <View style={s.bottomPanel}>
//         {selectedPin ? (
//           <View style={s.detailsCard}>
//             {/* Status dot */}
//             <View
//               style={[
//                 s.statusDot,
//                 selectedPin.type === "ticket" && { backgroundColor: "#7C3AED" },
//                 selectedPin.type === "buddy" && { backgroundColor: "#D97706" },
//                 selectedPin.type === "lost" && { backgroundColor: "#059669" },
//               ]}
//             />

//             <Image
//               source={{ uri: selectedPin.ownerAvatar }}
//               style={s.detailsAvatar}
//             />

//             <View style={s.detailsCol}>
//               <Text style={s.detailsBadgeText}>
//                 {selectedPin.type === "ticket"
//                   ? "MOVIE DEAL"
//                   : selectedPin.type === "buddy"
//                     ? "DAY MATE PLAN"
//                     : "LOST BROADCAST"}
//               </Text>

//               <Text style={s.detailsTitle} numberOfLines={1}>
//                 {selectedPin.title}
//               </Text>

//               <View style={s.detailsLocRow}>
//                 <Ionicons
//                   name="location-outline"
//                   size={moderateScale(11)}
//                   color="#94A3B8"
//                 />
//                 <Text style={s.detailsLocText} numberOfLines={1}>
//                   {selectedPin.venue}
//                 </Text>
//               </View>

//               <View style={s.detailsBottomRow}>
//                 <Text style={s.detailsByText}>
//                   Post by{" "}
//                   <Text style={s.detailsOwnerName}>
//                     {selectedPin.ownerName}
//                   </Text>
//                 </Text>

//                 {selectedPin.price ? (
//                   <Text style={s.detailsPrice}>{selectedPin.price}</Text>
//                 ) : (
//                   <View style={s.connectRow}>
//                     <Text style={s.connectText}>Connect</Text>
//                     <Ionicons
//                       name="arrow-forward-outline"
//                       size={moderateScale(10)}
//                       color="#A78BFA"
//                     />
//                   </View>
//                 )}
//               </View>
//             </View>
//           </View>
//         ) : (
//           <View style={s.emptyDetailsCard}>
//             <Text style={s.emptyDetailsText}>
//               Tap any active radar point to inspect
//             </Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// }

// const shadow = Platform.select({
//   ios: {
//     shadowColor: "#000000",
//     shadowOpacity: 0.35,
//     shadowRadius: 16,
//     shadowOffset: { width: 0, height: 8 },
//   },
//   android: {
//     elevation: 8,
//   },
//   default: {},
// });

// const s = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#070514",
//   },
//   mapCanvas: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "#0A071D",
//     overflow: "hidden",
//   },
//   gridContainer: {
//     ...StyleSheet.absoluteFillObject,
//     opacity: 0.06,
//   },
//   gridLineVert: {
//     position: "absolute",
//     top: 0,
//     bottom: 0,
//     width: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   gridLineHoriz: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     height: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   glowOrb1: {
//     position: "absolute",
//     top: "15%",
//     left: "5%",
//     width: scale(180),
//     height: scale(180),
//     borderRadius: scale(90),
//     backgroundColor: "rgba(124, 58, 237, 0.08)",
//   },
//   glowOrb2: {
//     position: "absolute",
//     bottom: "25%",
//     right: "5%",
//     width: scale(220),
//     height: scale(220),
//     borderRadius: scale(110),
//     backgroundColor: "rgba(59, 130, 246, 0.08)",
//   },
//   markerWrapper: {
//     position: "absolute",
//     transform: [{ translateX: scale(-16) }, { translateY: scale(-16) }],
//     zIndex: 10,
//   },
//   markerContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     position: "relative",
//   },
//   pingRing: {
//     position: "absolute",
//     width: scale(32),
//     height: scale(32),
//     borderRadius: scale(16),
//     opacity: 0.2,
//   },
//   ringTicket: { backgroundColor: "#7C3AED" },
//   ringBuddy: { backgroundColor: "#D97706" },
//   ringLost: { backgroundColor: "#059669" },
//   ringActive: {
//     transform: [{ scale: 1.3 }],
//     opacity: 0.4,
//   },
//   markerPin: {
//     width: scale(24),
//     height: scale(24),
//     borderRadius: scale(12),
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1.5,
//     borderColor: "transparent",
//   },
//   markerSelected: {
//     borderColor: "#FFFFFF",
//     transform: [{ scale: 1.2 }],
//   },
//   markerLabel: {
//     position: "absolute",
//     bottom: scale(28),
//     backgroundColor: "#120E2C",
//     borderRadius: scale(10),
//     paddingHorizontal: scale(6),
//     paddingVertical: scale(2),
//     borderWidth: 0.5,
//     borderColor: "rgba(255, 255, 255, 0.15)",
//   },
//   markerLabelText: {
//     fontSize: moderateScale(8),
//     color: "#FFFFFF",
//     fontWeight: "900",
//   },
//   floatingOverlay: {
//     position: "absolute",
//     top: verticalScale(16),
//     left: scale(20),
//     right: scale(20),
//     zIndex: 20,
//     gap: verticalScale(10),
//   },
//   infoCard: {
//     flexDirection: "row",
//     backgroundColor: "rgba(18, 14, 44, 0.85)",
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.05)",
//     borderRadius: scale(16),
//     padding: scale(10),
//     alignItems: "center",
//     gap: scale(10),
//   },
//   infoIconBg: {
//     width: scale(32),
//     height: scale(32),
//     borderRadius: scale(10),
//     backgroundColor: "rgba(124, 58, 237, 0.15)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   infoTexts: {
//     flex: 1,
//   },
//   infoTitle: {
//     fontSize: moderateScale(11.5),
//     fontWeight: "800",
//     color: "#FFFFFF",
//   },
//   infoDesc: {
//     fontSize: moderateScale(9),
//     color: "#94A3B8",
//     marginTop: scale(1),
//   },
//   filtersRow: {
//     flexDirection: "row",
//     gap: scale(6),
//   },
//   filterPill: {
//     backgroundColor: "rgba(18, 14, 44, 0.75)",
//     borderRadius: scale(14),
//     paddingHorizontal: scale(10),
//     paddingVertical: verticalScale(6),
//     borderWidth: 0.5,
//     borderColor: "rgba(255, 255, 255, 0.05)",
//   },
//   filterPillSelected: {
//     backgroundColor: "#7C3AED",
//     borderColor: "#A78BFA",
//   },
//   filterPillText: {
//     fontSize: moderateScale(9.5),
//     fontWeight: "800",
//     color: "#D1D5DB",
//   },
//   filterPillTextSelected: {
//     color: "#FFFFFF",
//   },
//   bottomPanel: {
//     position: "absolute",
//     bottom: verticalScale(20),
//     left: scale(20),
//     right: scale(20),
//     zIndex: 20,
//   },
//   detailsCard: {
//     backgroundColor: "rgba(18, 14, 44, 0.92)",
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.08)",
//     borderRadius: scale(24),
//     padding: scale(14),
//     flexDirection: "row",
//     gap: scale(12),
//     position: "relative",
//     ...shadow,
//   },
//   statusDot: {
//     position: "absolute",
//     top: scale(14),
//     right: scale(14),
//     width: scale(6),
//     height: scale(6),
//     borderRadius: scale(3),
//   },
//   detailsAvatar: {
//     width: scale(56),
//     height: scale(56),
//     borderRadius: scale(16),
//     backgroundColor: "rgba(255, 255, 255, 0.03)",
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.08)",
//   },
//   detailsCol: {
//     flex: 1,
//     justifyContent: "space-between",
//   },
//   detailsBadgeText: {
//     fontSize: moderateScale(8.5),
//     fontWeight: "900",
//     color: "#A78BFA",
//     letterSpacing: 0.5,
//   },
//   detailsTitle: {
//     fontSize: moderateScale(13.5),
//     fontWeight: "800",
//     color: "#FFFFFF",
//     marginTop: verticalScale(1),
//   },
//   detailsLocRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: scale(4),
//     marginTop: verticalScale(1),
//   },
//   detailsLocText: {
//     fontSize: moderateScale(9.5),
//     color: "#94A3B8",
//     fontWeight: "500",
//     flex: 1,
//   },
//   detailsBottomRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     borderTopWidth: 0.5,
//     borderColor: "rgba(255, 255, 255, 0.05)",
//     paddingTop: verticalScale(6),
//     marginTop: verticalScale(4),
//   },
//   detailsByText: {
//     fontSize: moderateScale(9.5),
//     color: "#94A3B8",
//   },
//   detailsOwnerName: {
//     fontWeight: "700",
//     color: "#FFFFFF",
//   },
//   detailsPrice: {
//     fontSize: moderateScale(11),
//     fontWeight: "900",
//     color: "#FBBF24",
//   },
//   connectRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: scale(2),
//   },
//   connectText: {
//     fontSize: moderateScale(9.5),
//     fontWeight: "800",
//     color: "#A78BFA",
//     textTransform: "uppercase",
//   },
//   emptyDetailsCard: {
//     backgroundColor: "rgba(18, 14, 44, 0.8)",
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.05)",
//     borderRadius: scale(20),
//     paddingVertical: scale(16),
//     alignItems: "center",
//     justifyContent: "center",
//     ...shadow,
//   },
//   emptyDetailsText: {
//     fontSize: moderateScale(11.5),
//     fontWeight: "700",
//     color: "#94A3B8",
//   },
// });
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import { ApiService } from "@/services/api";
import { useLocation } from "@/context/LocationContext";
import { router } from "expo-router";
import { useAuthContext } from "@/context/AuthContext";

type PinType = "ticket" | "day_mates" | "lost";

interface Pin {
  id: string;
  lat: number; // percentage from top (0-100)
  lng: number; // percentage from left (0-100)
  title: string;
  type: PinType;
  venue: string;
  price?: string;
  ownerName: string;
  ownerAvatar: string;
}

// Sizes used to keep pins inside the map bounds
const PIN_SIZE = 24; // markerPin diameter (pre-scale)
const RING_SIZE = 32; // pingRing diameter (pre-scale)
const HALF_PIN = PIN_SIZE / 2;
const HALF_RING = RING_SIZE / 2;

// Reserve safe zones (percent) so pins never sit under the top overlay or bottom card.
// Tune these if your overlays change height.
const SAFE_TOP_PCT = 18;
const SAFE_BOTTOM_PCT = 22;
const SAFE_SIDE_PCT = 6;

const clampPct = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

export default function ExploreScreen() {
  const { user } = useAuthContext();
  const [filterType, setFilterType] = useState<"all" | PinType>("all");
  const [activePins, setActivePins] = useState<Pin[]>([]);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const handleCardPress = (pin: Pin) => {
    const isOwnActivity =
      user?.name &&
      pin.ownerName &&
      pin.ownerName.toLowerCase().trim() === user.name.toLowerCase().trim();

    if (isOwnActivity) {
      Alert.alert(
        "Your Activity Post",
        "You created this activity post! You cannot join or chat with yourself as a partner.",
      );
      return;
    }

    router.push({
      pathname: "/(screens)/activity-chat",
      params: {
        title: pin.title,
        user: pin.ownerName,
        userId: pin.id,
        place: pin.venue,
        right: pin.price || "Nearby",
        type:
          pin.type === "ticket"
            ? "MOVIE TICKET"
            : pin.type === "day_mates"
              ? "DAY MATES"
              : "LOST & FOUND",
        avatar: pin.ownerAvatar,
      },
    });
  };

  const filteredPins = activePins.filter((p) =>
    filterType === "all" ? true : p.type === filterType,
  );

  useEffect(() => {
    const loadActivePins = async () => {
      try {
        const d = (await ApiService.post("/api/activity/explore")) as Pin[];
        const list = Array.isArray(d) ? d : [];
        setActivePins(list);
        if (list.length > 0) setSelectedPin(list[0]);
      } catch (error) {
        console.error(error);
      }
    };
    loadActivePins();
  }, []);

  const badgeFor = (t: PinType) =>
    t === "ticket"
      ? "MOVIE DEAL"
      : t === "day_mates"
        ? "DAY MATE PLAN"
        : "LOST BROADCAST";

  const colorFor = (t: PinType) =>
    t === "ticket" ? "#7C3AED" : t === "day_mates" ? "#D97706" : "#059669";

  return (
    <View style={s.container}>
      {/* MAP CANVAS GRID */}
      <View style={s.mapCanvas}>
        <View style={s.gridContainer}>
          {[...Array(12)].map((_, i) => (
            <View
              key={`v-${i}`}
              style={[s.gridLineVert, { left: `${(i + 1) * 8}%` }]}
            />
          ))}
          {[...Array(20)].map((_, i) => (
            <View
              key={`h-${i}`}
              style={[s.gridLineHoriz, { top: `${(i + 1) * 5}%` }]}
            />
          ))}
        </View>

        <View style={s.glowOrb1} />
        <View style={s.glowOrb2} />

        {/* Pins — clamped inside safe zone so they never render outside the visible map */}
        {filteredPins.map((pin) => {
          const isSelected = selectedPin?.id === pin.id;
          const top = clampPct(pin.lat, SAFE_TOP_PCT, 100 - SAFE_BOTTOM_PCT);
          const left = clampPct(pin.lng, SAFE_SIDE_PCT, 100 - SAFE_SIDE_PCT);
          const color = colorFor(pin.type);
          const labelBelow = top <= SAFE_TOP_PCT + 6;

          return (
            <TouchableOpacity
              key={pin.id}
              onPress={() => setSelectedPin(pin)}
              activeOpacity={0.8}
              style={[s.markerWrapper, { top: `${top}%`, left: `${left}%` }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={s.markerContainer}>
                <View
                  style={[
                    s.pingRing,
                    { backgroundColor: color },
                    isSelected && s.ringActive,
                  ]}
                />
                <View
                  style={[
                    s.markerPin,
                    { backgroundColor: color },
                    isSelected && s.markerSelected,
                  ]}
                >
                  <Ionicons
                    name="location"
                    size={moderateScale(12)}
                    color="#FFFFFF"
                  />
                </View>

                {isSelected && (
                  <View
                    style={[s.markerLabel, labelBelow && s.markerLabelBelow]}
                  >
                    <Text style={s.markerLabelText}>{pin.ownerName}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TOP OVERLAY */}
      <View style={s.floatingOverlay} pointerEvents="box-none">
        <View style={s.infoCard}>
          <View style={s.infoIconBg}>
            <Ionicons
              name="compass-outline"
              size={moderateScale(18)}
              color="#A78BFA"
            />
          </View>
          <View style={s.infoTexts}>
            <Text style={s.infoTitle}>Radar active around Mumbai</Text>
            <Text style={s.infoDesc}>
              Showing people within 5 km of your location
            </Text>
          </View>
        </View>

        <View style={s.filtersRow}>
          {(
            [
              { id: "all", label: "All Items" },
              { id: "ticket", label: "Tickets 🎟️" },
              { id: "day_mates", label: "Buddies 👥" },
              { id: "lost", label: "Lost & Found 📢" },
            ] as const
          ).map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => {
                setFilterType(opt.id);
                const matching = activePins.filter((p) =>
                  opt.id === "all" ? true : p.type === opt.id,
                );
                setSelectedPin(matching[0] ?? null);
              }}
              activeOpacity={0.8}
              style={[
                s.filterPill,
                filterType === opt.id && s.filterPillSelected,
              ]}
            >
              <Text
                style={[
                  s.filterPillText,
                  filterType === opt.id && s.filterPillTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* BOTTOM DETAILS */}
      <View style={s.bottomPanel} pointerEvents="box-none">
        {selectedPin ? (
          <TouchableOpacity
            style={s.detailsCard}
            onPress={() => handleCardPress(selectedPin)}
            activeOpacity={0.85}
          >
            <View
              style={[
                s.statusDot,
                { backgroundColor: colorFor(selectedPin.type) },
              ]}
            />
            <Image
              source={{ uri: selectedPin.ownerAvatar }}
              style={s.detailsAvatar}
            />
            <View style={s.detailsCol}>
              <Text style={s.detailsBadgeText}>
                {badgeFor(selectedPin.type)}
              </Text>
              <Text style={s.detailsTitle} numberOfLines={1}>
                {selectedPin.title}
              </Text>
              <View style={s.detailsLocRow}>
                <Ionicons
                  name="location-outline"
                  size={moderateScale(11)}
                  color="#94A3B8"
                />
                <Text style={s.detailsLocText} numberOfLines={1}>
                  {selectedPin.venue}
                </Text>
              </View>
              <View style={s.detailsBottomRow}>
                <Text style={s.detailsByText}>
                  Post by{" "}
                  <Text style={s.detailsOwnerName}>
                    {selectedPin.ownerName}
                  </Text>
                </Text>
                {selectedPin.price ? (
                  <Text style={s.detailsPrice}>{selectedPin.price}</Text>
                ) : (
                  <View style={s.connectRow}>
                    <Text style={s.connectText}>Connect</Text>
                    <Ionicons
                      name="arrow-forward-outline"
                      size={moderateScale(10)}
                      color="#A78BFA"
                    />
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={s.emptyDetailsCard}>
            <Text style={s.emptyDetailsText}>
              Tap any active radar point to inspect
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 8 },
  default: {},
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070514" },
  mapCanvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0A071D",
    overflow: "hidden",
  },
  gridContainer: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },
  gridLineVert: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#FFFFFF",
  },
  gridLineHoriz: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#FFFFFF",
  },
  glowOrb1: {
    position: "absolute",
    top: "15%",
    left: "5%",
    width: scale(180),
    height: scale(180),
    borderRadius: scale(90),
    backgroundColor: "rgba(124, 58, 237, 0.08)",
  },
  glowOrb2: {
    position: "absolute",
    bottom: "25%",
    right: "5%",
    width: scale(220),
    height: scale(220),
    borderRadius: scale(110),
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },
  // Wrapper size == ring size so we can center via negative margins of half the ring.
  // This anchors the marker's visual center exactly on (top%, left%).
  markerWrapper: {
    position: "absolute",
    width: scale(RING_SIZE),
    height: scale(RING_SIZE),
    marginLeft: -scale(HALF_RING),
    marginTop: -scale(HALF_RING),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pingRing: {
    position: "absolute",
    width: scale(RING_SIZE),
    height: scale(RING_SIZE),
    borderRadius: scale(HALF_RING),
    opacity: 0.2,
  },
  ringActive: { transform: [{ scale: 1.3 }], opacity: 0.4 },
  markerPin: {
    width: scale(PIN_SIZE),
    height: scale(PIN_SIZE),
    borderRadius: scale(HALF_PIN),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  markerSelected: {
    borderColor: "#FFFFFF",
    transform: [{ scale: 1.2 }],
  },
  markerLabel: {
    position: "absolute",
    bottom: scale(28),
    backgroundColor: "#120E2C",
    borderRadius: scale(10),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  markerLabelBelow: {
    bottom: undefined,
    top: scale(28),
  },
  markerLabelText: {
    fontSize: moderateScale(8),
    color: "#FFFFFF",
    fontWeight: "900",
  },
  floatingOverlay: {
    position: "absolute",
    top: verticalScale(16),
    left: scale(20),
    right: scale(20),
    zIndex: 20,
    gap: verticalScale(10),
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(18, 14, 44, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: scale(16),
    padding: scale(10),
    alignItems: "center",
    gap: scale(10),
  },
  infoIconBg: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(10),
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTexts: { flex: 1 },
  infoTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  infoDesc: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
    marginTop: scale(1),
  },
  filtersRow: { flexDirection: "row", gap: scale(6), flexWrap: "wrap" },
  filterPill: {
    backgroundColor: "rgba(18, 14, 44, 0.75)",
    borderRadius: scale(14),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  filterPillSelected: { backgroundColor: "#7C3AED", borderColor: "#A78BFA" },
  filterPillText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    color: "#D1D5DB",
  },
  filterPillTextSelected: { color: "#FFFFFF" },
  bottomPanel: {
    position: "absolute",
    bottom: verticalScale(20),
    left: scale(20),
    right: scale(20),
    zIndex: 20,
  },
  detailsCard: {
    backgroundColor: "rgba(18, 14, 44, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: scale(24),
    padding: scale(14),
    flexDirection: "row",
    gap: scale(12),
    position: "relative",
    ...shadow,
  },
  statusDot: {
    position: "absolute",
    top: scale(14),
    right: scale(14),
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  detailsAvatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(16),
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  detailsCol: { flex: 1, justifyContent: "space-between" },
  detailsBadgeText: {
    fontSize: moderateScale(8.5),
    fontWeight: "900",
    color: "#A78BFA",
    letterSpacing: 0.5,
  },
  detailsTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: verticalScale(1),
  },
  detailsLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: verticalScale(1),
  },
  detailsLocText: {
    fontSize: moderateScale(9.5),
    color: "#94A3B8",
    fontWeight: "500",
    flex: 1,
  },
  detailsBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: verticalScale(6),
    marginTop: verticalScale(4),
  },
  detailsByText: { fontSize: moderateScale(9.5), color: "#94A3B8" },
  detailsOwnerName: { fontWeight: "700", color: "#FFFFFF" },
  detailsPrice: {
    fontSize: moderateScale(11),
    fontWeight: "900",
    color: "#FBBF24",
  },
  connectRow: { flexDirection: "row", alignItems: "center", gap: scale(2) },
  connectText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    color: "#A78BFA",
    textTransform: "uppercase",
  },
  emptyDetailsCard: {
    backgroundColor: "rgba(18, 14, 44, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: scale(20),
    paddingVertical: scale(16),
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  emptyDetailsText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#94A3B8",
  },
});
