import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TextInput,
  Switch,
  Alert,
  Share,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import { useAuthContext } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { useStore } from "@/hooks/useStore";
import { useTheme } from "@/hooks/useTheme";
import type { Theme } from "@/theme";
import { router } from "expo-router";
import { ApiService } from "@/services/api";
import CustomerCareChatModal from "@/components/CustomerCareChatModal";

function hexA(hex: string, a: number) {
  if (!hex) return `rgba(168,85,247,${a})`;
  if (hex.startsWith("rgba")) return hex;
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  return `rgba(${r},${g},${b},${a})`;
}

export default function ProfileScreen() {
  const { theme: t, mode: themeMode, setTheme } = useTheme();
  const s = useMemo(() => createStyles(t), [t]);

  const { user, logout } = useAuthContext();
  const { selectedLocation } = useLocation();
  const {
    state,
    setShowNotifications,
    updateCurrentUserProfile,
    deletePost,
    resolvePost,
  } = useStore();

  // Modals state
  const [activeModal, setActiveModal] = useState<
    | "edit"
    | "activities"
    | "tickets"
    | "saved"
    | "privacy"
    | "help"
    | "invite"
    | "settings"
    | "premium"
    | "customerCare"
    | null
  >(null);

  // Realtime backend API user state fetched from /api/me
  const [apiUser, setApiUser] = useState<any>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchMe() {
      try {
        const res = await ApiService.get<{ success: boolean; user: any }>(
          "/api/auth/me",
        );
        if (isMounted && res && res.user) {
          console.log("Fetched /api/me user data successfully:", res.user);
          setApiUser(res.user);
        }
      } catch (err) {
        console.log("Note: /api/me fetch skipped or offline:", err);
      }
    }
    fetchMe();
    return () => {
      isMounted = false;
    };
  }, []);

  // Edit profile form state
  const userName =
    apiUser?.name || user?.name || state.currentUser?.name || "User";
  const [editName, setEditName] = useState(userName);
  const [editBio, setEditBio] = useState(
    apiUser?.bio ||
      (user as any)?.bio ||
      state.currentUser?.bio ||
      "Love meeting new people and exploring new things! ✨",
  );
  const [editAvatar, setEditAvatar] = useState(
    apiUser?.avatar ||
      user?.avatar ||
      state.currentUser?.avatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
  );

  // Sync edit form state when user or apiUser changes
  React.useEffect(() => {
    const name = apiUser?.name || user?.name;
    const bio = apiUser?.bio || (user as any)?.bio || state.currentUser?.bio;
    const avatar = apiUser?.avatar || user?.avatar || state.currentUser?.avatar;
    if (name) setEditName(name);
    if (bio) setEditBio(bio);
    if (avatar) setEditAvatar(avatar);
  }, [apiUser, user, state.currentUser]);

  // Settings toggles
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  // Calculated values
  const locationText =
    selectedLocation?.name ||
    selectedLocation?.city ||
    state.currentUser?.location ||
    "Koramangala, Bengaluru";

  const rawHandle =
    apiUser?.userHandle ||
    (user as any)?.userHandle ||
    (state.currentUser as any)?.userHandle ||
    apiUser?.handle ||
    (user as any)?.handle;

  const userHandle = rawHandle
    ? rawHandle.startsWith("@")
      ? rawHandle
      : `@${rawHandle}`
    : `@${(
        apiUser?.name ||
        user?.name ||
        state.currentUser?.name ||
        user?.email?.split("@")[0] ||
        "user"
      )
        .toLowerCase()
        .replace(/\s+/g, "_")}`;

  const userBio =
    apiUser?.bio ||
    (user as any)?.bio ||
    state.currentUser?.bio ||
    "Love meeting new people and exploring new things! ✨";

  const userAvatar =
    apiUser?.avatar ||
    user?.avatar ||
    state.currentUser?.avatar ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

  // Helper to open activity details
  const handleOpenActivity = (post: any) => {
    setActiveModal(null);
    router.push({
      pathname: "/(screens)/activity-chat",
      params: {
        activityId: post.id,
        id: post.id,
        title: post.title,
        user: post.host?.name || user?.name || "Junto User",
        organizerId: user?.id,
        place: post.location,
        type: post.category,
        category: post.category,
        avatar: post.host?.avatar || user?.avatar,
      },
    });
  };

  // Filter user's activities dynamically from local context
  const myPosts = useMemo(() => {
    const currentUserId =
      apiUser?.id || (user as any)?.id || (state.currentUser as any)?.id;
    const currentName = (
      user?.name ||
      state.currentUser?.name ||
      apiUser?.name ||
      ""
    )
      .toLowerCase()
      .trim();
    return state.posts.filter((p: any) => {
      if (currentUserId && p.organizerId) {
        return p.organizerId === currentUserId;
      }
      if (currentName) {
        const hostName = (p.host?.name || "").toLowerCase().trim();
        return hostName.includes(currentName) || currentName.includes(hostName);
      }
      return false;
    });
  }, [state.posts, user, state.currentUser, apiUser?.id, apiUser?.name]);

  // Combined activities list from backend API /api/me response or local posts fallback
  const userActivitiesList = useMemo(() => {
    if (apiUser?.activities) {
      let rawList: any[] = [];
      if (Array.isArray(apiUser.activities)) {
        rawList = apiUser.activities;
      } else if (typeof apiUser.activities === "object") {
        rawList = Object.values(apiUser.activities).flat();
      }

      if (rawList.length > 0) {
        return rawList.map((act: any) => ({
          id: act.id,
          title: act.title,
          category: act.category,
          location: act.locationName || act.location || "Location",
          image:
            act.bannerImage ||
            act.image ||
            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600",
          status: act.remainingSeats === 0 ? "Resolved" : "Active",
          host: {
            name: act.organizer?.name || apiUser.name || "User",
            avatar: act.organizer?.avatar || apiUser.avatar,
          },
          raw: act,
        }));
      }
    }
    return myPosts;
  }, [apiUser, myPosts]);

  // Filter user's ticket listings dynamically from API MOVIES activities and local posts
  const ticketPosts = useMemo(() => {
    let apiTickets: any[] = [];
    if (apiUser?.activities) {
      if (
        typeof apiUser.activities === "object" &&
        !Array.isArray(apiUser.activities)
      ) {
        apiTickets = apiUser.activities.MOVIES || [];
      } else if (Array.isArray(apiUser.activities)) {
        apiTickets = apiUser.activities.filter(
          (a: any) =>
            a.category === "MOVIES" ||
            a.category === "Movie Tickets" ||
            a.category === "MOVIE TICKET" ||
            a.category === "TICKETS",
        );
      }
    }

    const mappedApiTickets = apiTickets.map((act: any) => ({
      id: act.id,
      title: act.title,
      category: "Movie Tickets",
      location: act.locationName || act.location || "Location",
      image:
        act.bannerImage ||
        act.image ||
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600",
      price: act.cost ? `₹${act.cost}` : act.price || "₹500 each",
      status: act.remainingSeats === 0 ? "Resolved" : "Active",
      host: {
        name: act.organizer?.name || apiUser?.name || "User",
        avatar: act.organizer?.avatar || apiUser?.avatar,
      },
      raw: act,
    }));

    const localTickets = myPosts
      .filter(
        (p: any) =>
          p.category === "Movie Tickets" ||
          p.category === "MOVIE TICKET" ||
          p.category === "TICKETS" ||
          p.category === "MOVIES",
      )
      .map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category || "Movie Tickets",
        location: p.location || "Location",
        image:
          p.image ||
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600",
        price: p.price || (p.raw?.cost ? `₹${p.raw.cost}` : "₹500 each"),
        status: p.status || "Active",
        host: p.host || { name: "User", avatar: "" },
        raw: p,
      }));

    const combined = [...mappedApiTickets];
    for (const t of localTickets) {
      if (!combined.some((item) => item.id === t.id)) {
        combined.push(t);
      }
    }
    return combined;
  }, [apiUser, myPosts]);

  // Real Connections count calculated from chats and current user
  // const realConnectionsCount = useMemo(() => {
  //   if (
  //     (user as any)?.connectionsCount !== undefined &&
  //     (user as any)?.connectionsCount !== null
  //   ) {
  //     return (user as any).connectionsCount;
  //   }
  //   if (
  //     state.currentUser?.connectionsCount !== undefined &&
  //     state.currentUser?.connectionsCount !== null
  //   ) {
  //     return state.currentUser.connectionsCount;
  //   }
  //   const partners = new Set<string>();
  //   state.chats.forEach((c) => {
  //     if (c.partner?.name) partners.add(c.partner.name);
  //   });
  //   return partners.size;
  // }, [state.chats, state.currentUser, user]);

  // Total unread chat count
  const unreadChatsCount = useMemo(() => {
    return state.chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
  }, [state.chats]);

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${user?.name || "Bharath Maska"}'s profile on Junto! Connect with verified daymates and ticket sellers.`,
      });
    } catch (err) {
      console.warn("Share error:", err);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Validation Error", "Name cannot be empty");
      return;
    }
    const updated = {
      name: editName.trim(),
      bio: editBio.trim(),
      avatar: editAvatar.trim(),
    };
    updateCurrentUserProfile(updated);
    if (apiUser) {
      setApiUser((prev: any) => ({ ...prev, ...updated }));
    }
    try {
      await ApiService.patch("/api/me", updated);
    } catch (err) {
      console.log("Note: profile patch endpoint:", err);
    }
    setActiveModal(null);
    Alert.alert("Success", "Profile updated successfully!");
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* 1. TOP PROFILE HEADER AREA */}
        <View style={s.headerSection}>
          {/* Top Right Action Icons */}
          <View style={s.topActionsRow}>
            <TouchableOpacity
              style={s.topIconButton}
              onPress={() => setActiveModal("customerCare")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="headset-outline"
                size={scale(18)}
                color={t.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.topIconButton}
              onPress={handleShareProfile}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={scale(17)} color={t.text} />
            </TouchableOpacity>
          </View>

          {/* Profile Header Row: Avatar + Info */}
          <View style={s.profileMainRow}>
            {/* Avatar with Edit Badge */}
            <View style={s.avatarContainer}>
              <View style={s.avatarGlowRing}>
                <Image source={{ uri: userAvatar }} style={s.avatarImage} />
              </View>
              <TouchableOpacity
                style={s.editAvatarBadge}
                onPress={() => setActiveModal("edit")}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={scale(11)} color={t.white} />
              </TouchableOpacity>
            </View>

            {/* User Meta Info */}
            <View style={s.metaContainer}>
              {/* Name & Verified Badge */}
              <View style={s.nameBadgeRow}>
                <Text style={s.nameText} numberOfLines={1}>
                  {user?.name || state.currentUser?.name || "User"}
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={scale(16)}
                  color={t.primary}
                />
              </View>

              {/* Handle */}
              <Text style={s.handleText}>{userHandle}</Text>

              {/* Location Row */}
              <View style={s.locationRow}>
                <Ionicons
                  name="location-sharp"
                  size={scale(12)}
                  color={t.primary}
                />
                <Text style={s.locationText} numberOfLines={1}>
                  {locationText}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(screens)/location-search")}
                  activeOpacity={0.7}
                >
                  <Text style={s.changeLocationText}>Change</Text>
                </TouchableOpacity>
              </View>

              {/* Bio */}
              <Text style={s.bioText} numberOfLines={2}>
                {userBio}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. NUMERICAL STATS CARD */}
        <View style={s.statsCardWrapper}>
          <View style={s.statsCard}>
            {/* Column 1: Connections */}
            {/* <TouchableOpacity
              style={s.statCol}
              onPress={() => router.push("/(tabs)/chats")}
              activeOpacity={0.75}
            >
              <Ionicons name="people" size={scale(18)} color={t.primary} />
              <Text style={s.statNumber}>{realConnectionsCount}</Text>
              <Text style={s.statLabel}>Connections</Text>
            </TouchableOpacity> */}

            {/* <View style={s.statDivider} /> */}

            {/* Column 2: Activities */}
            <TouchableOpacity
              style={s.statCol}
              onPress={() => setActiveModal("activities")}
              activeOpacity={0.75}
            >
              <Ionicons name="calendar" size={scale(18)} color={t.error} />
              <Text style={s.statNumber}>
                {apiUser?.createdActivitiesCount ?? userActivitiesList.length}
              </Text>
              <Text style={s.statLabel}>All Activities</Text>
            </TouchableOpacity>

            <View style={s.statDivider} />

            {/* Column 3: Tickets */}
            <TouchableOpacity
              style={s.statCol}
              onPress={() => setActiveModal("tickets")}
              activeOpacity={0.75}
            >
              <Ionicons name="ticket" size={scale(18)} color={t.info} />
              <Text style={s.statNumber}>
                {apiUser?.ticketsCount ?? ticketPosts.length}
              </Text>
              <Text style={s.statLabel}>Tickets</Text>
            </TouchableOpacity>

            <View style={s.statDivider} />

            {/* Column 4: Trusted */}
            <TouchableOpacity
              style={s.statCol}
              onPress={() =>
                Alert.alert(
                  "Trust & Safety 🛡️",
                  `Your Trust Score is ${
                    apiUser?.rating || user?.rating
                      ? `${Math.round(((apiUser?.rating || user?.rating) / 5) * 100)}%`
                      : "100%"
                  }.\n\nCalculated based on verified account, positive activity ratings & completed daymate interactions.`,
                )
              }
              activeOpacity={0.75}
            >
              <Ionicons
                name="shield-checkmark"
                size={scale(18)}
                color={t.success}
              />
              <Text style={s.statNumber}>
                {apiUser?.rating || user?.rating
                  ? `${Math.round(((apiUser?.rating || user?.rating) / 5) * 100)}%`
                  : "100%"}
              </Text>
              <Text style={s.statLabel}>Trusted</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. JUNTO PREMIUM BANNER CARD */}
        {/* <View style={s.premiumCardWrapper}>
          <TouchableOpacity
            style={s.premiumCard}
            onPress={() => setActiveModal("premium")}
            activeOpacity={0.88}
          >
            <View style={s.premiumLeft}>
              <View style={s.crownIconBg}>
                <Ionicons name="ribbon" size={scale(20)} color="#FBBF24" />
              </View>
              <View style={s.premiumTextCol}>
                <Text style={s.premiumTitle}>Junto Premium</Text>
                <Text style={s.premiumSub}>
                  Unlock extra features and more visibility.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={s.upgradePillButton}
              onPress={() => setActiveModal("premium")}
              activeOpacity={0.8}
            >
              <Text style={s.upgradePillText}>Upgrade</Text>
              <Ionicons
                name="chevron-forward"
                size={scale(13)}
                color={t.white}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </View> */}

        {/* 4. SIMPLE MAIN MENU */}
        <View style={s.sectionContainer}>
          <View style={s.menuListCard}>
            {/* My Activities */}
            <TouchableOpacity
              style={s.menuItemRow}
              onPress={() => setActiveModal("activities")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  s.menuIconBg,
                  { backgroundColor: hexA(t.primary, 0.15) },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={scale(16)}
                  color={t.primary}
                />
              </View>
              <View style={s.menuTextCol}>
                <Text style={s.menuItemTitle}>My Activities</Text>
                <Text style={s.menuItemSub}>
                  Manage your activities, events & daymates
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>

            <View style={s.menuItemSeparator} />

            {/* My Tickets */}
            <TouchableOpacity
              style={s.menuItemRow}
              onPress={() => setActiveModal("tickets")}
              activeOpacity={0.7}
            >
              <View
                style={[s.menuIconBg, { backgroundColor: hexA(t.info, 0.15) }]}
              >
                <Ionicons
                  name="ticket-outline"
                  size={scale(16)}
                  color={t.info}
                />
              </View>
              <View style={s.menuTextCol}>
                <Text style={s.menuItemTitle}>My Tickets</Text>
                <Text style={s.menuItemSub}>
                  Tickets you're swapping or selling
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>

            <View style={s.menuItemSeparator} />

            {/* Saved */}
            <TouchableOpacity
              style={s.menuItemRow}
              onPress={() => setActiveModal("saved")}
              activeOpacity={0.7}
            >
              <View
                style={[s.menuIconBg, { backgroundColor: hexA(t.error, 0.15) }]}
              >
                <Ionicons
                  name="heart-outline"
                  size={scale(16)}
                  color={t.error}
                />
              </View>
              <View style={s.menuTextCol}>
                <Text style={s.menuItemTitle}>Saved</Text>
                <Text style={s.menuItemSub}>
                  Activities, people and places you saved
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>

            <View style={s.menuItemSeparator} />

            {/* Settings (Moved from top-right directly to main menu) */}
            <TouchableOpacity
              style={s.menuItemRow}
              onPress={() => setActiveModal("settings")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  s.menuIconBg,
                  { backgroundColor: hexA(t.primary, 0.15) },
                ]}
              >
                <Ionicons
                  name="settings-outline"
                  size={scale(17)}
                  color={t.primary}
                />
              </View>
              <View style={s.menuTextCol}>
                <Text style={s.menuItemTitle}>Settings</Text>
                <Text style={s.menuItemSub}>
                  Preferences, theme and account settings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>

            <View style={s.menuItemSeparator} />

            {/* Privacy & Safety */}
            <TouchableOpacity
              style={s.menuItemRow}
              onPress={() => setActiveModal("privacy")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  s.menuIconBg,
                  { backgroundColor: hexA(t.primary, 0.15) },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={scale(17)}
                  color={t.primary}
                />
              </View>
              <View style={s.menuTextCol}>
                <Text style={s.menuItemTitle}>Privacy & Safety</Text>
                <Text style={s.menuItemSub}>
                  Manage privacy and safety settings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>

            <View style={s.menuItemSeparator} />

            {/* Help & Support */}
            <TouchableOpacity
              style={s.menuItemRow}
              onPress={() => setActiveModal("help")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  s.menuIconBg,
                  { backgroundColor: hexA(t.primary, 0.15) },
                ]}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={scale(17)}
                  color={t.primary}
                />
              </View>
              <View style={s.menuTextCol}>
                <Text style={s.menuItemTitle}>Help & Support</Text>
                <Text style={s.menuItemSub}>FAQs, support and feedback</Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>

            <View style={s.menuItemSeparator} />

            {/* Sign Out */}
            <TouchableOpacity
              style={s.menuItemRow}
              onPress={logout}
              activeOpacity={0.7}
            >
              <View
                style={[s.menuIconBg, { backgroundColor: hexA(t.error, 0.12) }]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={scale(17)}
                  color={t.error}
                />
              </View>
              <View style={s.menuTextCol}>
                <Text style={[s.menuItemTitle, { color: t.error }]}>
                  Sign Out
                </Text>
                <Text style={s.menuItemSub}>Log out of your account</Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ==================== INTERACTIVE MODALS ==================== */}

      {/* 1. EDIT PROFILE MODAL */}
      <Modal
        visible={activeModal === "edit"}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={s.modalContainer} edges={["top", "bottom"]}>
          <View style={s.modalHeader}>
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={s.modalBackBtn}
            >
              <Ionicons name="close" size={scale(20)} color={t.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSaveProfile}
              style={s.modalSaveBtn}
            >
              <Text style={s.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
            <View
              style={{
                alignItems: "center",
                marginVertical: verticalScale(16),
              }}
            >
              <Image source={{ uri: editAvatar }} style={s.editAvatarLarge} />
              <TouchableOpacity
                style={s.changePhotoBtn}
                onPress={() =>
                  Alert.alert(
                    "Change Photo",
                    "Choose an image URL or upload from gallery.",
                  )
                }
              >
                <Text style={s.changePhotoText}>Change Profile Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Full Name</Text>
              <TextInput
                style={s.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor={t.placeholder}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Bio</Text>
              <TextInput
                style={[
                  s.textInput,
                  { height: verticalScale(80), textAlignVertical: "top" },
                ]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell others about yourself"
                placeholderTextColor={t.placeholder}
                multiline
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Avatar Image URL</Text>
              <TextInput
                style={s.textInput}
                value={editAvatar}
                onChangeText={setEditAvatar}
                placeholder="https://..."
                placeholderTextColor={t.placeholder}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 2. MY ACTIVITIES MODAL */}
      <Modal
        visible={activeModal === "activities"}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={s.modalContainer} edges={["top", "bottom"]}>
          <View style={s.modalHeader}>
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={s.modalBackBtn}
            >
              <Ionicons name="arrow-back" size={scale(20)} color={t.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>My Activities</Text>
            <View style={{ width: scale(36) }} />
          </View>

          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
            {userActivitiesList.length === 0 ? (
              <View style={s.emptyStateBox}>
                <Ionicons
                  name="calendar-outline"
                  size={scale(48)}
                  color={t.sub}
                />
                <Text style={s.emptyStateTitle}>No Active Activities</Text>
                <Text style={s.emptyStateSub}>
                  You haven't posted any daymate or ticket activities yet.
                </Text>
                <TouchableOpacity
                  style={s.primaryActionBtn}
                  onPress={() => {
                    setActiveModal(null);
                    router.push("/(screens)/add-daymate");
                  }}
                >
                  <Text style={s.primaryActionText}>Create New Activity</Text>
                </TouchableOpacity>
              </View>
            ) : (
              userActivitiesList.map((post: any) => (
                <TouchableOpacity
                  key={post.id}
                  style={s.postCard}
                  activeOpacity={0.85}
                  onPress={() => handleOpenActivity(post)}
                >
                  <Image source={{ uri: post.image }} style={s.postImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.postCategory}>{post.category}</Text>
                    <Text style={s.postTitle} numberOfLines={1}>
                      {post.title}
                    </Text>
                    <Text style={s.postLocation} numberOfLines={1}>
                      {post.location}
                    </Text>

                    <View style={s.postActionRow}>
                      <TouchableOpacity
                        style={s.resolveBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          resolvePost(post.id);
                        }}
                      >
                        <Text style={s.resolveBtnText}>
                          {post.status === "Resolved"
                            ? "Resolved"
                            : "Mark Resolved"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.deleteBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          deletePost(post.id);
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={scale(16)}
                          color={t.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 3. MY TICKETS MODAL */}
      <Modal
        visible={activeModal === "tickets"}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={s.modalContainer} edges={["top", "bottom"]}>
          <View style={s.modalHeader}>
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={s.modalBackBtn}
            >
              <Ionicons name="arrow-back" size={scale(20)} color={t.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>My Tickets</Text>
            <View style={{ width: scale(36) }} />
          </View>

          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
            {ticketPosts.length === 0 ? (
              <View style={s.emptyStateBox}>
                <Ionicons
                  name="ticket-outline"
                  size={scale(48)}
                  color={t.info}
                />
                <Text style={s.emptyStateTitle}>No Active Tickets Listed</Text>
                <Text style={s.emptyStateSub}>
                  You haven't listed any tickets for sale or swap yet.
                </Text>
                <TouchableOpacity
                  style={s.primaryActionBtn}
                  onPress={() => {
                    setActiveModal(null);
                    router.push("/(screens)/add-ticket");
                  }}
                >
                  <Text style={s.primaryActionText}>Sell / Swap a Ticket</Text>
                </TouchableOpacity>
              </View>
            ) : (
              ticketPosts.map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={s.postCard}
                  activeOpacity={0.85}
                  onPress={() => handleOpenActivity(ticket)}
                >
                  <Image source={{ uri: ticket.image }} style={s.postImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.postCategory}>{ticket.category}</Text>
                    <Text style={s.postTitle} numberOfLines={1}>
                      {ticket.title}
                    </Text>
                    <Text style={s.postLocation} numberOfLines={1}>
                      {ticket.price || "₹500 each"} •{" "}
                      {ticket.location || "Bengaluru"}
                    </Text>
                    <View style={s.postActionRow}>
                      <TouchableOpacity
                        style={s.resolveBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenActivity(ticket);
                        }}
                      >
                        <Text style={s.resolveBtnText}>View Swap Requests</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.deleteBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          deletePost(ticket.id);
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={scale(16)}
                          color={t.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 4. SAVED ITEMS MODAL */}
      <Modal
        visible={activeModal === "saved"}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={s.modalContainer} edges={["top", "bottom"]}>
          <View style={s.modalHeader}>
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={s.modalBackBtn}
            >
              <Ionicons name="arrow-back" size={scale(20)} color={t.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Saved Activities & People</Text>
            <View style={{ width: scale(36) }} />
          </View>

          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
            <View style={s.emptyStateBox}>
              <Ionicons name="heart-outline" size={scale(48)} color={t.error} />
              <Text style={s.emptyStateTitle}>No Saved Items Yet</Text>
              <Text style={s.emptyStateSub}>
                Bookmark tickets, events, or daymate profiles from Explore to
                access them here quickly.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 5. PRIVACY & SAFETY MODAL */}
      <Modal
        visible={activeModal === "privacy"}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={s.modalContainer} edges={["top", "bottom"]}>
          <View style={s.modalHeader}>
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={s.modalBackBtn}
            >
              <Ionicons name="arrow-back" size={scale(20)} color={t.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Privacy & Safety</Text>
            <View style={{ width: scale(36) }} />
          </View>

          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
            <View style={s.switchCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>Push Notifications</Text>
                <Text style={s.switchSub}>
                  Real-time alerts for chats & posts
                </Text>
              </View>
              <Switch
                value={pushNotifs}
                onValueChange={setPushNotifs}
                trackColor={{ false: t.border, true: t.primary }}
                thumbColor={t.white}
              />
            </View>

            <View style={s.switchCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>Private Profile</Text>
                <Text style={s.switchSub}>
                  Only daymates can view ratings & activities
                </Text>
              </View>
              <Switch
                value={privateProfile}
                onValueChange={setPrivateProfile}
                trackColor={{ false: t.border, true: t.primary }}
                thumbColor={t.white}
              />
            </View>

            <View style={s.switchCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>Two-Factor Authentication</Text>
                <Text style={s.switchSub}>
                  Keep ticket escrow & wallet transfers secure
                </Text>
              </View>
              <Switch
                value={twoFactor}
                onValueChange={setTwoFactor}
                trackColor={{ false: t.border, true: t.primary }}
                thumbColor={t.white}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 6. HELP & SUPPORT MODAL */}
      <Modal
        visible={activeModal === "help"}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={s.modalContainer} edges={["top", "bottom"]}>
          <View style={s.modalHeader}>
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={s.modalBackBtn}
            >
              <Ionicons name="arrow-back" size={scale(20)} color={t.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Help & Support</Text>
            <View style={{ width: scale(36) }} />
          </View>

          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                s.helpItem,
                {
                  backgroundColor: hexA(t.primary, 0.1),
                  borderColor: t.primary,
                  borderWidth: 1,
                  borderRadius: 14,
                  paddingVertical: 12,
                  marginBottom: 8,
                },
              ]}
              onPress={() => setActiveModal("customerCare")}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                }}
              >
                <Ionicons name="headset" size={scale(18)} color={t.primary} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      s.helpTitle,
                      { color: t.primary, fontWeight: "800" },
                    ]}
                  >
                    Chat with Customer Care AI
                  </Text>
                  <Text style={{ fontSize: 11, color: t.sub }}>
                    Instant answers trained on Junto knowledge base
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={scale(16)}
                color={t.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.helpItem}
              onPress={() =>
                Alert.alert(
                  "Ticket Guarantee",
                  "All ticket transfers on Junto are escrow protected.",
                )
              }
            >
              <Text style={s.helpTitle}>How does Ticket Escrow work?</Text>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.helpItem}
              onPress={() =>
                Alert.alert(
                  "Safety Rules",
                  "Always meet daymates in well-lit public places.",
                )
              }
            >
              <Text style={s.helpTitle}>Day Mates Safety Guidelines</Text>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.helpItem}
              onPress={() =>
                Alert.alert("Contact Us", "Support email: support@junto.app")
              }
            >
              <Text style={s.helpTitle}>Contact Customer Support</Text>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 7. INVITE FRIENDS MODAL */}
      <Modal
        visible={activeModal === "invite"}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={s.modalContainer} edges={["top", "bottom"]}>
          <View style={s.modalHeader}>
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={s.modalBackBtn}
            >
              <Ionicons name="arrow-back" size={scale(20)} color={t.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Invite Friends</Text>
            <View style={{ width: scale(36) }} />
          </View>

          <View style={s.modalBody}>
            <View style={s.inviteHeroCard}>
              <Ionicons
                name="gift-outline"
                size={scale(54)}
                color={t.primary}
              />
              <Text style={s.inviteHeroTitle}>Earn ₹100 for every friend!</Text>
              <Text style={s.inviteHeroSub}>
                Invite your friends to Junto. When they complete their first
                ticket swap or join an activity, both of you get ₹100 in your
                wallet.
              </Text>

              <View style={s.codeBox}>
                <Text style={s.codeText}>
                  JUNTO-{user?.name?.slice(0, 4).toUpperCase() || "BHAR"}100
                </Text>
                <TouchableOpacity
                  style={s.copyBtn}
                  onPress={() =>
                    Alert.alert("Copied!", "Referral code copied to clipboard.")
                  }
                >
                  <Text style={s.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={s.primaryActionBtn}
                onPress={handleShareProfile}
              >
                <Text style={s.primaryActionText}>Share Invite Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 8. SETTINGS & LOGOUT MODAL */}
      <Modal
        visible={activeModal === "settings"}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={s.modalContainer} edges={["top", "bottom"]}>
          <View style={s.modalHeader}>
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={s.modalBackBtn}
            >
              <Ionicons name="arrow-back" size={scale(20)} color={t.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>App Settings</Text>
            <View style={{ width: scale(36) }} />
          </View>

          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={s.helpItem}
              onPress={() => {
                setActiveModal(null);
                setActiveModal("edit");
              }}
            >
              <Text style={s.helpTitle}>Edit Account Information</Text>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.helpItem}
              onPress={() => {
                setActiveModal(null);
                setActiveModal("privacy");
              }}
            >
              <Text style={s.helpTitle}>Notification Preferences</Text>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.helpItem}
              onPress={() => router.push("/(screens)/location-search")}
            >
              <Text style={s.helpTitle}>Change Current Location</Text>
              <Ionicons name="chevron-forward" size={scale(16)} color={t.sub} />
            </TouchableOpacity>

            {/* Appearance & Theme Selector */}
            <View
              style={{
                marginTop: verticalScale(20),
                marginBottom: verticalScale(8),
              }}
            >
              <Text
                style={{
                  fontSize: moderateScale(12),
                  fontWeight: "700",
                  color: t.sub,
                  marginBottom: verticalScale(10),
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Appearance & Theme
              </Text>
              <View style={{ flexDirection: "row", gap: scale(8) }}>
                {(["light", "dark", "system"] as const).map((mode) => {
                  const isSelected = themeMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setTheme(mode)}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: scale(6),
                        paddingVertical: verticalScale(10),
                        paddingHorizontal: scale(8),
                        borderRadius: scale(10),
                        backgroundColor: isSelected
                          ? hexA(t.primary, 0.15)
                          : t.cardSecondary,
                        borderWidth: 1.5,
                        borderColor: isSelected ? t.primary : t.border,
                      }}
                    >
                      <Ionicons
                        name={
                          mode === "light"
                            ? "sunny"
                            : mode === "dark"
                              ? "moon"
                              : "phone-portrait-outline"
                        }
                        size={scale(16)}
                        color={isSelected ? t.primary : t.sub}
                      />
                      <Text
                        style={{
                          fontSize: moderateScale(12),
                          fontWeight: isSelected ? "700" : "500",
                          color: isSelected ? t.primary : t.text,
                          textTransform: "capitalize",
                        }}
                      >
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ marginTop: verticalScale(32) }}>
              <TouchableOpacity
                style={s.logoutButton}
                onPress={() => {
                  setActiveModal(null);
                  logout();
                }}
              >
                <Ionicons
                  name="log-out-outline"
                  size={scale(18)}
                  color={t.error}
                />
                <Text style={s.logoutText}>Sign Out from Junto Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 9. JUNTO PREMIUM MODAL */}
      <Modal
        visible={activeModal === "premium"}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={s.modalContainer} edges={["top", "bottom"]}>
          <View style={s.modalHeader}>
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={s.modalBackBtn}
            >
              <Ionicons name="close" size={scale(20)} color={t.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Junto Premium</Text>
            <View style={{ width: scale(36) }} />
          </View>

          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
            <View style={s.premiumHeroBox}>
              <Ionicons name="ribbon" size={scale(60)} color="#FBBF24" />
              <Text style={s.premiumHeroTitle}>Upgrade to Junto Gold</Text>
              <Text style={s.premiumHeroSub}>
                Get priority radar placement, zero service fees on ticket swaps,
                and instant verified badge.
              </Text>
            </View>

            <View
              style={{ gap: verticalScale(12), marginTop: verticalScale(16) }}
            >
              <View style={s.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={scale(20)}
                  color={t.success}
                />
                <Text style={s.featureText}>
                  Priority placement on nearby Radar
                </Text>
              </View>
              <View style={s.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={scale(20)}
                  color={t.success}
                />
                <Text style={s.featureText}>
                  0% Escrow fee on concert & movie ticket swaps
                </Text>
              </View>
              <View style={s.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={scale(20)}
                  color={t.success}
                />
                <Text style={s.featureText}>
                  Gold Verified badge on profile
                </Text>
              </View>
              <View style={s.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={scale(20)}
                  color={t.success}
                />
                <Text style={s.featureText}>
                  Unlimited direct messages with daymates
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={s.upgradeActionBtn}
              onPress={() => {
                Alert.alert(
                  "Welcome to Premium!",
                  "Your 7-day free trial has been activated.",
                );
                setActiveModal(null);
              }}
            >
              <Text style={s.upgradeActionText}>
                Start 7-Day Free Trial (₹199/mo)
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 10. CUSTOMER CARE AI CHAT MODAL */}
      <Modal
        visible={activeModal === "customerCare"}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveModal(null)}
      >
        <CustomerCareChatModal onClose={() => setActiveModal(null)} />
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    scrollContent: {
      paddingBottom: 0,
    },

    /* 1. TOP HEADER SECTION */
    headerSection: {
      paddingHorizontal: scale(18),
      paddingTop: verticalScale(10),
      paddingBottom: verticalScale(12),
    },
    topActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: scale(10),
      marginBottom: verticalScale(12),
    },
    topIconButton: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      backgroundColor: t.cardSecondary,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: "center",
      justifyContent: "center",
    },
    profileMainRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: scale(14),
    },

    /* Avatar */
    avatarContainer: {
      position: "relative",
    },
    avatarGlowRing: {
      width: scale(72),
      height: scale(72),
      borderRadius: scale(36),
      padding: scale(2.5),
      backgroundColor: t.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarImage: {
      width: scale(67),
      height: scale(67),
      borderRadius: scale(33.5),
      borderWidth: scale(2),
      borderColor: t.bg,
    },
    editAvatarBadge: {
      position: "absolute",
      bottom: -1,
      right: -1,
      width: scale(22),
      height: scale(22),
      borderRadius: scale(11),
      backgroundColor: t.primary,
      borderWidth: scale(2),
      borderColor: t.bg,
      alignItems: "center",
      justifyContent: "center",
    },

    /* Meta Text */
    metaContainer: {
      flex: 1,
      justifyContent: "center",
    },
    nameBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(5),
    },
    nameText: {
      fontSize: moderateScale(19),
      fontWeight: "900",
      color: t.text,
      letterSpacing: -0.3,
    },
    handleText: {
      fontSize: moderateScale(12),
      color: t.sub,
      fontWeight: "600",
      marginTop: verticalScale(1),
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(4),
      marginTop: verticalScale(5),
    },
    locationText: {
      fontSize: moderateScale(11.5),
      color: t.sub,
      fontWeight: "500",
      maxWidth: scale(160),
    },
    changeLocationText: {
      fontSize: moderateScale(11.5),
      color: t.primary,
      fontWeight: "700",
      marginLeft: scale(2),
    },
    bioText: {
      fontSize: moderateScale(11.5),
      color: t.sub,
      lineHeight: moderateScale(16),
      marginTop: verticalScale(7),
    },

    /* 2. NUMERICAL STATS CARD */
    statsCardWrapper: {
      marginHorizontal: scale(16),
      marginTop: verticalScale(12),
      marginBottom: verticalScale(14),
    },
    statsCard: {
      backgroundColor: t.card,
      borderRadius: scale(20),
      borderWidth: 1,
      borderColor: t.border,
      paddingVertical: verticalScale(14),
      paddingHorizontal: scale(8),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      ...Platform.select({
        ios: {
          shadowColor: t.shadow,
          shadowOpacity: t.shadowOpacity,
          shadowRadius: scale(10),
          shadowOffset: { width: 0, height: verticalScale(4) },
        },
        android: { elevation: 4 },
        default: {},
      }),
    },
    statCol: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    statNumber: {
      fontSize: moderateScale(15),
      fontWeight: "900",
      color: t.text,
      marginTop: verticalScale(4),
    },
    statLabel: {
      fontSize: moderateScale(10),
      fontWeight: "600",
      color: t.sub,
      marginTop: verticalScale(2),
    },
    statDivider: {
      width: 1,
      height: verticalScale(28),
      backgroundColor: t.divider,
    },

    /* 3. JUNTO PREMIUM BANNER */
    premiumCardWrapper: {
      marginHorizontal: scale(16),
      marginBottom: verticalScale(16),
    },
    premiumCard: {
      backgroundColor: t.card,
      borderRadius: scale(20),
      borderWidth: 1,
      borderColor: t.border,
      padding: scale(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    premiumLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(10),
      flex: 1,
    },
    crownIconBg: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(19),
      backgroundColor: hexA(t.primary, 0.18),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(251, 191, 36, 0.4)",
    },
    premiumTextCol: {
      flex: 1,
    },
    premiumTitle: {
      fontSize: moderateScale(13.5),
      fontWeight: "800",
      color: t.text,
    },
    premiumSub: {
      fontSize: moderateScale(10),
      color: t.sub,
      marginTop: verticalScale(2),
    },
    upgradePillButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(3),
      backgroundColor: t.primary,
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(7),
      borderRadius: scale(16),
    },
    upgradePillText: {
      fontSize: moderateScale(11),
      fontWeight: "800",
      color: t.white,
    },

    /* SECTION HEADERS */
    sectionContainer: {
      marginHorizontal: scale(16),
      marginBottom: verticalScale(16),
    },
    sectionHeaderTitle: {
      fontSize: moderateScale(13),
      fontWeight: "800",
      color: t.text,
      marginBottom: verticalScale(8),
      marginLeft: scale(4),
    },

    /* MENU CARD CONTAINER */
    menuListCard: {
      backgroundColor: t.card,
      borderRadius: scale(20),
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
    },
    menuItemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: scale(14),
      paddingVertical: verticalScale(12),
      gap: scale(12),
    },
    menuIconBg: {
      width: scale(32),
      height: scale(32),
      borderRadius: scale(16),
      alignItems: "center",
      justifyContent: "center",
    },
    menuTextCol: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: moderateScale(13),
      fontWeight: "800",
      color: t.text,
    },
    menuItemSub: {
      fontSize: moderateScale(10.5),
      color: t.sub,
      marginTop: verticalScale(1),
    },
    menuItemSeparator: {
      height: 1,
      backgroundColor: t.divider,
      marginLeft: scale(58),
    },

    /* BADGES */
    badgePill: {
      backgroundColor: t.primary,
      paddingHorizontal: scale(6),
      paddingVertical: verticalScale(1),
      borderRadius: scale(10),
    },
    badgePillText: {
      fontSize: moderateScale(10),
      fontWeight: "900",
      color: t.white,
    },
    rewardTagPill: {
      backgroundColor: hexA(t.primary, 0.18),
      paddingHorizontal: scale(8),
      paddingVertical: verticalScale(3),
      borderRadius: scale(12),
      borderWidth: 1,
      borderColor: hexA(t.primary, 0.3),
    },
    rewardTagText: {
      fontSize: moderateScale(10),
      fontWeight: "800",
      color: t.primary,
    },

    /* MODALS STYLING */
    modalContainer: {
      flex: 1,
      backgroundColor: t.bg,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(12),
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    modalBackBtn: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.cardSecondary,
    },
    modalTitle: {
      fontSize: moderateScale(16),
      fontWeight: "900",
      color: t.text,
    },
    modalSaveBtn: {
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(6),
      backgroundColor: t.primary,
      borderRadius: scale(12),
    },
    modalSaveText: {
      color: t.white,
      fontWeight: "800",
      fontSize: moderateScale(12),
    },
    modalBody: {
      flex: 1,
      padding: scale(16),
    },

    /* EDIT PROFILE MODAL */
    editAvatarLarge: {
      width: scale(90),
      height: scale(90),
      borderRadius: scale(45),
      borderWidth: scale(3),
      borderColor: t.primary,
    },
    changePhotoBtn: {
      marginTop: verticalScale(8),
    },
    changePhotoText: {
      color: t.primary,
      fontWeight: "700",
      fontSize: moderateScale(12),
    },
    inputGroup: {
      marginBottom: verticalScale(16),
    },
    inputLabel: {
      color: t.sub,
      fontSize: moderateScale(11),
      fontWeight: "700",
      marginBottom: verticalScale(6),
      textTransform: "uppercase",
    },
    textInput: {
      backgroundColor: t.inputBg,
      borderWidth: 1,
      borderColor: t.inputBorder,
      borderRadius: scale(12),
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(10),
      color: t.text,
      fontSize: moderateScale(13),
    },

    /* CARDS & LISTS IN MODALS */
    postCard: {
      flexDirection: "row",
      gap: scale(12),
      backgroundColor: t.card,
      borderRadius: scale(16),
      padding: scale(12),
      marginBottom: verticalScale(12),
      borderWidth: 1,
      borderColor: t.border,
    },
    postImage: {
      width: scale(60),
      height: scale(60),
      borderRadius: scale(10),
    },
    postCategory: {
      fontSize: moderateScale(9),
      color: t.primary,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    postTitle: {
      fontSize: moderateScale(13),
      fontWeight: "800",
      color: t.text,
      marginTop: 2,
    },
    postLocation: {
      fontSize: moderateScale(10.5),
      color: t.sub,
      marginTop: 2,
    },
    postActionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(8),
      marginTop: verticalScale(8),
    },
    resolveBtn: {
      backgroundColor: hexA(t.primary, 0.18),
      paddingHorizontal: scale(10),
      paddingVertical: verticalScale(4),
      borderRadius: scale(8),
    },
    resolveBtnText: {
      color: t.primary,
      fontSize: moderateScale(10),
      fontWeight: "800",
    },
    deleteBtn: {
      padding: scale(4),
    },

    /* EMPTY STATE */
    emptyStateBox: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(40),
      paddingHorizontal: scale(20),
    },
    emptyStateTitle: {
      fontSize: moderateScale(16),
      fontWeight: "800",
      color: t.text,
      marginTop: verticalScale(12),
    },
    emptyStateSub: {
      fontSize: moderateScale(11.5),
      color: t.sub,
      textAlign: "center",
      marginTop: verticalScale(6),
      lineHeight: moderateScale(16),
    },
    primaryActionBtn: {
      backgroundColor: t.primary,
      paddingHorizontal: scale(20),
      paddingVertical: verticalScale(12),
      borderRadius: scale(14),
      marginTop: verticalScale(18),
    },
    primaryActionText: {
      color: t.white,
      fontSize: moderateScale(12.5),
      fontWeight: "800",
    },

    /* SWITCH CARDS */
    switchCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.card,
      padding: scale(14),
      borderRadius: scale(16),
      marginBottom: verticalScale(12),
      borderWidth: 1,
      borderColor: t.border,
    },
    switchTitle: {
      fontSize: moderateScale(13),
      fontWeight: "800",
      color: t.text,
    },
    switchSub: {
      fontSize: moderateScale(10.5),
      color: t.sub,
      marginTop: 2,
    },

    /* HELP ITEMS */
    helpItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: t.card,
      padding: scale(14),
      borderRadius: scale(16),
      marginBottom: verticalScale(10),
      borderWidth: 1,
      borderColor: t.border,
    },
    helpTitle: {
      fontSize: moderateScale(12.5),
      fontWeight: "700",
      color: t.text,
    },

    /* INVITE HERO */
    inviteHeroCard: {
      alignItems: "center",
      backgroundColor: t.card,
      padding: scale(20),
      borderRadius: scale(24),
      borderWidth: 1,
      borderColor: t.border,
    },
    inviteHeroTitle: {
      fontSize: moderateScale(17),
      fontWeight: "900",
      color: t.text,
      marginTop: verticalScale(12),
    },
    inviteHeroSub: {
      fontSize: moderateScale(11.5),
      color: t.sub,
      textAlign: "center",
      marginTop: verticalScale(6),
      lineHeight: moderateScale(16),
    },
    codeBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.bg,
      borderWidth: 1,
      borderColor: hexA(t.primary, 0.4),
      borderRadius: scale(14),
      paddingHorizontal: scale(14),
      paddingVertical: verticalScale(8),
      marginTop: verticalScale(16),
      gap: scale(12),
    },
    codeText: {
      fontSize: moderateScale(14),
      fontWeight: "900",
      color: t.primary,
      letterSpacing: 1,
    },
    copyBtn: {
      backgroundColor: t.primary,
      paddingHorizontal: scale(10),
      paddingVertical: verticalScale(4),
      borderRadius: scale(8),
    },
    copyBtnText: {
      fontSize: moderateScale(11),
      fontWeight: "800",
      color: t.white,
    },

    /* SETTINGS & LOGOUT */
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: scale(8),
      backgroundColor: hexA(t.error, 0.12),
      borderWidth: 1,
      borderColor: hexA(t.error, 0.3),
      paddingVertical: verticalScale(14),
      borderRadius: scale(16),
    },
    logoutText: {
      color: t.error,
      fontSize: moderateScale(12.5),
      fontWeight: "800",
    },

    /* PREMIUM HERO */
    premiumHeroBox: {
      alignItems: "center",
      paddingVertical: verticalScale(20),
    },
    premiumHeroTitle: {
      fontSize: moderateScale(18),
      fontWeight: "900",
      color: t.text,
      marginTop: verticalScale(10),
    },
    premiumHeroSub: {
      fontSize: moderateScale(11.5),
      color: t.sub,
      textAlign: "center",
      marginTop: verticalScale(6),
      lineHeight: moderateScale(16),
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(10),
      backgroundColor: t.card,
      padding: scale(12),
      borderRadius: scale(12),
    },
    featureText: {
      fontSize: moderateScale(12),
      color: t.text,
      fontWeight: "600",
    },
    upgradeActionBtn: {
      backgroundColor: t.primary,
      paddingVertical: verticalScale(14),
      borderRadius: scale(16),
      alignItems: "center",
      marginTop: verticalScale(24),
    },
    upgradeActionText: {
      color: t.white,
      fontSize: moderateScale(13),
      fontWeight: "900",
    },
  });
