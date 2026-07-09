// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TextInput,
//   Pressable,
//   Image,
//   Platform,
// } from "react-native";
// import {
//   Search,
//   Sparkles,
//   Flame,
//   Bell,
//   Ticket,
//   HelpCircle,
//   UserCheck,
//   Compass,
//   ArrowRight,
//   ShieldCheck,
//   Heart,
// } from "lucide-react-native";
// import { useStore } from "../../hooks/useStore";
// import { router } from "expo-router";
// import { useAuthContext } from "@/context/AuthContext";

// export default function HomeScreen() {
//   const { state, setActivePostId, setShowNotifications } = useStore();
//   const [searchQuery, setSearchQuery] = useState("");
//   const user = useAuthContext().user;

//   const getGreeting = () => {
//     const hr = new Date().getHours();
//     const name = user ? user.name.split(" ")[0] : "Guest";
//     // Use lowercased name style like the screenshot: ""
//     const displayName = name.toLowerCase();
//     if (hr < 12) return `Good Morning, ${displayName}`;
//     if (hr < 17) return `Good Afternoon, ${displayName}`;
//     return `Good Evening, ${displayName}`;
//   };

//   // Unread notifications calculation
//   const unreadNotificationsCount = state.notifications.filter(
//     (n) => !n.read,
//   ).length;

//   // Filter posts search
//   const filteredPopular = state.posts.filter(
//     (post) =>
//       post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       post.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       post.category.toLowerCase().includes(searchQuery.toLowerCase()),
//   );

//   return (
//     <View className="flex-1 bg-slate-950">
//       {/* SCREEN 1: Welcome Header */}
//       <View className="pt-16 pb-6 px-6 bg-slate-900 border-b border-slate-800">
//         <View className="flex-row justify-between items-center">
//           <View>
//             <View className="flex-row items-center gap-1.5">
//               <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
//                 {getGreeting()}---
//               </Text>
//               <Text className="text-sm">👋</Text>
//             </View>
//             <Text className="text-white text-2xl font-black tracking-tight mt-1 leading-none">
//               What brings
//             </Text>
//             <Text className="text-white text-2xl font-black tracking-tight mt-0.5 leading-none">
//               you here today?
//             </Text>
//           </View>

//           {/* Interactive Notifications Bell */}
//           <Pressable
//             onPress={() => setShowNotifications(true)}
//             className="w-11 h-11 rounded-full bg-slate-950 border border-slate-800 items-center justify-center relative active:bg-slate-900"
//           >
//             <Bell size={20} color="#cbd5e1" />
//             {unreadNotificationsCount > 0 && (
//               <View className="absolute top-2 right-2 w-3 h-3 rounded-full bg-purple-500 border border-slate-900 justify-center items-center">
//                 <View className="w-1 h-1 rounded-full bg-white" />
//               </View>
//             )}
//           </Pressable>
//         </View>

//         {/* Dynamic Search */}
//         <View className="mt-6 flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5">
//           <Search size={16} color="#64748b" />
//           <TextInput
//             placeholder="Search tickets, lost wallets, day mates..."
//             placeholderTextColor="#475569"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             className="flex-1 ml-3 text-white text-xs font-medium"
//           />
//         </View>
//       </View>

//       <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
//         {/* Wireframe-accurate Core Categories Grid */}
//         <View className="p-6 gap-4">
//           {/* Card 1: Movie Tickets */}
//           <Pressable
//             onPress={() =>
//               router.push({
//                 pathname: "/(tabs)/explore",
//                 params: { category: "Movie Tickets" },
//               })
//             }
//             className="bg-purple-950/20 border border-purple-900/35 rounded-2xl p-5 flex-row justify-between items-center active:bg-purple-950/30 overflow-hidden"
//           >
//             <View className="flex-1 pr-4">
//               <View className="flex-row items-center gap-2 mb-1.5">
//                 <View className="w-6 h-6 rounded-md bg-purple-500/10 items-center justify-center">
//                   <Ticket size={14} color="#c084fc" />
//                 </View>
//                 <Text className="text-purple-400 text-3xs font-extrabold uppercase tracking-widest">
//                   Swap Tickets
//                 </Text>
//               </View>
//               <Text className="text-white text-base font-black tracking-tight mb-1">
//                 Movie Tickets
//               </Text>
//               <Text className="text-slate-400 text-3xs font-medium leading-relaxed">
//                 Buy or sell spare movie tickets easily with nearby users.
//               </Text>
//             </View>
//             <Image
//               source={{
//                 uri: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150",
//               }}
//               className="w-16 h-16 rounded-xl"
//               resizeMode="cover"
//             />
//           </Pressable>

//           {/* Card 2: Lost & Found */}
//           <Pressable
//             onPress={() =>
//               router.push({
//                 pathname: "/(tabs)/explore",
//                 params: { category: "Lost & Found" },
//               })
//             }
//             className="bg-teal-950/20 border border-teal-900/35 rounded-2xl p-5 flex-row justify-between items-center active:bg-teal-950/30 overflow-hidden"
//           >
//             <View className="flex-1 pr-4">
//               <View className="flex-row items-center gap-2 mb-1.5">
//                 <View className="w-6 h-6 rounded-md bg-teal-500/10 items-center justify-center">
//                   <HelpCircle size={14} color="#2dd4bf" />
//                 </View>
//                 <Text className="text-teal-400 text-3xs font-extrabold uppercase tracking-widest">
//                   Help Others
//                 </Text>
//               </View>
//               <Text className="text-white text-base font-black tracking-tight mb-1">
//                 Lost & Found
//               </Text>
//               <Text className="text-slate-400 text-3xs font-medium leading-relaxed">
//                 Help others get back what they lost on the go.
//               </Text>
//             </View>
//             <Image
//               source={{
//                 uri: "https://images.unsplash.com/photo-1627124118303-19d5f0ce0e85?w=150",
//               }}
//               className="w-16 h-16 rounded-xl"
//               resizeMode="cover"
//             />
//           </Pressable>

//           {/* Card 3: Day Mates */}
//           <Pressable
//             onPress={() =>
//               router.push({
//                 pathname: "/(tabs)/explore",
//                 params: { category: "Day Mates" },
//               })
//             }
//             className="bg-amber-950/20 border border-amber-900/35 rounded-2xl p-5 flex-row justify-between items-center active:bg-amber-950/30 overflow-hidden"
//           >
//             <View className="flex-1 pr-4">
//               <View className="flex-row items-center gap-2 mb-1.5">
//                 <View className="w-6 h-6 rounded-md bg-amber-500/10 items-center justify-center">
//                   <UserCheck size={14} color="#fbbf24" />
//                 </View>
//                 <Text className="text-amber-400 text-3xs font-extrabold uppercase tracking-widest">
//                   Share Activities
//                 </Text>
//               </View>
//               <Text className="text-white text-base font-black tracking-tight mb-1">
//                 Day Mates
//               </Text>
//               <Text className="text-slate-400 text-3xs font-medium leading-relaxed">
//                 Find someone to share activities and events with.
//               </Text>
//             </View>
//             <Image
//               source={{
//                 uri: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=150",
//               }}
//               className="w-16 h-16 rounded-xl"
//               resizeMode="cover"
//             />
//           </Pressable>
//         </View>

//         {/* Popular Around You Section */}
//         <View className="px-6 pb-12">
//           <View className="flex-row justify-between items-center mb-4">
//             <View className="flex-row items-center gap-2">
//               <Sparkles size={16} color="#c084fc" />
//               <Text className="text-white text-lg font-black tracking-tight">
//                 Popular around you
//               </Text>
//             </View>
//             <Pressable
//               onPress={() => router.push("/(tabs)/explore")}
//               className="flex-row items-center gap-1"
//             >
//               <Text className="text-purple-400 text-xs font-bold">
//                 View all
//               </Text>
//               <ArrowRight size={14} color="#c084fc" />
//             </Pressable>
//           </View>

//           {/* Vertical items feed from our Store */}
//           <View className="gap-4">
//             {filteredPopular.slice(0, 4).map((post) => (
//               <Pressable
//                 key={post.id}
//                 onPress={() => setActivePostId(post.id)}
//                 className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-row gap-4 active:bg-slate-850"
//               >
//                 {/* Event Image */}
//                 <Image
//                   source={{ uri: post.image }}
//                   className="w-20 h-20 rounded-xl"
//                   resizeMode="cover"
//                 />

//                 {/* Details */}
//                 <View className="flex-1 justify-between">
//                   <View>
//                     <View className="flex-row justify-between items-start">
//                       <Text className="text-purple-400 text-4xs font-black uppercase tracking-wider">
//                         {post.category}
//                       </Text>
//                       <Text className="text-slate-500 text-4xs font-bold">
//                         {post.spotsDetail}
//                       </Text>
//                     </View>
//                     <Text
//                       className="text-white text-sm font-black mt-1 leading-tight"
//                       numberOfLines={1}
//                     >
//                       {post.title}
//                     </Text>
//                     <Text
//                       className="text-slate-400 text-4xs font-medium mt-1 leading-tight"
//                       numberOfLines={1}
//                     >
//                       {post.location}
//                     </Text>
//                   </View>

//                   <View className="flex-row justify-between items-end pt-2 border-t border-slate-850">
//                     <View className="flex-row items-center gap-1.5">
//                       <Image
//                         source={{ uri: post.host.avatar }}
//                         className="w-5 h-5 rounded-full border border-slate-800"
//                       />
//                       <Text className="text-slate-400 text-5xs font-bold">
//                         {post.host.name.split(" ")[0]}
//                       </Text>
//                     </View>
//                     <Text className="text-purple-300 text-4xs font-black">
//                       {post.price || "Daymate Request"}
//                     </Text>
//                   </View>
//                 </View>
//               </Pressable>
//             ))}

//             {filteredPopular.length === 0 && (
//               <View className="bg-slate-900/40 border border-slate-850 rounded-2xl p-8 items-center">
//                 <Text className="text-slate-500 text-xs font-semibold">
//                   No popular events matching filter
//                 </Text>
//               </View>
//             )}
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }
// @ts-nocheck
// @ts-nocheck
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import { useAuthContext } from "@/context/AuthContext";

// Types matching high-fidelity listings
interface Listing {
  id: string;
  type: "MOVIE TICKET" | "LOST & FOUND" | "DAY MATES";
  title: string;
  location: string;
  ownerName: string;
  ownerAvatar: string;
  image: string;
  rightLabel: string;
  price?: string;
  isDaymateRequest?: boolean;
  category: "Walking" | "Coffee" | "Gym" | "Movies" | "Cycling" | "More";
}

const HIGH_FIDELITY_LISTINGS: Listing[] = [
  {
    id: "l1",
    type: "MOVIE TICKET",
    title: "Avengers: Endgame",
    location: "PVR Phoenix Marketcity, Mumbai",
    ownerName: "Rohan",
    ownerAvatar: "https://i.pravatar.cc/80?img=11",
    image:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=150",
    rightLabel: "2 Tickets",
    price: "₹500 each",
    category: "Movies",
  },
  {
    id: "l2",
    type: "MOVIE TICKET",
    title: "Spider-Man: No Way Home",
    location: "PVR Icon, Andheri",
    ownerName: "Ananya",
    ownerAvatar: "https://i.pravatar.cc/80?img=20",
    image:
      "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=150",
    rightLabel: "2 Tickets",
    price: "₹400 each",
    category: "Movies",
  },
  {
    id: "l3",
    type: "LOST & FOUND",
    title: "Black Wallet",
    location: "Found near Dadar Station",
    ownerName: "Neha",
    ownerAvatar: "https://i.pravatar.cc/80?img=32",
    image:
      "https://images.unsplash.com/photo-1627124118123-2654b5be110a?auto=format&fit=crop&q=80&w=150",
    rightLabel: "Found item",
    isDaymateRequest: true,
    category: "More",
  },
  {
    id: "l4",
    type: "DAY MATES",
    title: "Morning Walk Buddy",
    location: "Bandra Reclamation",
    ownerName: "Ananya",
    ownerAvatar: "https://i.pravatar.cc/80?img=20",
    image:
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=150",
    rightLabel: "1.1 km away",
    isDaymateRequest: true,
    category: "Walking",
  },
];

interface HomeScreenProps {
  onOpenCreate: () => void;
  onSelectActionCard: (cardId: string) => void;
  onOpenListingDetails?: (listing: Listing) => void;
  onTriggerNotification?: () => void;
}

export default function HomeScreen({
  onOpenCreate,
  onSelectActionCard,
  onOpenListingDetails,
  onTriggerNotification,
}: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useAuthContext();

  // Categories as styled in the design
  const categories = [
    { id: "Walking", label: "Walking", icon: "walk-outline", color: "#A78BFA" },
    { id: "Coffee", label: "Coffee", icon: "cafe-outline", color: "#FBBF24" },
    { id: "Gym", label: "Gym", icon: "barbell-outline", color: "#60A5FA" },
    { id: "Movies", label: "Movies", icon: "film-outline", color: "#F472B6" },
    {
      id: "Cycling",
      label: "Cycling",
      icon: "bicycle-outline",
      color: "#34D399",
    },
    { id: "More", label: "More", icon: "grid-outline", color: "#94A3B8" },
  ];

  const getGreeting = () => {
    const hr = new Date().getHours();
    const name = user ? user.name.split(" ")[0] : "Guest";
    // Use lowercased name style like the screenshot: ""
    const displayName = name.toLowerCase();
    if (hr < 12) return `Good Morning, ${displayName}`;
    if (hr < 17) return `Good Afternoon, ${displayName}`;
    return `Good Evening, ${displayName}`;
  };

  // Filter listings based on search and active category
  const filteredListings = HIGH_FIDELITY_LISTINGS.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory
      ? item.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* HEADER SECTION */}
        <View style={s.headerRow}>
          <View style={s.headerTextCol}>
            <Text style={s.greeting}>{getGreeting()} 👋</Text>
            <Text style={s.headline}>What brings{"\n"}you here today?</Text>
          </View>

          {/* Notification Bell with Badge */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onTriggerNotification}
            style={s.bellBtn}
          >
            <Ionicons
              name="notifications-outline"
              size={moderateScale(22)}
              color="#FFFFFF"
            />
            <View style={s.badge}>
              <Text style={s.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR & FILTER BUTTON */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Ionicons
              name="search-outline"
              size={moderateScale(18)}
              color="#94A3B8"
              style={s.searchIcon}
            />
            <TextInput
              placeholder="Search tickets, lost items, day mates..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={s.searchInput}
            />
          </View>

          {/* Reset Filters / Settings Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setSelectedCategory(null);
              setSearchQuery("");
            }}
            style={s.filterBtn}
          >
            <Ionicons
              name="options-outline"
              size={moderateScale(18)}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        {/* THREE CORE ACTION CARDS */}
        <View style={s.actionCardsRow}>
          {/* Card 1: Swap Tickets */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onSelectActionCard("swap_tickets")}
            style={[s.actionCard, { backgroundColor: "#1E1245" }]}
          >
            <View style={s.actionCardContent}>
              <View
                style={[
                  s.actionIconContainer,
                  { backgroundColor: "rgba(124, 58, 237, 0.2)" },
                ]}
              >
                <Ionicons
                  name="ticket-outline"
                  size={moderateScale(20)}
                  color="#C084FC"
                />
              </View>
              <View style={s.actionCardTextCol}>
                <Text style={s.actionTitle}>Swap Tickets</Text>
                <Text style={s.actionDesc}>Buy or sell tickets nearby</Text>
              </View>
            </View>
            <View style={[s.arrowBtn, { backgroundColor: "#7C3AED" }]}>
              <Ionicons
                name="arrow-forward-outline"
                size={moderateScale(14)}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>

          {/* Card 2: Day Mates */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onSelectActionCard("day_mates")}
            style={[s.actionCard, { backgroundColor: "#2B1713" }]}
          >
            <View style={s.actionCardContent}>
              <View
                style={[
                  s.actionIconContainer,
                  { backgroundColor: "rgba(245, 158, 11, 0.2)" },
                ]}
              >
                <Ionicons
                  name="people-outline"
                  size={moderateScale(20)}
                  color="#FBBF24"
                />
              </View>
              <View style={s.actionCardTextCol}>
                <Text style={s.actionTitle}>Day Mates</Text>
                <Text style={s.actionDesc}>Find buddies for meetups</Text>
              </View>
            </View>
            <View style={[s.arrowBtn, { backgroundColor: "#D97706" }]}>
              <Ionicons
                name="arrow-forward-outline"
                size={moderateScale(14)}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>

          {/* Card 3: Help Others */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onSelectActionCard("help_others")}
            style={[s.actionCard, { backgroundColor: "#0F2220" }]}
          >
            <View style={s.actionCardContent}>
              <View
                style={[
                  s.actionIconContainer,
                  { backgroundColor: "rgba(16, 185, 129, 0.2)" },
                ]}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={moderateScale(20)}
                  color="#34D399"
                />
              </View>
              <View style={s.actionCardTextCol}>
                <Text style={s.actionTitle}>Help Others</Text>
                <Text style={s.actionDesc}>Lost or found items nearby</Text>
              </View>
            </View>
            <View style={[s.arrowBtn, { backgroundColor: "#059669" }]}>
              <Ionicons
                name="arrow-forward-outline"
                size={moderateScale(14)}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* POPULAR ACTIVITIES SECTION */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Popular Activities</Text>
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <View style={s.viewAllRow}>
              <Text style={s.viewAllText}>View all</Text>
              <Ionicons
                name="chevron-forward-outline"
                size={moderateScale(12)}
                color="#A78BFA"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Categories Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.categoriesScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(isSelected ? null : cat.id)}
                activeOpacity={0.8}
                style={[s.categoryChip, isSelected && s.categoryChipSelected]}
              >
                <View style={[s.catIconBox]}>
                  <Ionicons
                    name={cat.icon}
                    size={moderateScale(18)}
                    color={isSelected ? "#FFFFFF" : cat.color}
                  />
                </View>
                <Text style={[s.catLabel, isSelected && s.catLabelSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* POPULAR AROUND YOU SECTION */}
        <View style={[s.sectionHeader, { marginTop: verticalScale(16) }]}>
          <Text style={s.sectionTitle}>Popular around you</Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory(null);
              setSearchQuery("");
            }}
          >
            <View style={s.viewAllRow}>
              <Text style={s.viewAllText}>View all</Text>
              <Ionicons
                name="chevron-forward-outline"
                size={moderateScale(12)}
                color="#A78BFA"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Listings Feed Cards */}
        <View style={s.listingsList}>
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() =>
                  onOpenListingDetails && onOpenListingDetails(item)
                }
                style={s.listingCard}
              >
                <Image source={{ uri: item.image }} style={s.listingImg} />

                <View style={s.listingContent}>
                  <View style={s.listingMetaRow}>
                    <Text
                      style={[
                        s.typeBadge,
                        item.type === "MOVIE TICKET" && s.badgeTicket,
                        item.type === "LOST & FOUND" && s.badgeLost,
                        item.type === "DAY MATES" && s.badgeMates,
                      ]}
                    >
                      {item.type}
                    </Text>
                  </View>

                  <Text style={s.listingTitle} numberOfLines={1}>
                    {item.title}
                  </Text>

                  <View style={s.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={moderateScale(11)}
                      color="#64748B"
                    />
                    <Text style={s.locationText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>

                  <View style={s.ownerRow}>
                    <Image
                      source={{ uri: item.ownerAvatar }}
                      style={s.ownerAvatar}
                    />
                    <Text style={s.ownerName}>{item.ownerName}</Text>
                  </View>
                </View>

                {/* Right col info */}
                <View style={s.listingRightCol}>
                  <Text
                    style={[
                      s.rightLabel,
                      item.type === "LOST & FOUND"
                        ? { color: "#34D399" }
                        : { color: "#C084FC" },
                    ]}
                  >
                    {item.rightLabel}
                  </Text>

                  {item.price && (
                    <Text style={s.listingPrice}>{item.price}</Text>
                  )}

                  <View style={s.arrowLink}>
                    <Ionicons
                      name="chevron-forward-outline"
                      size={moderateScale(14)}
                      color="#94A3B8"
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>No active postings found</Text>
              <Text style={s.emptyDesc}>
                Try adjusting your keyword filter or categories
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  android: {
    elevation: 3,
  },
  default: {},
});

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070514",
  },
  scrollContent: {
    paddingBottom: verticalScale(100),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
  },
  headerTextCol: {
    flex: 1,
  },
  greeting: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#9E96C7",
    textTransform: "capitalize",
    letterSpacing: 1,
  },
  headline: {
    fontSize: moderateScale(26),
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: moderateScale(30),
    marginTop: verticalScale(4),
  },
  bellBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: scale(8),
    right: scale(8),
    width: scale(14),
    height: scale(14),
    borderRadius: scale(7),
    backgroundColor: "#7C3AED",
    borderWidth: 1.5,
    borderColor: "#070514",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: moderateScale(7),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
    marginTop: verticalScale(18),
    gap: scale(12),
  },
  searchBox: {
    flex: 1,
    height: verticalScale(42),
    backgroundColor: "#131127",
    borderRadius: scale(21),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: scale(16),
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#FFFFFF",
    paddingVertical: 0,
  },
  filterBtn: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: "#131127",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardsRow: {
    flexDirection: "row",
    paddingHorizontal: scale(20),
    marginTop: verticalScale(20),
    gap: scale(10),
  },
  actionCard: {
    flex: 1,
    height: verticalScale(160),
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    padding: scale(12),
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  actionCardContent: {
    flex: 1,
    justifyContent: "flex-start",
  },
  actionIconContainer: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(12),
  },
  actionCardTextCol: {
    marginTop: verticalScale(4),
  },
  actionTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  actionDesc: {
    fontSize: moderateScale(8.5),
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.45)",
    lineHeight: moderateScale(11),
    marginTop: verticalScale(2),
  },
  arrowBtn: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    marginTop: verticalScale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  viewAllText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#A78BFA",
  },
  categoriesScroll: {
    paddingLeft: scale(20),
    paddingRight: scale(10),
    marginTop: verticalScale(10),
    gap: scale(8),
  },
  categoryChip: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: scale(64),
    height: scale(64),
    borderRadius: scale(16),
    backgroundColor: "#131127",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  categoryChipSelected: {
    backgroundColor: "#7C3AED",
    borderColor: "#A78BFA",
  },
  catIconBox: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(2),
  },
  catLabel: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    color: "#94A3B8",
  },
  catLabelSelected: {
    color: "#FFFFFF",
  },
  listingsList: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(12),
    gap: scale(10),
  },
  listingCard: {
    backgroundColor: "rgba(18, 14, 44, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: scale(18),
    padding: scale(10),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  listingImg: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(12),
    backgroundColor: "#0B081B",
  },
  listingContent: {
    flex: 1,
    justifyContent: "center",
  },
  listingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(2),
  },
  typeBadge: {
    fontSize: moderateScale(8),
    fontWeight: "900",
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: scale(6),
    overflow: "hidden",
  },
  badgeTicket: {
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    color: "#C084FC",
    borderWidth: 0.5,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  badgeLost: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    color: "#34D399",
    borderWidth: 0.5,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  badgeMates: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    color: "#FBBF24",
    borderWidth: 0.5,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  listingTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: moderateScale(15),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: verticalScale(2),
  },
  locationText: {
    fontSize: moderateScale(9.5),
    fontWeight: "500",
    color: "#94A3B8",
    flex: 1,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: verticalScale(4),
  },
  ownerAvatar: {
    width: scale(14),
    height: scale(14),
    borderRadius: scale(7),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  ownerName: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "rgba(124, 90, 255, 0.8)",
  },
  listingRightCol: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingVertical: verticalScale(2),
  },
  rightLabel: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
  },
  listingPrice: {
    fontSize: moderateScale(10.5),
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: verticalScale(1),
  },
  arrowLink: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(6),
  },
  emptyState: {
    backgroundColor: "rgba(19, 17, 39, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: scale(18),
    padding: scale(20),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#94A3B8",
  },
  emptyDesc: {
    fontSize: moderateScale(9.5),
    color: "#64748B",
    marginTop: verticalScale(2),
  },
});
