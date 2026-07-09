// import React, { useState } from "react";
// import { View, Text, ScrollView, Image, Pressable, Switch } from "react-native";
// import {
//   ShieldCheck,
//   Star,
//   Wallet,
//   Calendar,
//   MapPin,
//   ChevronRight,
//   Settings,
//   Trash2,
//   CheckCircle2,
//   Award,
//   LogOut,
//   Lock,
//   MessageSquare,
//   AlertCircle,
// } from "lucide-react-native";
// import { useStore } from "../../hooks/useStore";
// import { router } from "expo-router";
// import { useAuthContext } from "@/context/AuthContext";

// export default function ProfileScreen() {
//   const {
//     state,
//     resolvePost,
//     deletePost,
//     updateCurrentUserProfile,
//     setActivePostId,
//   } = useStore();
//   const [activeTab, setActiveTab] = useState<"Posts" | "Reviews">("Posts");
//   const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);

//   // Profile local configuration settings
//   const [pushNotifs, setPushNotifs] = useState(true);
//   const [emailNotifs, setEmailNotifs] = useState(false);
//   const [privateProfile, setPrivateProfile] = useState(false);
//   const [twoFactor, setTwoFactor] = useState(true);

//   // const user = state.currentUser;

//   const { user } = useAuthContext();

//   // Filter Rohan's posts from global store
//   const myPosts = state.posts.filter((p) => p.host.name === user.name);

//   // Mock Reviews (Screen 6)
//   const mockReviews = [
//     {
//       id: "r-1",
//       reviewer: "Ananya R.",
//       avatar:
//         "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
//       rating: 5,
//       comment:
//         "Super fast ticket swap! Shared the Paytm QR and transferred the Paytm tickets in less than 2 mins. Highly recommended.",
//       date: "2 days ago",
//     },
//     {
//       id: "r-2",
//       reviewer: "Karan M.",
//       avatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
//       rating: 4.8,
//       comment:
//         "Super friendly daymate, had an awesome talk about films and coffee! Will definitely join another session.",
//       date: "1 week ago",
//     },
//   ];

//   return (
//     <View className="flex-1 bg-slate-950">
//       {/* SETTINGS MODAL OVERLAY (Old Settings Screen integrated seamlessly!) */}
//       {showSettingsOverlay && (
//         <View className="absolute inset-0 z-50 bg-slate-950 flex-1">
//           <View className="pt-16 pb-4 px-6 bg-slate-900 border-b border-slate-800 flex-row items-center justify-between">
//             <View className="flex-row items-center gap-3">
//               <Pressable
//                 onPress={() => setShowSettingsOverlay(false)}
//                 className="p-1 active:opacity-75"
//               >
//                 <Text className="text-white text-base font-bold">Close</Text>
//               </Pressable>
//               <Text className="text-white text-xl font-black tracking-tight">
//                 App Settings
//               </Text>
//             </View>
//           </View>

//           <ScrollView
//             className="flex-1 p-6"
//             showsVerticalScrollIndicator={false}
//           >
//             {/* Notification settings */}
//             <View className="mb-6">
//               <Text className="text-slate-400 text-3xs font-black uppercase tracking-wider mb-3 px-1">
//                 Notifications
//               </Text>
//               <View className="bg-slate-900 border border-slate-850 rounded-2xl p-4 gap-4">
//                 <View className="flex-row justify-between items-center">
//                   <View>
//                     <Text className="text-white text-xs font-bold">
//                       Push Notifications
//                     </Text>
//                     <Text className="text-slate-500 text-4xs font-semibold mt-0.5">
//                       Real-time alerts for chats & posts
//                     </Text>
//                   </View>
//                   <Switch
//                     value={pushNotifs}
//                     onValueChange={setPushNotifs}
//                     trackColor={{ false: "#334155", true: "#a855f7" }}
//                     thumbColor={pushNotifs ? "#ffffff" : "#94a3b8"}
//                   />
//                 </View>
//                 <View className="flex-row justify-between items-center pt-4 border-t border-slate-850">
//                   <View>
//                     <Text className="text-white text-xs font-bold">
//                       Email Notifications
//                     </Text>
//                     <Text className="text-slate-500 text-4xs font-semibold mt-0.5">
//                       Weekly digest of popular activities
//                     </Text>
//                   </View>
//                   <Switch
//                     value={emailNotifs}
//                     onValueChange={setEmailNotifs}
//                     trackColor={{ false: "#334155", true: "#a855f7" }}
//                     thumbColor={emailNotifs ? "#ffffff" : "#94a3b8"}
//                   />
//                 </View>
//               </View>
//             </View>

//             {/* Privacy & Security */}
//             <View className="mb-6">
//               <Text className="text-slate-400 text-3xs font-black uppercase tracking-wider mb-3 px-1">
//                 Privacy & Security
//               </Text>
//               <View className="bg-slate-900 border border-slate-850 rounded-2xl p-4 gap-4">
//                 <View className="flex-row justify-between items-center">
//                   <View>
//                     <Text className="text-white text-xs font-bold">
//                       Private Profile
//                     </Text>
//                     <Text className="text-slate-500 text-4xs font-semibold mt-0.5">
//                       Only daymates can view ratings
//                     </Text>
//                   </View>
//                   <Switch
//                     value={privateProfile}
//                     onValueChange={setPrivateProfile}
//                     trackColor={{ false: "#334155", true: "#a855f7" }}
//                     thumbColor={privateProfile ? "#ffffff" : "#94a3b8"}
//                   />
//                 </View>
//                 <View className="flex-row justify-between items-center pt-4 border-t border-slate-850">
//                   <View>
//                     <Text className="text-white text-xs font-bold">
//                       Two-Factor Authentication
//                     </Text>
//                     <Text className="text-slate-500 text-4xs font-semibold mt-0.5">
//                       Keep ticketing wallet safe
//                     </Text>
//                   </View>
//                   <Switch
//                     value={twoFactor}
//                     onValueChange={setTwoFactor}
//                     trackColor={{ false: "#334155", true: "#a855f7" }}
//                     thumbColor={twoFactor ? "#ffffff" : "#94a3b8"}
//                   />
//                 </View>
//               </View>
//             </View>

//             {/* Support section */}
//             <View className="mb-12">
//               <Text className="text-slate-400 text-3xs font-black uppercase tracking-wider mb-3 px-1">
//                 Support
//               </Text>
//               <View className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden">
//                 <Pressable className="px-4 py-4 border-b border-slate-850 flex-row justify-between items-center active:bg-slate-850">
//                   <Text className="text-white text-xs font-bold">
//                     Help Center & Safety Rules
//                   </Text>
//                   <ChevronRight size={14} color="#64748b" />
//                 </Pressable>
//                 <Pressable className="px-4 py-4 flex-row justify-between items-center active:bg-slate-850">
//                   <Text className="text-white text-xs font-bold">
//                     Contact Support
//                   </Text>
//                   <ChevronRight size={14} color="#64748b" />
//                 </Pressable>
//               </View>
//             </View>
//           </ScrollView>
//         </View>
//       )}

//       {/* MAIN SCREEN 6 CONTENT */}
//       <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
//         {/* Top Header details banner */}
//         <View className="relative pb-6 bg-slate-900 border-b border-slate-800">
//           <View className="h-32 bg-purple-900/40" />

//           {/* Settings cog floating */}
//           <Pressable
//             onPress={() => setShowSettingsOverlay(true)}
//             className="absolute top-12 right-6 w-10 h-10 rounded-full bg-slate-950/80 items-center justify-center border border-slate-850 active:bg-slate-900"
//           >
//             <Settings size={18} color="#ffffff" />
//           </Pressable>

//           {/* Profile Details Container */}
//           <View className="px-6 -mt-12 flex-row items-end gap-4">
//             <View className="w-24 h-24 rounded-2xl border-4 border-slate-950 overflow-hidden bg-slate-800 shadow-xl">
//               <Image source={{ uri: user.avatar }} className="w-full h-full" />
//             </View>
//             <View className="flex-1 pb-2">
//               <View className="flex-row items-center gap-1.5">
//                 <Text className="text-white text-xl font-black tracking-tight">
//                   {user.name}
//                 </Text>
//                 <ShieldCheck size={18} color="#c084fc" />
//               </View>
//               <Text className="text-slate-400 text-3xs font-semibold">
//                 {user.email}
//               </Text>
//             </View>
//           </View>

//           {/* Bio Section */}
//           <View className="px-6 mt-4">
//             <Text className="text-slate-300 text-xs font-normal leading-relaxed">
//               {user.bio}
//             </Text>
//             <View className="flex-row items-center gap-4 mt-3">
//               <View className="flex-row items-center gap-1">
//                 <MapPin size={12} color="#94a3b8" />
//                 <Text className="text-slate-400 text-2xs font-semibold">
//                   {user.location}
//                 </Text>
//               </View>
//               <View className="flex-row items-center gap-1">
//                 <Calendar size={12} color="#94a3b8" />
//                 <Text className="text-slate-400 text-2xs font-semibold">
//                   Joined {user.memberSince}
//                 </Text>
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* Numerical Stats Bar */}
//         <View className="flex-row justify-around py-5 px-6 bg-slate-900 border-b border-slate-850">
//           <View className="items-center">
//             <Text className="text-white text-xl font-black">
//               {myPosts.length}
//             </Text>
//             <Text className="text-slate-400 text-4xs font-black uppercase tracking-widest mt-1">
//               Posts
//             </Text>
//           </View>
//           <View className="items-center">
//             <Text className="text-white text-xl font-black">
//               {user.connectionsCount}
//             </Text>
//             <Text className="text-slate-400 text-4xs font-black uppercase tracking-widest mt-1">
//               Connections
//             </Text>
//           </View>
//           <View className="items-center">
//             <Text className="text-white text-xl font-black">
//               {user.groupsCount}
//             </Text>
//             <Text className="text-slate-400 text-4xs font-black uppercase tracking-widest mt-1">
//               Groups
//             </Text>
//           </View>
//         </View>

//         {/* Bento Cards (Wallet + Star) */}
//         <View className="p-6 flex-row gap-4">
//           <View className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-row items-center gap-3">
//             <View className="w-9 h-9 rounded-xl bg-green-500/10 items-center justify-center">
//               <Wallet size={16} color="#22c55e" />
//             </View>
//             <View>
//               <Text className="text-slate-500 text-4xs font-black uppercase tracking-wider">
//                 Wallet Balance
//               </Text>
//               <Text className="text-white text-base font-black mt-0.5">
//                 {user.walletBalance}
//               </Text>
//             </View>
//           </View>

//           <View className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-row items-center gap-3">
//             <View className="w-9 h-9 rounded-xl bg-amber-500/10 items-center justify-center">
//               <Star size={16} color="#f59e0b" fill="#f59e0b" />
//             </View>
//             <View>
//               <Text className="text-slate-500 text-4xs font-black uppercase tracking-wider">
//                 Avg Rating
//               </Text>
//               <Text className="text-white text-base font-black mt-0.5">
//                 {user.rating}{" "}
//                 <Text className="text-slate-500 text-4xs font-semibold">
//                   (23)
//                 </Text>
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Screen 6 Tabs Segment Selector */}
//         <View className="mx-6 mb-4 flex-row border-b border-slate-900">
//           <Pressable
//             onPress={() => setActiveTab("Posts")}
//             className={`flex-1 py-3 items-center ${activeTab === "Posts" ? "border-b-2 border-purple-500" : ""}`}
//           >
//             <Text
//               className={`text-xs font-black uppercase tracking-wider ${activeTab === "Posts" ? "text-purple-400" : "text-slate-500"}`}
//             >
//               My Posts ({myPosts.length})
//             </Text>
//           </Pressable>

//           <Pressable
//             onPress={() => setActiveTab("Reviews")}
//             className={`flex-1 py-3 items-center ${activeTab === "Reviews" ? "border-b-2 border-purple-500" : ""}`}
//           >
//             <Text
//               className={`text-xs font-black uppercase tracking-wider ${activeTab === "Reviews" ? "text-purple-400" : "text-slate-500"}`}
//             >
//               Reviews ({mockReviews.length})
//             </Text>
//           </Pressable>
//         </View>

//         {/* Tab content */}
//         <View className="px-6 pb-16">
//           {activeTab === "Posts" && (
//             <View className="gap-3">
//               {myPosts.map((post) => (
//                 <View
//                   key={post.id}
//                   className="bg-slate-900 border border-slate-800 p-4 rounded-2xl"
//                 >
//                   <Pressable
//                     onPress={() => setActivePostId(post.id)}
//                     className="flex-row gap-3"
//                   >
//                     <Image
//                       source={{ uri: post.image }}
//                       className="w-16 h-16 rounded-xl"
//                     />
//                     <View className="flex-1 justify-center">
//                       <View className="flex-row justify-between items-center">
//                         <Text className="text-purple-400 text-5xs font-black uppercase tracking-wider">
//                           {post.category}
//                         </Text>
//                         <View
//                           className={`px-2 py-0.5 rounded ${post.status === "Active" ? "bg-purple-900/30 border border-purple-800/40" : "bg-slate-950 border border-slate-850"}`}
//                         >
//                           <Text
//                             className={`text-5xs font-black uppercase ${post.status === "Active" ? "text-purple-400" : "text-slate-500"}`}
//                           >
//                             {post.status}
//                           </Text>
//                         </View>
//                       </View>
//                       <Text
//                         className="text-white text-xs font-black mt-1"
//                         numberOfLines={1}
//                       >
//                         {post.title}
//                       </Text>
//                       <Text
//                         className="text-slate-400 text-4xs font-medium mt-0.5"
//                         numberOfLines={1}
//                       >
//                         {post.location}
//                       </Text>
//                     </View>
//                   </Pressable>

//                   {/* Actions (Resolve & Delete) for screen interactivity */}
//                   {post.status === "Active" && (
//                     <View className="flex-row gap-3 mt-4 pt-3 border-t border-slate-850/60">
//                       <Pressable
//                         onPress={() => resolvePost(post.id)}
//                         className="flex-1 py-2 bg-slate-950 border border-slate-800 rounded-lg flex-row justify-center items-center gap-1.5 active:bg-slate-900"
//                       >
//                         <CheckCircle2 size={13} color="#22c55e" />
//                         <Text className="text-green-400 text-5xs font-black uppercase">
//                           Mark Resolved
//                         </Text>
//                       </Pressable>
//                       <Pressable
//                         onPress={() => deletePost(post.id)}
//                         className="py-2 px-3 bg-slate-950 border border-red-950/40 rounded-lg justify-center items-center active:bg-red-950/20"
//                       >
//                         <Trash2 size={13} color="#ef4444" />
//                       </Pressable>
//                     </View>
//                   )}
//                 </View>
//               ))}

//               {myPosts.length === 0 && (
//                 <View className="bg-slate-900/30 border border-slate-850 rounded-2xl p-8 items-center">
//                   <Text className="text-slate-500 text-xs font-semibold">
//                     You haven't posted any listings yet
//                   </Text>
//                   <Pressable
//                     onPress={() => router.push("/(tabs)/create")}
//                     className="mt-3 px-4 py-2 bg-purple-600 rounded-xl"
//                   >
//                     <Text className="text-white text-4xs font-black uppercase">
//                       Create Post Now
//                     </Text>
//                   </Pressable>
//                 </View>
//               )}
//             </View>
//           )}

//           {activeTab === "Reviews" && (
//             <View className="gap-3">
//               {mockReviews.map((rev) => (
//                 <View
//                   key={rev.id}
//                   className="bg-slate-900 border border-slate-800 p-4 rounded-2xl"
//                 >
//                   <View className="flex-row items-center gap-2.5 mb-2.5">
//                     <Image
//                       source={{ uri: rev.avatar }}
//                       className="w-8 h-8 rounded-full border border-slate-800"
//                     />
//                     <View className="flex-1">
//                       <View className="flex-row justify-between items-center">
//                         <Text className="text-white text-2xs font-extrabold">
//                           {rev.reviewer}
//                         </Text>
//                         <Text className="text-slate-500 text-5xs font-semibold">
//                           {rev.date}
//                         </Text>
//                       </View>
//                       <View className="flex-row items-center gap-0.5 mt-0.5">
//                         <Star size={10} color="#f59e0b" fill="#f59e0b" />
//                         <Star size={10} color="#f59e0b" fill="#f59e0b" />
//                         <Star size={10} color="#f59e0b" fill="#f59e0b" />
//                         <Star size={10} color="#f59e0b" fill="#f59e0b" />
//                         <Star size={10} color="#f59e0b" fill="#f59e0b" />
//                       </View>
//                     </View>
//                   </View>
//                   <Text className="text-slate-300 text-3xs font-medium leading-relaxed">
//                     {rev.comment}
//                   </Text>
//                 </View>
//               ))}
//             </View>
//           )}
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// @ts-nocheck
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import { useAuthContext } from "@/context/AuthContext";

interface ProfileScreenProps {
  onLogout: () => void;
  onOpenCreate: () => void;
}

export default function ProfileScreen({
  onLogout,
  onOpenCreate,
}: ProfileScreenProps) {
  const { user, logout } = useAuthContext();

  return (
    <View style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* HEADER ROW */}
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>My Profile</Text>
          <TouchableOpacity style={s.settingsBtn} activeOpacity={0.7}>
            <Ionicons
              name="settings-outline"
              size={moderateScale(18)}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        {/* HERO USER PROFILE CARD */}
        <View style={s.cardWrapper}>
          <View style={s.heroCard}>
            {/* Spotlight decoration */}
            <View style={s.spotlight} />

            <View style={s.profileHeader}>
              <View style={s.avatarWrapper}>
                <Image
                  source={{
                    uri: user?.avatar,
                    // uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
                  }}
                  style={s.avatar}
                />
                <View style={s.avatarRing} />
              </View>

              <View style={s.profileMeta}>
                <View style={s.nameRow}>
                  <Text style={s.profileName}>{user?.name}</Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={moderateScale(15)}
                    color="#A78BFA"
                  />
                </View>
                <Text style={s.verifiedTag}>Verified Mumbaikar</Text>
                <Text style={s.emailText}>{user?.email}</Text>
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={s.statsGrid}>
              <View style={s.statBox}>
                <Text style={[s.statLabel, { color: "#A78BFA" }]}>Swaps</Text>
                <Text style={s.statVal}>14 Deals</Text>
              </View>
              <View style={s.statBox}>
                <Text style={[s.statLabel, { color: "#FBBF24" }]}>Buddies</Text>
                <Text style={s.statVal}>32 Walks</Text>
              </View>
              <View style={s.statBox}>
                <Text style={[s.statLabel, { color: "#34D399" }]}>Rating</Text>
                <Text style={[s.statVal, { color: "#34D399" }]}>★ 4.92</Text>
              </View>
            </View>
          </View>
        </View>

        {/* WALLET BALANCE CARD */}
        <View style={s.walletWrapper}>
          <View style={s.walletCard}>
            <View style={s.walletLeft}>
              <View style={s.walletIconBg}>
                <Ionicons
                  name="wallet-outline"
                  size={moderateScale(20)}
                  color="#C084FC"
                />
              </View>
              <View style={s.walletTexts}>
                <Text style={s.walletSubtitle}>Junto Escrow Balance</Text>
                <Text style={s.walletBalance}>₹1,200.00 INR</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onOpenCreate}
              activeOpacity={0.8}
              style={s.addCashBtn}
            >
              <Text style={s.addCashBtnText}>Add Cash</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SETTINGS OPTIONS LIST */}
        <View style={s.optionsSection}>
          <Text style={s.optionsSectionTitle}>Security & Settings</Text>

          {/* Option 1 */}
          <TouchableOpacity style={s.optionCard} activeOpacity={0.8}>
            <View style={s.optionLeft}>
              <View style={s.optionIconBg}>
                <Ionicons
                  name="ribbon-outline"
                  size={moderateScale(16)}
                  color="#C084FC"
                />
              </View>
              <Text style={s.optionLabel}>My Active Listings & Drafts</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(15)}
              color="#475569"
            />
          </TouchableOpacity>

          {/* Option 2 */}
          <TouchableOpacity style={s.optionCard} activeOpacity={0.8}>
            <View style={s.optionLeft}>
              <View style={s.optionIconBg}>
                <Ionicons
                  name="heart-outline"
                  size={moderateScale(16)}
                  color="#C084FC"
                />
              </View>
              <Text style={s.optionLabel}>Trust Badges & Vouch Network</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(15)}
              color="#475569"
            />
          </TouchableOpacity>

          {/* Option 3 */}
          <TouchableOpacity style={s.optionCard} activeOpacity={0.8}>
            <View style={s.optionLeft}>
              <View style={s.optionIconBg}>
                <Ionicons
                  name="help-circle-outline"
                  size={moderateScale(16)}
                  color="#C084FC"
                />
              </View>
              <Text style={s.optionLabel}>Help, FAQs & Escrow Support</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(15)}
              color="#475569"
            />
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON CONTAINER */}
        <View style={s.logoutWrapper}>
          <TouchableOpacity
            // onPress={onLogout}
            onPress={logout}
            activeOpacity={0.8}
            style={s.logoutBtn}
          >
            <Ionicons
              name="log-out-outline"
              size={moderateScale(16)}
              color="#EF4444"
            />
            <Text style={s.logoutBtnText}>Sign Out from Junto Account</Text>
          </TouchableOpacity>
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
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  settingsBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrapper: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(12),
  },
  heroCard: {
    backgroundColor: "#1E1245",
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.08)",
    padding: scale(16),
    position: "relative",
    overflow: "hidden",
    ...shadow,
  },
  spotlight: {
    position: "absolute",
    top: "-30%",
    right: "-15%",
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: "rgba(167, 139, 250, 0.15)",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(16),
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarRing: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: scale(18),
    borderWidth: 1.5,
    borderColor: "#A78BFA",
    opacity: 0.8,
  },
  profileMeta: {
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  profileName: {
    fontSize: moderateScale(15),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  verifiedTag: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    color: "#A78BFA",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: scale(1),
  },
  emailText: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    marginTop: scale(1),
  },
  statsGrid: {
    flexDirection: "row",
    gap: scale(8),
    marginTop: verticalScale(16),
    borderTopWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: verticalScale(12),
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(7, 5, 20, 0.6)",
    borderRadius: scale(10),
    paddingVertical: scale(8),
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.03)",
  },
  statLabel: {
    fontSize: moderateScale(8),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: moderateScale(11.5),
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: scale(2),
  },
  walletWrapper: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(12),
  },
  walletCard: {
    backgroundColor: "rgba(18, 14, 44, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: scale(18),
    padding: scale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  walletIconBg: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletTexts: {
    justifyContent: "center",
  },
  walletSubtitle: {
    fontSize: moderateScale(8.5),
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  walletBalance: {
    fontSize: moderateScale(12.5),
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: scale(1),
  },
  addCashBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
  },
  addCashBtnText: {
    fontSize: moderateScale(10.5),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  optionsSection: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(20),
    gap: scale(8),
  },
  optionsSectionTitle: {
    fontSize: moderateScale(10.5),
    fontWeight: "900",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingLeft: scale(2),
  },
  optionCard: {
    backgroundColor: "rgba(18, 14, 44, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: scale(16),
    padding: scale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  optionIconBg: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(8),
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#E2E8F0",
  },
  logoutWrapper: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(24),
  },
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: scale(16),
    paddingVertical: verticalScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
  },
  logoutBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#EF4444",
  },
});
