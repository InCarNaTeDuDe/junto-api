// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TextInput,
//   Pressable,
//   Image,
// } from "react-native";
// import {
//   Search,
//   Plus,
//   MessageSquare,
//   Ticket,
//   UserCheck,
//   HelpCircle,
//   ChevronRight,
// } from "lucide-react-native";
// import { useStore, Chat } from "../../hooks/useStore";

// export default function ChatsScreen() {
//   const { state, setActiveChatId } = useStore();
//   const [activeSegment, setActiveSegment] = useState<"All" | "Categories">(
//     "All",
//   );
//   const [activeCategoryFilter, setActiveCategoryFilter] = useState<
//     "All" | "Ticket Swap" | "Lost & Found" | "Day Mates"
//   >("All");
//   const [searchQuery, setSearchQuery] = useState("");

//   // Categories filter list
//   const categoryFilters: (
//     | "All"
//     | "Ticket Swap"
//     | "Lost & Found"
//     | "Day Mates"
//   )[] = ["All", "Ticket Swap", "Lost & Found", "Day Mates"];

//   // Conversations filtered list (Screen 8)
//   const filteredChats = state.chats.filter((chat) => {
//     const matchesCategory =
//       activeCategoryFilter === "All" || chat.category === activeCategoryFilter;
//     const matchesSearch =
//       chat.partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       chat.contextTitle.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesCategory && matchesSearch;
//   });

//   return (
//     <View className="flex-1 bg-slate-950">
//       {/* SCREEN 7 & 8: Top Bar */}
//       <View className="pt-16 pb-4 px-6 bg-slate-900 border-b border-slate-800">
//         <View className="flex-row justify-between items-center mb-4">
//           <Text className="text-white text-2xl font-black tracking-tight">
//             Chats
//           </Text>
//           <Pressable className="w-9 h-9 bg-slate-950 border border-slate-800 rounded-xl items-center justify-center active:bg-slate-900">
//             <Plus size={18} color="#c084fc" />
//           </Pressable>
//         </View>

//         {/* Custom toggle segment (Conversations vs. Categories) */}
//         <View className="flex-row bg-slate-950 p-1.5 rounded-xl border border-slate-850">
//           <Pressable
//             onPress={() => setActiveSegment("All")}
//             className={`flex-1 py-2.5 rounded-lg items-center ${activeSegment === "All" ? "bg-purple-600 shadow" : ""}`}
//           >
//             <Text
//               className={`text-2xs font-extrabold ${activeSegment === "All" ? "text-white" : "text-slate-400"}`}
//             >
//               Conversations
//             </Text>
//           </Pressable>
//           <Pressable
//             onPress={() => setActiveSegment("Categories")}
//             className={`flex-1 py-2.5 rounded-lg items-center ${activeSegment === "Categories" ? "bg-purple-600 shadow" : ""}`}
//           >
//             <Text
//               className={`text-2xs font-extrabold ${activeSegment === "Categories" ? "text-white" : "text-slate-400"}`}
//             >
//               By Category
//             </Text>
//           </Pressable>
//         </View>
//       </View>

//       {/* SEGMENT 1: Conversations list (Screen 8) */}
//       {activeSegment === "All" && (
//         <View className="flex-1">
//           {/* Search Box */}
//           <View className="px-6 py-4 bg-slate-950 border-b border-slate-900">
//             <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5">
//               <Search size={16} color="#64748b" />
//               <TextInput
//                 placeholder="Search chats, items, sellers..."
//                 placeholderTextColor="#475569"
//                 value={searchQuery}
//                 onChangeText={setSearchQuery}
//                 className="flex-1 ml-2.5 text-white text-xs font-semibold"
//               />
//             </View>
//           </View>

//           {/* Category Filters row */}
//           <View className="bg-slate-950 py-3 border-b border-slate-900">
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
//             >
//               {categoryFilters.map((filter) => (
//                 <Pressable
//                   key={filter}
//                   onPress={() => setActiveCategoryFilter(filter)}
//                   className={`px-4 py-2 rounded-xl border ${
//                     activeCategoryFilter === filter
//                       ? "bg-purple-600 border-purple-500"
//                       : "bg-slate-900 border-slate-800"
//                   }`}
//                 >
//                   <Text
//                     className={`text-3xs font-black uppercase tracking-wider ${activeCategoryFilter === filter ? "text-white" : "text-slate-400"}`}
//                   >
//                     {filter === "Ticket Swap" ? "Tickets" : filter}
//                   </Text>
//                 </Pressable>
//               ))}
//             </ScrollView>
//           </View>

//           {/* Conversations Feed */}
//           <ScrollView
//             className="flex-1 px-6 pt-4 pb-12"
//             showsVerticalScrollIndicator={false}
//           >
//             <View className="gap-3">
//               {filteredChats.map((chat) => {
//                 const lastMsg = chat.messages[chat.messages.length - 1];
//                 return (
//                   <Pressable
//                     key={chat.id}
//                     onPress={() => setActiveChatId(chat.id)}
//                     className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-row items-center gap-3.5 active:bg-slate-850"
//                   >
//                     {/* Avatar with status indicator */}
//                     <View className="relative">
//                       <Image
//                         source={{ uri: chat.partner.avatar }}
//                         className="w-11 h-11 rounded-full border border-slate-800"
//                       />
//                       {chat.partner.isOnline && (
//                         <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
//                       )}
//                     </View>

//                     {/* Chat Text Details */}
//                     <View className="flex-1 justify-center">
//                       <View className="flex-row justify-between items-center">
//                         <Text className="text-white text-xs font-black">
//                           {chat.partner.name}
//                         </Text>
//                         <Text className="text-slate-500 text-5xs font-semibold">
//                           {lastMsg?.timestamp || "Yesterday"}
//                         </Text>
//                       </View>

//                       <Text
//                         className="text-purple-400 text-5xs font-black uppercase tracking-widest mt-0.5"
//                         numberOfLines={1}
//                       >
//                         {chat.category} • {chat.contextTitle}
//                       </Text>

//                       <Text
//                         className="text-slate-300 text-3xs font-medium mt-1"
//                         numberOfLines={1}
//                       >
//                         {lastMsg?.text || "No messages yet"}
//                       </Text>
//                     </View>

//                     {/* Unread dot count */}
//                     {chat.unreadCount > 0 && (
//                       <View className="w-5 h-5 bg-purple-500 rounded-full items-center justify-center border border-slate-950">
//                         <Text className="text-white text-5xs font-black">
//                           {chat.unreadCount}
//                         </Text>
//                       </View>
//                     )}
//                   </Pressable>
//                 );
//               })}

//               {filteredChats.length === 0 && (
//                 <View className="bg-slate-900/30 border border-slate-850 rounded-2xl p-8 items-center justify-center mt-4">
//                   <Text className="text-slate-500 text-xs font-semibold text-center">
//                     No conversations found
//                   </Text>
//                 </View>
//               )}
//             </View>
//           </ScrollView>
//         </View>
//       )}

//       {/* SEGMENT 2: Chats by Category (Screen 7) */}
//       {activeSegment === "Categories" && (
//         <ScrollView
//           className="flex-1 px-6 py-6"
//           showsVerticalScrollIndicator={false}
//         >
//           <Text className="text-slate-400 text-3xs font-black uppercase tracking-wider mb-4 px-1">
//             Chats by Category
//           </Text>

//           <View className="gap-4">
//             {/* Category Card 1: Ticket Swap */}
//             <Pressable
//               onPress={() => {
//                 setActiveCategoryFilter("Ticket Swap");
//                 setActiveSegment("All");
//               }}
//               className="bg-slate-900 border border-slate-800 p-5 rounded-2xl active:bg-slate-850"
//             >
//               <View className="flex-row justify-between items-center mb-3">
//                 <View className="flex-row items-center gap-3">
//                   <View className="w-8 h-8 rounded-lg bg-purple-500/10 items-center justify-center">
//                     <Ticket size={16} color="#c084fc" />
//                   </View>
//                   <View>
//                     <Text className="text-white text-sm font-black">
//                       Ticket Swap
//                     </Text>
//                     <Text className="text-slate-500 text-4xs font-bold uppercase mt-0.5">
//                       12 conversations
//                     </Text>
//                   </View>
//                 </View>
//                 <ChevronRight size={16} color="#475569" />
//               </View>

//               {/* Horizontal user avatars stack */}
//               <View className="flex-row items-center pt-2 border-t border-slate-850">
//                 <View className="flex-row -space-x-3 mr-3">
//                   <Image
//                     source={{
//                       uri: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100",
//                     }}
//                     className="w-7 h-7 rounded-full border-2 border-slate-900"
//                   />
//                   <Image
//                     source={{
//                       uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
//                     }}
//                     className="w-7 h-7 rounded-full border-2 border-slate-900"
//                   />
//                   <Image
//                     source={{
//                       uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
//                     }}
//                     className="w-7 h-7 rounded-full border-2 border-slate-900"
//                   />
//                   <Image
//                     source={{
//                       uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
//                     }}
//                     className="w-7 h-7 rounded-full border-2 border-slate-900"
//                   />
//                 </View>
//                 <Text className="text-purple-400 text-4xs font-bold">
//                   +7 more
//                 </Text>
//               </View>
//             </Pressable>

//             {/* Category Card 2: Day Mates */}
//             <Pressable
//               onPress={() => {
//                 setActiveCategoryFilter("Day Mates");
//                 setActiveSegment("All");
//               }}
//               className="bg-slate-900 border border-slate-800 p-5 rounded-2xl active:bg-slate-850"
//             >
//               <View className="flex-row justify-between items-center mb-3">
//                 <View className="flex-row items-center gap-3">
//                   <View className="w-8 h-8 rounded-lg bg-amber-500/10 items-center justify-center">
//                     <UserCheck size={16} color="#fbbf24" />
//                   </View>
//                   <View>
//                     <Text className="text-white text-sm font-black">
//                       Day Mates
//                     </Text>
//                     <Text className="text-slate-500 text-4xs font-bold uppercase mt-0.5">
//                       18 conversations
//                     </Text>
//                   </View>
//                 </View>
//                 <ChevronRight size={16} color="#475569" />
//               </View>

//               {/* Avatars */}
//               <View className="flex-row items-center pt-2 border-t border-slate-850">
//                 <View className="flex-row -space-x-3 mr-3">
//                   <Image
//                     source={{
//                       uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
//                     }}
//                     className="w-7 h-7 rounded-full border-2 border-slate-900"
//                   />
//                   <Image
//                     source={{
//                       uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
//                     }}
//                     className="w-7 h-7 rounded-full border-2 border-slate-900"
//                   />
//                   <Image
//                     source={{
//                       uri: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
//                     }}
//                     className="w-7 h-7 rounded-full border-2 border-slate-900"
//                   />
//                   <Image
//                     source={{
//                       uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
//                     }}
//                     className="w-7 h-7 rounded-full border-2 border-slate-900"
//                   />
//                 </View>
//                 <Text className="text-purple-400 text-4xs font-bold">
//                   +13 more
//                 </Text>
//               </View>
//             </Pressable>

//             {/* Category Card 3: Lost & Found */}
//             <Pressable
//               onPress={() => {
//                 setActiveCategoryFilter("Lost & Found");
//                 setActiveSegment("All");
//               }}
//               className="bg-slate-900 border border-slate-800 p-5 rounded-2xl active:bg-slate-850"
//             >
//               <View className="flex-row justify-between items-center mb-3">
//                 <View className="flex-row items-center gap-3">
//                   <View className="w-8 h-8 rounded-lg bg-teal-500/10 items-center justify-center">
//                     <HelpCircle size={16} color="#2dd4bf" />
//                   </View>
//                   <View>
//                     <Text className="text-white text-sm font-black">
//                       Lost & Found
//                     </Text>
//                     <Text className="text-slate-500 text-4xs font-bold uppercase mt-0.5">
//                       5 conversations
//                     </Text>
//                   </View>
//                 </View>
//                 <ChevronRight size={16} color="#475569" />
//               </View>

//               {/* Avatars */}
//               <View className="flex-row items-center pt-2 border-t border-slate-850">
//                 <View className="flex-row -space-x-3 mr-3">
//                   <Image
//                     source={{
//                       uri: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
//                     }}
//                     className="w-7 h-7 rounded-full border-2 border-slate-900"
//                   />
//                   <Image
//                     source={{
//                       uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
//                     }}
//                     className="w-7 h-7 rounded-full border-2 border-slate-900"
//                   />
//                   <Image
//                     source={{
//                       uri: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100",
//                     }}
//                     className="w-7 h-7 rounded-full border-2 border-slate-900"
//                   />
//                 </View>
//                 <Text className="text-purple-400 text-4xs font-bold">
//                   +2 more
//                 </Text>
//               </View>
//             </Pressable>
//           </View>

//           {/* Core Info Footnote */}
//           <View className="mt-8 bg-purple-950/10 border border-purple-900/20 rounded-2xl p-4 flex-row items-start gap-3">
//             <View className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5" />
//             <Text className="text-slate-400 text-3xs font-semibold leading-relaxed flex-1">
//               These are people you've chatted with across different categories.
//               Tap any card to view detailed conversations.
//             </Text>
//           </View>
//         </ScrollView>
//       )}
//     </View>
//   );
// }

// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";

interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
}

interface Thread {
  id: string;
  name: string;
  avatar: string;
  role: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  initialMessages: Message[];
  autoReplyTemplate: string[];
}

const INITIAL_THREADS: Thread[] = [
  {
    id: "rohan",
    name: "Rohan",
    avatar: "https://i.pravatar.cc/80?img=11",
    role: "Movie Ticket Seller",
    lastMessage: "Is 500 each okay with you?",
    lastTime: "Just Now",
    unreadCount: 1,
    initialMessages: [
      {
        id: "m1",
        sender: "them",
        text: "Hey! Saw your click. Are you interested in the Avengers tickets?",
        time: "5:20 PM",
      },
      {
        id: "m2",
        sender: "me",
        text: "Yes! Are they still available?",
        time: "5:21 PM",
      },
      {
        id: "m3",
        sender: "them",
        text: "Yeah, got 2 tickets in Row E, Center.",
        time: "5:22 PM",
      },
      {
        id: "m4",
        sender: "them",
        text: "Is 500 each okay with you?",
        time: "5:23 PM",
      },
    ],
    autoReplyTemplate: [
      "Awesome! Let me send you the payment barcode.",
      "Just received it! Sending the PDF tickets right away 🎟️",
      "Perfect! Enjoy the movie, let me know if you need anything else!",
    ],
  },
  {
    id: "ananya",
    name: "Ananya",
    avatar: "https://i.pravatar.cc/80?img=20",
    role: "Morning Walk Buddy",
    lastMessage: "Awesome! Let's meet at 6:30 AM tomorrow.",
    lastTime: "10m ago",
    unreadCount: 0,
    initialMessages: [
      {
        id: "a1",
        sender: "me",
        text: "Hi! Are you still doing the morning walk at Bandra?",
        time: "5:10 PM",
      },
      {
        id: "a2",
        sender: "them",
        text: "Yes! Usually cover 5km near the promenade.",
        time: "5:12 PM",
      },
      {
        id: "a3",
        sender: "me",
        text: "Can I join tomorrow morning?",
        time: "5:13 PM",
      },
      {
        id: "a4",
        sender: "them",
        text: "Awesome! Let's meet at 6:30 AM tomorrow.",
        time: "5:14 PM",
      },
    ],
    autoReplyTemplate: [
      "I'll wear a purple hoodie so you can spot me easily!",
      "See you in the morning! Sleep early 🏃‍♀️",
      "Yes, the weather is perfect for a walk!",
    ],
  },
  {
    id: "neha",
    name: "Neha",
    avatar: "https://i.pravatar.cc/80?img=32",
    role: "Lost & Found Owner",
    lastMessage: "I found your wallet near the stairs!",
    lastTime: "1h ago",
    unreadCount: 0,
    initialMessages: [
      {
        id: "n1",
        sender: "them",
        text: "Hey, saw your post. I found a black wallet near Dadar Station stairs!",
        time: "4:00 PM",
      },
      {
        id: "n2",
        sender: "me",
        text: "Oh my god, really? Does it have a blue ID card?",
        time: "4:02 PM",
      },
      {
        id: "n3",
        sender: "them",
        text: "Yes, it says Bharath on the card. I kept it safe with me.",
        time: "4:05 PM",
      },
    ],
    autoReplyTemplate: [
      "I'll be near the Starbucks at Dadar until 8 PM today.",
      "No reward needed at all! Just happy to help a buddy out 💜",
      "Awesome, see you soon!",
    ],
  },
];

export default function ChatsScreen() {
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const activeThread = threads.find((t) => t.id === selectedThreadId);

  // Auto scroll to bottom when messages list updates
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeThread?.initialMessages]);

  const handleSend = () => {
    if (!inputText.trim() || !selectedThreadId) return;

    const messageText = inputText.trim();
    setInputText("");

    // Add user's message
    setThreads((prevThreads) => {
      return prevThreads.map((thread) => {
        if (thread.id === selectedThreadId) {
          const newMsg: Message = {
            id: `m-user-${Date.now()}`,
            sender: "me",
            text: messageText,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          return {
            ...thread,
            initialMessages: [...thread.initialMessages, newMsg],
            lastMessage: messageText,
            lastTime: "Just Now",
            unreadCount: 0,
          };
        }
        return thread;
      });
    });

    // Simulate active typing indicators and delay a context-aware mock answer
    setTimeout(() => {
      setThreads((prevThreads) => {
        return prevThreads.map((thread) => {
          if (thread.id === selectedThreadId) {
            const replyText =
              thread.autoReplyTemplate[0] || "Got it, sounds perfect!";
            const updatedTemplate = [
              ...thread.autoReplyTemplate.slice(1),
              thread.autoReplyTemplate[0],
            ];

            const replyMsg: Message = {
              id: `m-reply-${Date.now()}`,
              sender: "them",
              text: replyText,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };

            return {
              ...thread,
              initialMessages: [...thread.initialMessages, replyMsg],
              lastMessage: replyText,
              lastTime: "Just Now",
              autoReplyTemplate: updatedTemplate,
            };
          }
          return thread;
        });
      });
    }, 1200);
  };

  const handleBack = () => {
    setSelectedThreadId(null);
  };

  const selectConversation = (id: string) => {
    setSelectedThreadId(id);
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unreadCount: 0 } : t)),
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={s.container}
    >
      {!selectedThreadId ? (
        /* ==================================== */
        /* THREADS LISTING SCREEN              */
        /* ==================================== */
        <View style={s.content}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Conversations</Text>
            <Text style={s.headerSubtitle}>
              Coordinate exchange spots or meetup times securely
            </Text>
          </View>

          {/* Quick search */}
          <View style={s.searchContainer}>
            <View style={s.searchBar}>
              <Ionicons
                name="search-outline"
                size={moderateScale(15)}
                color="#64748B"
              />
              <TextInput
                placeholder="Search buddies or tickets..."
                placeholderTextColor="#475569"
                style={s.searchInput}
                editable={false}
              />
            </View>
          </View>

          {/* Threads list */}
          <ScrollView
            style={s.threadsScroll}
            showsVerticalScrollIndicator={false}
          >
            {threads.map((thread) => (
              <TouchableOpacity
                key={thread.id}
                onPress={() => selectConversation(thread.id)}
                activeOpacity={0.8}
                style={s.threadCard}
              >
                {/* Avatar with badge */}
                <View style={s.avatarContainer}>
                  <Image source={{ uri: thread.avatar }} style={s.avatar} />
                  {thread.unreadCount > 0 && <View style={s.unreadDot} />}
                </View>

                {/* Meta details */}
                <View style={s.threadBody}>
                  <View style={s.threadMetaRow}>
                    <View style={s.threadNameRow}>
                      <Text style={s.threadName} numberOfLines={1}>
                        {thread.name}
                      </Text>
                      <View style={s.roleTag}>
                        <Text style={s.roleText}>{thread.role}</Text>
                      </View>
                    </View>
                    <Text style={s.threadTime}>{thread.lastTime}</Text>
                  </View>

                  <Text
                    style={[
                      s.lastMsg,
                      thread.unreadCount > 0 ? s.lastMsgUnread : null,
                    ]}
                    numberOfLines={1}
                  >
                    {thread.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Warning banner */}
          <View style={s.warningBanner}>
            <View style={s.warningDot} />
            <Text style={s.warningText}>
              All chats are encrypted and self-destruct after 48h.
            </Text>
          </View>
        </View>
      ) : (
        /* ==================================== */
        /* DIRECT MESSAGE THREAD DIALOG        */
        /* ==================================== */
        <View style={s.chatWrapper}>
          {/* DM Header */}
          <View style={s.dmHeader}>
            <View style={s.dmHeaderLeft}>
              <TouchableOpacity
                onPress={handleBack}
                style={s.backBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-back"
                  size={moderateScale(20)}
                  color="#D1D5DB"
                />
              </TouchableOpacity>

              <Image source={{ uri: activeThread.avatar }} style={s.dmAvatar} />

              <View style={s.dmMeta}>
                <Text style={s.dmName}>{activeThread.name}</Text>
                <Text style={s.dmRole}>{activeThread.role}</Text>
              </View>
            </View>

            <View style={s.liveBadge}>
              <Ionicons
                name="sparkles"
                size={moderateScale(10)}
                color="#A78BFA"
                style={s.sparkleIcon}
              />
              <Text style={s.liveBadgeText}>Live Buddy</Text>
            </View>
          </View>

          {/* Message Bubbles Scroll */}
          <ScrollView
            ref={scrollRef}
            style={s.chatScroll}
            contentContainerStyle={s.chatScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeThread.initialMessages.map((msg) => {
              const isMe = msg.sender === "me";
              return (
                <View
                  key={msg.id}
                  style={[s.bubbleWrapper, isMe ? s.bubbleMe : s.bubbleThem]}
                >
                  <View
                    style={[s.bubble, isMe ? s.bubbleMeBg : s.bubbleThemBg]}
                  >
                    <Text style={s.bubbleText}>{msg.text}</Text>
                    <Text
                      style={[
                        s.bubbleTime,
                        isMe ? { color: "#E0E7FF" } : { color: "#64748B" },
                      ]}
                    >
                      {msg.time}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Floating DM Input Box */}
          <View style={s.inputContainer}>
            <TextInput
              placeholder={`Send message to ${activeThread.name}...`}
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              style={s.chatInput}
            />
            <TouchableOpacity
              onPress={handleSend}
              activeOpacity={0.8}
              style={s.sendBtn}
            >
              <Ionicons name="send" size={moderateScale(14)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070514",
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: verticalScale(2),
  },
  searchContainer: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(12),
  },
  searchBar: {
    height: verticalScale(38),
    backgroundColor: "#131127",
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: scale(12),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: "#FFFFFF",
  },
  threadsScroll: {
    flex: 1,
    paddingHorizontal: scale(20),
    marginTop: verticalScale(16),
  },
  threadCard: {
    backgroundColor: "rgba(18, 14, 44, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: scale(18),
    padding: scale(12),
    flexDirection: "row",
    gap: scale(12),
    marginBottom: verticalScale(10),
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(14),
    backgroundColor: "#0B081B",
  },
  unreadDot: {
    position: "absolute",
    top: scale(-2),
    right: scale(-2),
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#8B5CF6",
    borderWidth: 1.5,
    borderColor: "#070514",
  },
  threadBody: {
    flex: 1,
    justifyContent: "space-between",
    height: scale(40),
  },
  threadMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  threadNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    flex: 1,
  },
  threadName: {
    fontSize: moderateScale(12.5),
    fontWeight: "900",
    color: "#FFFFFF",
    maxWidth: "55%",
  },
  roleTag: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: scale(4),
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
  },
  roleText: {
    fontSize: moderateScale(8.5),
    fontWeight: "700",
    color: "#94A3B8",
  },
  threadTime: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#64748B",
  },
  lastMsg: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
  },
  lastMsgUnread: {
    color: "#A78BFA",
    fontWeight: "700",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "rgba(18, 14, 44, 0.2)",
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    marginTop: "auto",
  },
  warningDot: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
    backgroundColor: "#7C3AED",
  },
  warningText: {
    fontSize: moderateScale(9.5),
    color: "#64748B",
    fontWeight: "600",
  },
  chatWrapper: {
    flex: 1,
    backgroundColor: "#0A071D",
  },
  dmHeader: {
    height: verticalScale(50),
    backgroundColor: "rgba(18, 14, 44, 0.9)",
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
  },
  dmHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    flex: 1,
  },
  backBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  dmAvatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(10),
  },
  dmMeta: {
    justifyContent: "center",
    flex: 1,
  },
  dmName: {
    fontSize: moderateScale(12.5),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  dmRole: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#A78BFA",
    marginTop: scale(1),
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    borderWidth: 0.5,
    borderColor: "rgba(124, 58, 237, 0.25)",
    borderRadius: scale(10),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2.5),
    gap: scale(3),
  },
  sparkleIcon: {},
  liveBadgeText: {
    fontSize: moderateScale(8.5),
    fontWeight: "900",
    color: "#C084FC",
    textTransform: "uppercase",
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    padding: scale(16),
    paddingBottom: verticalScale(80),
  },
  bubbleWrapper: {
    flexDirection: "row",
    marginBottom: verticalScale(12),
    width: "100%",
  },
  bubbleMe: {
    justifyContent: "flex-end",
  },
  bubbleThem: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: scale(16),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
  },
  bubbleMeBg: {
    backgroundColor: "#7C3AED",
    borderTopRightRadius: 0,
  },
  bubbleThemBg: {
    backgroundColor: "#120E2C",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.03)",
    borderTopLeftRadius: 0,
  },
  bubbleText: {
    fontSize: moderateScale(11.5),
    color: "#FFFFFF",
    lineHeight: moderateScale(15),
    fontWeight: "600",
  },
  bubbleTime: {
    fontSize: moderateScale(8.5),
    fontWeight: "700",
    textAlign: "right",
    marginTop: verticalScale(4),
  },
  inputContainer: {
    position: "absolute",
    bottom: scale(14),
    left: scale(14),
    right: scale(14),
    backgroundColor: "#120E2C",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: scale(16),
    padding: scale(6),
    flexDirection: "row",
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: "#FFFFFF",
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
  },
  sendBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(10),
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
});
