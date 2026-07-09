// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TextInput,
//   Image,
//   Pressable,
// } from "react-native";
// import {
//   Search,
//   MapPin,
//   SlidersHorizontal,
//   ArrowRight,
//   Compass,
//   Sparkles,
//   AlertTriangle,
// } from "lucide-react-native";
// import { useStore, Post } from "../../hooks/useStore";
// import { useLocalSearchParams } from "expo-router";

// export default function ExploreScreen() {
//   const { state, setActivePostId } = useStore();
//   const params = useLocalSearchParams();

//   const [activeCategory, setActiveCategory] = useState<
//     "All" | "Movie Tickets" | "Lost & Found" | "Day Mates"
//   >("All");
//   const [searchQuery, setSearchQuery] = useState("");

//   // Pre-select category if passed from home
//   useEffect(() => {
//     if (params && params.category) {
//       const cat = params.category as any;
//       if (["Movie Tickets", "Lost & Found", "Day Mates"].includes(cat)) {
//         setActiveCategory(cat);
//       }
//     }
//   }, [params]);

//   const categoryPills: (
//     | "All"
//     | "Movie Tickets"
//     | "Lost & Found"
//     | "Day Mates"
//   )[] = ["All", "Movie Tickets", "Lost & Found", "Day Mates"];

//   // Helper filter
//   const filterBySearch = (items: Post[]) => {
//     return items.filter(
//       (item) =>
//         item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.host.name.toLowerCase().includes(searchQuery.toLowerCase()),
//     );
//   };

//   const movieTickets = filterBySearch(
//     state.posts.filter((p) => p.category === "Movie Tickets"),
//   );
//   const lostAndFound = filterBySearch(
//     state.posts.filter((p) => p.category === "Lost & Found"),
//   );
//   const dayMates = filterBySearch(
//     state.posts.filter((p) => p.category === "Day Mates"),
//   );

//   return (
//     <View className="flex-1 bg-slate-950">
//       {/* SCREEN 2: Explore Top Area */}
//       <View className="pt-16 pb-4 px-6 bg-slate-900 border-b border-slate-800">
//         <View className="flex-row justify-between items-center">
//           <View>
//             <Text className="text-white text-2xl font-black tracking-tight">
//               Explore
//             </Text>
//             {/* Interactive location selection */}
//             <Pressable className="flex-row items-center gap-1.5 mt-1.5">
//               <MapPin size={12} color="#a855f7" />
//               <Text className="text-slate-300 text-xs font-semibold">
//                 Mumbai
//               </Text>
//               <Text className="text-purple-400 text-3xs">▼</Text>
//             </Pressable>
//           </View>
//         </View>

//         {/* Search Bar */}
//         <View className="mt-4 flex-row gap-3">
//           <View className="flex-1 flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5">
//             <Search size={16} color="#64748b" />
//             <TextInput
//               placeholder="Search activities, concerts, users..."
//               placeholderTextColor="#475569"
//               value={searchQuery}
//               onChangeText={setSearchQuery}
//               className="flex-1 ml-2.5 text-white text-xs font-semibold"
//             />
//           </View>
//           <Pressable className="w-11 h-11 bg-slate-950 border border-slate-800 rounded-xl items-center justify-center active:bg-slate-900">
//             <SlidersHorizontal size={16} color="#c084fc" />
//           </Pressable>
//         </View>
//       </View>

//       {/* Categories Horizontal Scroll */}
//       <View className="py-4 border-b border-slate-900 bg-slate-950">
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
//         >
//           {categoryPills.map((cat) => (
//             <Pressable
//               key={cat}
//               onPress={() => setActiveCategory(cat)}
//               className={`px-5 py-2.5 rounded-full border ${
//                 activeCategory === cat
//                   ? "bg-purple-600 border-purple-500"
//                   : "bg-slate-900 border-slate-800"
//               }`}
//             >
//               <Text
//                 className={`text-2xs font-extrabold ${activeCategory === cat ? "text-white" : "text-slate-400"}`}
//               >
//                 {cat === "Movie Tickets" ? "Movies" : cat}
//               </Text>
//             </Pressable>
//           ))}
//         </ScrollView>
//       </View>

//       {/* Main Explore Lists */}
//       <ScrollView
//         className="flex-1 px-6 pt-4 pb-12"
//         showsVerticalScrollIndicator={false}
//       >
//         {/* SECTION 1: Movie Tickets */}
//         {(activeCategory === "All" || activeCategory === "Movie Tickets") && (
//           <View className="mb-6">
//             <View className="flex-row justify-between items-center mb-3">
//               <Text className="text-white text-sm font-black tracking-tight">
//                 Movie Tickets
//               </Text>
//               <Pressable className="flex-row items-center gap-1">
//                 <Text className="text-purple-400 text-3xs font-bold">
//                   View all
//                 </Text>
//                 <ArrowRight size={10} color="#c084fc" />
//               </Pressable>
//             </View>

//             <View className="gap-3">
//               {movieTickets.map((item) => (
//                 <Pressable
//                   key={item.id}
//                   onPress={() => setActivePostId(item.id)}
//                   className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden active:bg-slate-850 flex-row"
//                 >
//                   <Image
//                     source={{ uri: item.image }}
//                     className="w-24 h-24"
//                     resizeMode="cover"
//                   />
//                   <View className="p-3 flex-1 justify-between">
//                     <View>
//                       <Text
//                         className="text-white text-xs font-black"
//                         numberOfLines={1}
//                       >
//                         {item.title}
//                       </Text>
//                       <Text
//                         className="text-slate-400 text-4xs font-medium mt-1"
//                         numberOfLines={1}
//                       >
//                         {item.location}
//                       </Text>
//                     </View>
//                     <View className="flex-row justify-between items-end">
//                       <Text className="text-slate-500 text-5xs font-semibold">
//                         {item.date.split("•")[0]}
//                       </Text>
//                       <Text className="text-purple-400 text-4xs font-black">
//                         {item.price || "Free"}
//                       </Text>
//                     </View>
//                   </View>
//                 </Pressable>
//               ))}

//               {movieTickets.length === 0 && (
//                 <Text className="text-slate-600 text-xs px-2">
//                   No movie tickets available matching criteria
//                 </Text>
//               )}
//             </View>
//           </View>
//         )}

//         {/* SECTION 2: Lost & Found */}
//         {(activeCategory === "All" || activeCategory === "Lost & Found") && (
//           <View className="mb-6">
//             <View className="flex-row justify-between items-center mb-3">
//               <Text className="text-white text-sm font-black tracking-tight">
//                 Lost & Found
//               </Text>
//               <Pressable className="flex-row items-center gap-1">
//                 <Text className="text-purple-400 text-3xs font-bold">
//                   View all
//                 </Text>
//                 <ArrowRight size={10} color="#c084fc" />
//               </Pressable>
//             </View>

//             <View className="gap-3">
//               {lostAndFound.map((item) => (
//                 <Pressable
//                   key={item.id}
//                   onPress={() => setActivePostId(item.id)}
//                   className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden active:bg-slate-850 flex-row"
//                 >
//                   <Image
//                     source={{ uri: item.image }}
//                     className="w-24 h-24"
//                     resizeMode="cover"
//                   />
//                   <View className="p-3 flex-1 justify-between">
//                     <View>
//                       <Text
//                         className="text-white text-xs font-black"
//                         numberOfLines={1}
//                       >
//                         {item.title}
//                       </Text>
//                       <Text
//                         className="text-slate-400 text-4xs font-medium mt-1"
//                         numberOfLines={1}
//                       >
//                         {item.location}
//                       </Text>
//                     </View>
//                     <View className="flex-row justify-between items-end">
//                       <Text className="text-slate-500 text-5xs font-semibold">
//                         {item.date}
//                       </Text>
//                       <View className="bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
//                         <Text className="text-teal-400 text-5xs font-black uppercase">
//                           Found
//                         </Text>
//                       </View>
//                     </View>
//                   </View>
//                 </Pressable>
//               ))}

//               {lostAndFound.length === 0 && (
//                 <Text className="text-slate-600 text-xs px-2">
//                   No lost & found items available matching criteria
//                 </Text>
//               )}
//             </View>
//           </View>
//         )}

//         {/* SECTION 3: Day Mates */}
//         {(activeCategory === "All" || activeCategory === "Day Mates") && (
//           <View className="mb-12">
//             <View className="flex-row justify-between items-center mb-3">
//               <Text className="text-white text-sm font-black tracking-tight">
//                 Day Mates
//               </Text>
//               <Pressable className="flex-row items-center gap-1">
//                 <Text className="text-purple-400 text-3xs font-bold">
//                   View all
//                 </Text>
//                 <ArrowRight size={10} color="#c084fc" />
//               </Pressable>
//             </View>

//             <View className="gap-3">
//               {dayMates.map((item) => (
//                 <Pressable
//                   key={item.id}
//                   onPress={() => setActivePostId(item.id)}
//                   className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden active:bg-slate-850 flex-row"
//                 >
//                   <Image
//                     source={{ uri: item.image }}
//                     className="w-24 h-24"
//                     resizeMode="cover"
//                   />
//                   <View className="p-3 flex-1 justify-between">
//                     <View>
//                       <Text
//                         className="text-white text-xs font-black"
//                         numberOfLines={1}
//                       >
//                         {item.title}
//                       </Text>
//                       <Text
//                         className="text-slate-400 text-4xs font-medium mt-1"
//                         numberOfLines={1}
//                       >
//                         {item.location}
//                       </Text>
//                     </View>
//                     <View className="flex-row justify-between items-end">
//                       <Text className="text-slate-500 text-5xs font-semibold">
//                         {item.date}
//                       </Text>
//                       <View className="bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
//                         <Text className="text-purple-400 text-5xs font-black uppercase">
//                           Join
//                         </Text>
//                       </View>
//                     </View>
//                   </View>
//                 </Pressable>
//               ))}

//               {dayMates.length === 0 && (
//                 <Text className="text-slate-600 text-xs px-2">
//                   No Day Mates meetups available matching criteria
//                 </Text>
//               )}
//             </View>
//           </View>
//         )}
//       </ScrollView>
//     </View>
//   );
// }
// @ts-nocheck
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";

interface Pin {
  id: string;
  lat: number; // percentage from top
  lng: number; // percentage from left
  title: string;
  type: "ticket" | "buddy" | "lost";
  venue: string;
  price?: string;
  ownerName: string;
  ownerAvatar: string;
}

const ACTIVE_PINS: Pin[] = [
  {
    id: "p1",
    lat: 38,
    lng: 28,
    title: "Avengers: Endgame Ticket",
    type: "ticket",
    venue: "PVR Phoenix Marketcity",
    price: "₹500",
    ownerName: "Rohan",
    ownerAvatar: "https://i.pravatar.cc/80?img=11",
  },
  {
    id: "p2",
    lat: 52,
    lng: 68,
    title: "Morning Walk Buddy",
    type: "buddy",
    venue: "Bandra Reclamation",
    ownerName: "Ananya",
    ownerAvatar: "https://i.pravatar.cc/80?img=20",
  },
  {
    id: "p3",
    lat: 68,
    lng: 35,
    title: "Black Wallet Lost",
    type: "lost",
    venue: "Near Dadar Station",
    ownerName: "Neha",
    ownerAvatar: "https://i.pravatar.cc/80?img=32",
  },
  {
    id: "p4",
    lat: 25,
    lng: 72,
    title: "Coldplay Ticket Sale",
    type: "ticket",
    venue: "National Gymkhana",
    price: "₹4500",
    ownerName: "Marcus",
    ownerAvatar: "https://i.pravatar.cc/80?img=12",
  },
];

export default function ExploreScreen() {
  const { width, height } = useWindowDimensions();
  const [selectedPin, setSelectedPin] = useState<Pin | null>(ACTIVE_PINS[1]); // Default to Ananya's walk buddy
  const [filterType, setFilterType] = useState<
    "all" | "ticket" | "buddy" | "lost"
  >("all");

  const filteredPins = ACTIVE_PINS.filter((p) =>
    filterType === "all" ? true : p.type === filterType,
  );

  return (
    <View style={s.container}>
      {/* MAP CANVAS GRID */}
      <View style={s.mapCanvas}>
        {/* Abstract Map Grid Lines */}
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

        {/* Ambient Glow Orbs */}
        <View style={s.glowOrb1} />
        <View style={s.glowOrb2} />

        {/* Pulsing Interactive Pins */}
        {filteredPins.map((pin) => {
          const isSelected = selectedPin?.id === pin.id;
          return (
            <TouchableOpacity
              key={pin.id}
              onPress={() => setSelectedPin(pin)}
              activeOpacity={0.8}
              style={[
                s.markerWrapper,
                { top: `${pin.lat}%`, left: `${pin.lng}%` },
              ]}
            >
              <View style={s.markerContainer}>
                {/* Visual Dot Ring */}
                <View
                  style={[
                    s.pingRing,
                    pin.type === "ticket" && s.ringTicket,
                    pin.type === "buddy" && s.ringBuddy,
                    pin.type === "lost" && s.ringLost,
                    isSelected && s.ringActive,
                  ]}
                />

                {/* Main Marker Dot */}
                <View
                  style={[
                    s.markerPin,
                    pin.type === "ticket" && { backgroundColor: "#7C3AED" },
                    pin.type === "buddy" && { backgroundColor: "#D97706" },
                    pin.type === "lost" && { backgroundColor: "#059669" },
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
                  <View style={s.markerLabel}>
                    <Text style={s.markerLabelText}>{pin.ownerName}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* FLOAT MAP SEARCH OVERLAY */}
      <View style={s.floatingOverlay}>
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

        {/* Horizontal Quick Filter Pills */}
        <View style={s.filtersRow}>
          {(
            [
              { id: "all", label: "All Items" },
              { id: "ticket", label: "Tickets 🎟️" },
              { id: "buddy", label: "Buddies 👥" },
              { id: "lost", label: "Lost & Found 📢" },
            ] as const
          ).map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => {
                setFilterType(opt.id);
                const matching = ACTIVE_PINS.filter((p) =>
                  opt.id === "all" ? true : p.type === opt.id,
                );
                if (matching.length > 0) setSelectedPin(matching[0]);
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

      {/* FLOATING TARGET CARD DETAILS */}
      <View style={s.bottomPanel}>
        {selectedPin ? (
          <View style={s.detailsCard}>
            {/* Status dot */}
            <View
              style={[
                s.statusDot,
                selectedPin.type === "ticket" && { backgroundColor: "#7C3AED" },
                selectedPin.type === "buddy" && { backgroundColor: "#D97706" },
                selectedPin.type === "lost" && { backgroundColor: "#059669" },
              ]}
            />

            <Image
              source={{ uri: selectedPin.ownerAvatar }}
              style={s.detailsAvatar}
            />

            <View style={s.detailsCol}>
              <Text style={s.detailsBadgeText}>
                {selectedPin.type === "ticket"
                  ? "MOVIE DEAL"
                  : selectedPin.type === "buddy"
                    ? "DAY MATE PLAN"
                    : "LOST BROADCAST"}
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
          </View>
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
  android: {
    elevation: 8,
  },
  default: {},
});

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070514",
  },
  mapCanvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0A071D",
    overflow: "hidden",
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
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
  markerWrapper: {
    position: "absolute",
    transform: [{ translateX: scale(-16) }, { translateY: scale(-16) }],
    zIndex: 10,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pingRing: {
    position: "absolute",
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    opacity: 0.2,
  },
  ringTicket: { backgroundColor: "#7C3AED" },
  ringBuddy: { backgroundColor: "#D97706" },
  ringLost: { backgroundColor: "#059669" },
  ringActive: {
    transform: [{ scale: 1.3 }],
    opacity: 0.4,
  },
  markerPin: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
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
  infoTexts: {
    flex: 1,
  },
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
  filtersRow: {
    flexDirection: "row",
    gap: scale(6),
  },
  filterPill: {
    backgroundColor: "rgba(18, 14, 44, 0.75)",
    borderRadius: scale(14),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  filterPillSelected: {
    backgroundColor: "#7C3AED",
    borderColor: "#A78BFA",
  },
  filterPillText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    color: "#D1D5DB",
  },
  filterPillTextSelected: {
    color: "#FFFFFF",
  },
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
  detailsCol: {
    flex: 1,
    justifyContent: "space-between",
  },
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
  detailsByText: {
    fontSize: moderateScale(9.5),
    color: "#94A3B8",
  },
  detailsOwnerName: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
  detailsPrice: {
    fontSize: moderateScale(11),
    fontWeight: "900",
    color: "#FBBF24",
  },
  connectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
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
