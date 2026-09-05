import { useState, useEffect } from "react";

import { ApiService } from "@/services/api";

export interface Host {
  name: string;
  avatar: string;
  rating: number;
  reviews?: number;
}

export interface Post {
  id: string;
  title: string;
  category: "Movie Tickets" | "Lost & Found" | "Day Mates";
  image: string;
  date: string;
  location: string;
  price?: string;
  spotsLeft?: string | number;
  spotsDetail?: string; // e.g. "G10, G11" or "3 spots left"
  tag: string;
  host: Host;
  aboutTickets?: string[];
  description?: string;
  status: "Active" | "Resolved";
  attendees?: string[];
}

export interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  partner: {
    name: string;
    avatar: string;
    rating: number;
    isOnline: boolean;
  };
  category: "Ticket Swap" | "Day Mates" | "Lost & Found";
  contextTitle: string;
  unreadCount: number;
  messages: Message[];
}

export interface AppNotification {
  id: string;
  title?: string;
  message?: string;
  actor?: {
    name: string;
    avatar: string;
  };
  type?: string;
  content?: string;
  timestamp: string | Date;
  read: boolean;
  activityId?: string;
  user?: string;
  userId?: string;
  organizerId?: string;
  place?: string;
  right?: string;
  category?: string;
  avatar?: string;
  data?: any;
}

export interface AppState {
  posts: Post[];
  chats: Chat[];
  notifications: AppNotification[];
  activePostId: string | null;
  activeChatId: string | null;
  showNotifications: boolean;
  currentUser: {
    name: string;
    email: string;
    avatar: string;
    rating: number;
    walletBalance: string;
    location: string;
    memberSince: string;
    bio: string;
    postsCount: number;
    connectionsCount: number;
    groupsCount: number;
  };
}

// Initial Mock Data from Wireframes
const initialPosts: Post[] = [
  {
    id: "p-1",
    title: "Avengers: Endgame",
    category: "Movie Tickets",
    image: "https://images.unsplash.com/photo-1478720143022-9099477e637a?w=800",
    date: "Today, 18 May • 7:30 PM",
    location: "PVR Phoenix Marketcity, Mumbai",
    price: "₹500 each",
    spotsDetail: "2 Tickets",
    tag: "Sci-Fi",
    host: {
      name: "Rohan S.",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
      rating: 4.8,
      reviews: 23,
    },
    aboutTickets: [
      "2 Tickets (Together)",
      "Seats: G10, G11",
      "Original price: ₹600 each",
      "Selling price: ₹500 each (Discounted)",
      "Tickets will be transferred via Paytm",
    ],
    description:
      "Selling spare tickets for tonight since my friends backed out. Great seats near center screen!",
    status: "Active",
    attendees: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    ],
  },
  {
    id: "p-2",
    title: "Spider-Man: No Way Home",
    category: "Movie Tickets",
    image: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800",
    date: "Tomorrow, 19 May • 6:45 PM",
    location: "PVR Icon, Andheri",
    price: "₹400 each",
    spotsDetail: "2 Tickets",
    tag: "Action",
    host: {
      name: "Ananya R.",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      rating: 4.9,
      reviews: 15,
    },
    aboutTickets: [
      "2 Tickets (Side-by-side)",
      "Seats: K14, K15",
      "Original price: ₹550 each",
      "Selling price: ₹400 each",
    ],
    description:
      "Unused tickets for the Spider-man sequel. Digital tickets, instantly shareable.",
    status: "Active",
  },
  {
    id: "p-3",
    title: "Black Wallet",
    category: "Lost & Found",
    image: "https://images.unsplash.com/photo-1627124118303-19d5f0ce0e85?w=800",
    date: "18 May • 10:45 AM",
    location: "Found near Dadar Station",
    spotsDetail: "Found item",
    tag: "Wallet",
    host: {
      name: "Neha P.",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      rating: 4.7,
      reviews: 8,
    },
    description:
      "Found a black leather wallet on platform 3. Contains some cards. Message with identification details to claim.",
    status: "Active",
  },
  {
    id: "p-4",
    title: "Morning Walk Buddy",
    category: "Day Mates",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800",
    date: "Tomorrow • 6:00 AM",
    location: "Bandra Reclamation",
    spotsDetail: "1.1 km away",
    tag: "Fitness",
    host: {
      name: "Ananya R.",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      rating: 4.9,
    },
    description:
      "Looking for a companion for jogging and morning power walk at Bandra Reclamation. Usually do 5k.",
    status: "Active",
    attendees: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    ],
  },
  {
    id: "p-5",
    title: "Midnight Cycling Tour",
    category: "Day Mates",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800",
    date: "Tonight, 10:00 PM",
    location: "Colaba Causeway to Bandra",
    spotsDetail: "3 spots left",
    tag: "Adventure",
    host: {
      name: "Aarav Mehta",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      rating: 4.6,
    },
    description:
      "Cycling around clean Mumbai coastal streets at midnight. Rent a cycle at Colaba if you do not have one!",
    status: "Active",
  },
  {
    id: "p-6",
    title: "Stand-up Comedy Showcase",
    category: "Movie Tickets", // Using as general event tickets
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
    date: "Tomorrow, 8:30 PM",
    location: "The Habitat, Khar",
    price: "₹450 each",
    spotsDetail: "Selling fast",
    tag: "Comedy",
    host: {
      name: "Rohan S.",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
      rating: 4.8,
    },
    status: "Active",
  },
];

const initialChats: Chat[] = [];

const initialNotifications: AppNotification[] = [
  {
    id: "n-1",
    actor: {
      name: "Rohan S.",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    },
    type: "message",
    content: "New message about Avengers: Endgame – 2 Tickets",
    timestamp: "1m ago",
    read: false,
    activityId: "post-1",
    data: {
      activityId: "post-1",
      postId: "post-1",
      title: "Avengers: Endgame – 2 Tickets",
      category: "MOVIE TICKETS",
      user: "Rohan S.",
      place: "PVR Cinemas, Mumbai",
    },
  },
  {
    id: "n-2",
    actor: {
      name: "Ananya R.",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    },
    type: "join_request",
    content: 'Accepted your request to join "Morning Walk Buddy"',
    timestamp: "5m ago",
    read: false,
    activityId: "act-morning-walk",
    data: {
      activityId: "act-morning-walk",
      title: "Morning Walk Buddy",
      category: "DAY MATES",
      user: "Ananya R.",
      place: "Bandra Reclamation, Mumbai",
    },
  },
  {
    id: "n-3",
    actor: {
      name: "Neha P.",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    },
    type: "like",
    content: 'Liked your post "Black Wallet Found near Dadar Station".',
    timestamp: "15m ago",
    read: true,
    activityId: "post-3",
    data: {
      activityId: "post-3",
      postId: "post-3",
      title: "Black Wallet Found near Dadar Station",
      category: "Lost & Found",
      user: "Neha P.",
      place: "Dadar Station, Mumbai",
    },
  },
  {
    id: "n-4",
    actor: {
      name: "Karan M.",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
    type: "message",
    content: "Sent you a message.",
    timestamp: "1h ago",
    read: true,
    activityId: "act-weekend-coffee",
    data: {
      activityId: "act-weekend-coffee",
      title: "Coffee & Tech Discussions",
      category: "DAY MATES",
      user: "Karan M.",
      place: "Starbucks, Bandra",
    },
  },
  {
    id: "n-5",
    actor: {
      name: "Amit P.",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },
    type: "like",
    content: 'Liked your post "iPhone 13 - Blue Lost near Juhu Beach".',
    timestamp: "2h ago",
    read: true,
    activityId: "post-4",
    data: {
      activityId: "post-4",
      postId: "post-4",
      title: "iPhone 13 - Blue Lost near Juhu Beach",
      category: "Lost & Found",
      user: "Amit P.",
      place: "Juhu Beach, Mumbai",
    },
  },
];

// In-Memory Global State Singletone
let state: AppState = {
  posts: initialPosts,
  chats: initialChats,
  notifications: initialNotifications,
  activePostId: null,
  activeChatId: null,
  showNotifications: false,
  currentUser: {
    name: "Rohan Sharma", // Matching Rohan Rohan in profile screens
    email: "rohan.s@gmail.com",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", // High fidelity avatar
    rating: 4.9,
    walletBalance: "₹2,500",
    location: "Mumbai, India",
    memberSince: "Feb 2023",
    bio: "Love movies, morning walks and good conversations over coffee ☕",
    postsCount: 48,
    connectionsCount: 156,
    groupsCount: 12,
  },
};

const listeners = new Set<() => void>();

function updateListeners() {
  listeners.forEach((listener) => listener());
}

export function addNotificationToStore(
  notif: Partial<AppNotification> & { title?: string; message?: string },
) {
  const data = notif.data || {};
  const newNotif: AppNotification = {
    id: notif.id || `n-${Date.now()}`,
    title: notif.title || "Notification",
    message: notif.message || notif.content || "",
    type: notif.type || "system",
    timestamp: notif.timestamp || new Date().toISOString(),
    read: notif.read ?? false,
    actor: notif.actor,
    content: notif.content || notif.message,
    activityId: notif.activityId || (notif as any).data?.activityId,
    user:
      notif.user ||
      (notif as any).data?.user ||
      (notif as any).data?.organizerName,
    userId:
      notif.userId ||
      (notif as any).data?.userId ||
      (notif as any).data?.organizerId,
    organizerId:
      notif.organizerId ||
      (notif as any).data?.organizerId ||
      (notif as any).data?.userId,
    place:
      notif.place ||
      (notif as any).data?.place ||
      (notif as any).data?.locationName,
    right:
      notif.right || (notif as any).data?.right || (notif as any).data?.urgency,
    category:
      notif.category ||
      (notif as any).data?.category ||
      (notif as any).data?.type,
    avatar: notif.avatar || (notif as any).data?.avatar || notif.actor?.avatar,
    data: notif.data,
  };

  const exists = state.notifications.some((n) => n.id === newNotif.id);
  if (!exists) {
    state.notifications = [newNotif, ...state.notifications];
    updateListeners();
  }
}

export async function fetchNotificationsFromApi() {
  try {
    const res = await ApiService.get<{
      success: boolean;
      notifications: any[];
    }>("/api/notifications");
    if (res?.success && Array.isArray(res.notifications)) {
      const fetched: AppNotification[] = res.notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        timestamp: n.timestamp,
        activityId: n.activityId || n.data?.activityId,
        user: n.user || n.data?.user || n.data?.organizerName,
        userId: n.userId || n.data?.userId || n.data?.organizerId,
        organizerId: n.organizerId || n.data?.organizerId || n.data?.userId,
        place: n.place || n.data?.place || n.data?.locationName,
        right: n.right || n.data?.right || n.data?.urgency,
        category: n.category || n.data?.category || n.data?.type,
        avatar: n.avatar || n.data?.avatar,
        data:
          n.data || (n.activityId ? { activityId: n.activityId } : undefined),
      }));

      // Preserve local un-synced ones if any
      const existingIds = new Set(fetched.map((f) => f.id));
      const localOnly = state.notifications.filter(
        (n) => !existingIds.has(n.id),
      );

      state.notifications = [...fetched, ...localOnly];
      updateListeners();
    }
  } catch (e) {
    console.log("Failed to fetch notifications from API:", e);
  }
}

export async function markNotificationsReadInStore() {
  const unreadList = state.notifications.filter((n) => !n.read);
  state.notifications = state.notifications.map((n) => ({
    ...n,
    read: true,
  }));
  updateListeners();

  for (const n of unreadList) {
    try {
      await ApiService.patch(`/api/notifications/${n.id}/read`, {});
    } catch (e) {
      // Ignore individually failed read patches
    }
  }
}

export function useStore() {
  const [localState, setLocalState] = useState<AppState>({ ...state });

  useEffect(() => {
    const listener = () => {
      setLocalState({ ...state });
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const addPost = (newPost: Omit<Post, "id" | "status">) => {
    const post: Post = {
      ...newPost,
      id: `p-${Date.now()}`,
      status: "Active",
    };
    state.posts = [post, ...state.posts];
    state.currentUser.postsCount += 1;
    updateListeners();
  };

  const resolvePost = (postId: string) => {
    state.posts = state.posts.map((p) =>
      p.id === postId ? { ...p, status: "Resolved" } : p,
    );
    updateListeners();
  };

  const deletePost = (postId: string) => {
    state.posts = state.posts.filter((p) => p.id !== postId);
    state.currentUser.postsCount = Math.max(
      0,
      state.currentUser.postsCount - 1,
    );
    updateListeners();
  };

  const addMessage = (chatId: string, text: string) => {
    const message: Message = {
      id: `m-${Date.now()}`,
      sender: "me",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    state.chats = state.chats.map((c) => {
      if (c.id === chatId) {
        // Trigger automated partner response after 1 second for hyper-interactivity!
        setTimeout(() => {
          const replyText = getAutoReply(c.partner.name, c.contextTitle, text);
          const replyMessage: Message = {
            id: `m-${Date.now() + 1}`,
            sender: "them",
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };

          state.chats = state.chats.map((chatItem) => {
            if (chatItem.id === chatId) {
              // Add a notification too!
              const notification: AppNotification = {
                id: `n-${Date.now()}`,
                actor: {
                  name: chatItem.partner.name,
                  avatar: chatItem.partner.avatar,
                },
                type: "message",
                content: `New message from ${chatItem.partner.name} about "${chatItem.contextTitle}"`,
                timestamp: "Just now",
                read: false,
              };
              state.notifications = [notification, ...state.notifications];
              return {
                ...chatItem,
                messages: [...chatItem.messages, replyMessage],
                unreadCount: chatItem.unreadCount + 1,
              };
            }
            return chatItem;
          });
          updateListeners();
        }, 1200);

        return {
          ...c,
          messages: [...c.messages, message],
        };
      }
      return c;
    });
    updateListeners();
  };

  const startOrOpenChat = (
    partnerName: string,
    partnerAvatar: string,
    category: Chat["category"],
    contextTitle: string,
  ) => {
    // Find existing
    const existing = state.chats.find(
      (c) => c.partner.name === partnerName && c.contextTitle === contextTitle,
    );
    if (existing) {
      state.activeChatId = existing.id;
      state.activePostId = null; // Close ticket modal
    } else {
      const newChatId = `c-${Date.now()}`;
      const newChat: Chat = {
        id: newChatId,
        partner: {
          name: partnerName,
          avatar: partnerAvatar,
          rating: 4.8,
          isOnline: true,
        },
        category,
        contextTitle,
        unreadCount: 0,
        messages: [
          {
            id: "m-init",
            sender: "them",
            text: `Hi, I saw your post regarding "${contextTitle}". Let's coordinate here!`,
            timestamp: "Just now",
          },
        ],
      };
      state.chats = [newChat, ...state.chats];
      state.activeChatId = newChatId;
      state.activePostId = null;
    }
    updateListeners();
  };

  const setActivePostId = (id: string | null) => {
    state.activePostId = id;
    updateListeners();
  };

  const setActiveChatId = (id: string | null) => {
    state.activeChatId = id;
    if (id) {
      // Mark as read
      state.chats = state.chats.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c,
      );
    }
    updateListeners();
  };

  const setShowNotifications = (show: boolean) => {
    state.showNotifications = show;
    if (show) {
      markNotificationsReadInStore();
    }
    updateListeners();
  };

  const updateCurrentUserProfile = (
    updates: Partial<AppState["currentUser"]>,
  ) => {
    state.currentUser = { ...state.currentUser, ...updates };
    updateListeners();
  };

  return {
    state: localState,
    addPost,
    resolvePost,
    deletePost,
    addMessage,
    startOrOpenChat,
    setActivePostId,
    setActiveChatId,
    setShowNotifications,
    updateCurrentUserProfile,
  };
}

function getAutoReply(name: string, context: string, userMsg: string): string {
  const msg = userMsg.toLowerCase();
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return `Hey there! How can I help you regarding "${context}"?`;
  }
  if (msg.includes("available") || msg.includes("still have")) {
    return `Yes, they are still available! I can transfer them online or meet up. What works for you?`;
  }
  if (
    msg.includes("price") ||
    msg.includes("cost") ||
    msg.includes("discount")
  ) {
    return `I am selling it for the price mentioned in the post. But let me know if you want to make an offer!`;
  }
  if (
    msg.includes("where") ||
    msg.includes("meet") ||
    msg.includes("location")
  ) {
    return `We can meet around Mumbai West or Andheri. Or I can securely share the ticket PDF via WhatsApp or email.`;
  }
  if (msg.includes("pay") || msg.includes("gpay") || msg.includes("paytm")) {
    return `Awesome! GPay or Paytm works perfectly for me. Let me know when you are ready.`;
  }
  return `Thanks for the details! Sounds good to me. Let's touch base on this soon. 👍`;
}
