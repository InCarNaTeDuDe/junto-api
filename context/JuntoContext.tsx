import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "junto_state_v1";

function makeId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

export interface DayMate {
  id: string;
  activity: string;
  activityEmoji: string;
  time: string;
  matesNeeded: number;
  location: string;
  hostName: string;
  createdAt: number;
}

export interface Ticket {
  id: string;
  eventName: string;
  origPrice: number;
  sellPrice: number;
  qty: number;
  sellerName: string;
  createdAt: number;
}

export interface JuntoEvent {
  id: string;
  name: string;
  location: string;
  type: string;
  maxPeople: number;
  attendees: number;
  hostName: string;
  createdAt: number;
}

export interface Question {
  id: string;
  question: string;
  topic: string;
  urgency: string;
  askerName: string;
  replyCount: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  fromMe: boolean;
  createdAt: number;
}

export interface Conversation {
  id: string;
  name: string;
  initials: string;
  color: string;
  messages: ChatMessage[];
  unread: number;
}

interface Notification {
  id: string;
  text: string;
  createdAt: number;
  read: boolean;
}

interface JuntoState {
  userName: string;
  dayMates: DayMate[];
  tickets: Ticket[];
  events: JuntoEvent[];
  questions: Question[];
  conversations: Conversation[];
  notifications: Notification[];
  notificationsEnabled: boolean;
}

const now = Date.now();

function seedState(): JuntoState {
  return {
    userName: "Bharath",
    dayMates: [
      {
        id: makeId(),
        activity: "Cricket",
        activityEmoji: "🏏",
        time: "Today Evening",
        matesNeeded: 3,
        location: "Bandra, Mumbai",
        hostName: "Rohan",
        createdAt: now - 1000 * 60 * 40,
      },
      {
        id: makeId(),
        activity: "Coffee",
        activityEmoji: "☕",
        time: "This Afternoon",
        matesNeeded: 1,
        location: "Koramangala, Bengaluru",
        hostName: "Meera",
        createdAt: now - 1000 * 60 * 90,
      },
    ],
    tickets: [
      {
        id: makeId(),
        eventName: "Coldplay: Music of the Spheres",
        origPrice: 5000,
        sellPrice: 3500,
        qty: 2,
        sellerName: "Ananya",
        createdAt: now - 1000 * 60 * 60 * 3,
      },
    ],
    events: [
      {
        id: makeId(),
        name: "Friday Turf Football",
        location: "Astro Arena Turf",
        type: "Turf Game",
        maxPeople: 14,
        attendees: 9,
        hostName: "Vikram",
        createdAt: now - 1000 * 60 * 60 * 5,
      },
    ],
    questions: [
      {
        id: makeId(),
        question: "Is the entry fee at Toit active tonight?",
        topic: "Entry Fees",
        urgency: "Normal Info",
        askerName: "Sana",
        replyCount: 2,
        createdAt: now - 1000 * 60 * 20,
      },
    ],
    conversations: [
      {
        id: makeId(),
        name: "Rohan",
        initials: "R",
        color: "#7C3AED",
        unread: 2,
        messages: [
          {
            id: makeId(),
            text: "Hey! Saw your cricket post, I'm in for this evening.",
            fromMe: false,
            createdAt: now - 1000 * 60 * 35,
          },
          {
            id: makeId(),
            text: "Bring one more mate if you can, we need a full team.",
            fromMe: false,
            createdAt: now - 1000 * 60 * 30,
          },
        ],
      },
      {
        id: makeId(),
        name: "Meera",
        initials: "M",
        color: "#F59E0B",
        unread: 0,
        messages: [
          {
            id: makeId(),
            text: "Coffee at 4? Third Wave Koramangala works for me.",
            fromMe: false,
            createdAt: now - 1000 * 60 * 85,
          },
        ],
      },
    ],
    notifications: [
      {
        id: makeId(),
        text: "Rohan replied to your cricket day mates post",
        createdAt: now - 1000 * 60 * 30,
        read: false,
      },
      {
        id: makeId(),
        text: "Sana got a reply on her question about Toit",
        createdAt: now - 1000 * 60 * 15,
        read: false,
      },
    ],
    notificationsEnabled: true,
  };
}

interface JuntoContextValue {
  loaded: boolean;
  userName: string;
  dayMates: DayMate[];
  tickets: Ticket[];
  events: JuntoEvent[];
  questions: Question[];
  conversations: Conversation[];
  notifications: Notification[];
  unreadNotificationCount: number;
  unreadChatCount: number;
  notificationsEnabled: boolean;
  setUserName: (name: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  addDayMate: (data: Omit<DayMate, "id" | "createdAt" | "hostName">) => void;
  addTicket: (data: Omit<Ticket, "id" | "createdAt" | "sellerName">) => void;
  addEvent: (
    data: Omit<JuntoEvent, "id" | "createdAt" | "attendees" | "hostName">,
  ) => void;
  addQuestion: (
    data: Omit<Question, "id" | "createdAt" | "askerName" | "replyCount">,
  ) => void;
  rsvpToEvent: (id: string) => void;
  buyTicket: (id: string) => void;
  markNotificationsRead: () => void;
  markConversationRead: (id: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
  startConversation: (name: string) => string;
  resetDemoData: () => void;
}

const JuntoContext = createContext<JuntoContextValue | undefined>(undefined);

export function JuntoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<JuntoState>(seedState);
  const [loaded, setLoaded] = useState(false);

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const raw = await AsyncStorage.getItem(STORAGE_KEY);
  //       if (raw) {
  //         setState(JSON.parse(raw));
  //       }
  //     } finally {
  //       setLoaded(true);
  //     }
  //   })();
  // }, []);

  useEffect(() => {
    if (!loaded) return;
    // AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const value = useMemo<JuntoContextValue>(() => {
    const unreadNotificationCount = state.notifications.filter(
      (n) => !n.read,
    ).length;
    const unreadChatCount = state.conversations.reduce(
      (sum, c) => sum + c.unread,
      0,
    );

    return {
      loaded,
      userName: state.userName,
      dayMates: state.dayMates,
      tickets: state.tickets,
      events: state.events,
      questions: state.questions,
      conversations: state.conversations,
      notifications: state.notifications,
      unreadNotificationCount,
      unreadChatCount,
      notificationsEnabled: state.notificationsEnabled,
      setUserName: (name) => setState((prev) => ({ ...prev, userName: name })),
      setNotificationsEnabled: (enabled) =>
        setState((prev) => ({ ...prev, notificationsEnabled: enabled })),
      addDayMate: (data) =>
        setState((prev) => ({
          ...prev,
          dayMates: [
            {
              ...data,
              id: makeId(),
              createdAt: Date.now(),
              hostName: prev.userName,
            },
            ...prev.dayMates,
          ],
        })),
      addTicket: (data) =>
        setState((prev) => ({
          ...prev,
          tickets: [
            {
              ...data,
              id: makeId(),
              createdAt: Date.now(),
              sellerName: prev.userName,
            },
            ...prev.tickets,
          ],
        })),
      addEvent: (data) =>
        setState((prev) => ({
          ...prev,
          events: [
            {
              ...data,
              id: makeId(),
              createdAt: Date.now(),
              attendees: 1,
              hostName: prev.userName,
            },
            ...prev.events,
          ],
        })),
      addQuestion: (data) =>
        setState((prev) => ({
          ...prev,
          questions: [
            {
              ...data,
              id: makeId(),
              createdAt: Date.now(),
              askerName: prev.userName,
              replyCount: 0,
            },
            ...prev.questions,
          ],
        })),
      rsvpToEvent: (id) =>
        setState((prev) => ({
          ...prev,
          events: prev.events.map((e) =>
            e.id === id && e.attendees < e.maxPeople
              ? { ...e, attendees: e.attendees + 1 }
              : e,
          ),
        })),
      buyTicket: (id) =>
        setState((prev) => ({
          ...prev,
          tickets: prev.tickets
            .map((t) => (t.id === id ? { ...t, qty: t.qty - 1 } : t))
            .filter((t) => t.qty > 0),
        })),
      markNotificationsRead: () =>
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => ({
            ...n,
            read: true,
          })),
        })),
      markConversationRead: (id) =>
        setState((prev) => ({
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === id ? { ...c, unread: 0 } : c,
          ),
        })),
      sendMessage: (conversationId, text) =>
        setState((prev) => ({
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    {
                      id: makeId(),
                      text,
                      fromMe: true,
                      createdAt: Date.now(),
                    },
                  ],
                }
              : c,
          ),
        })),
      startConversation: (name) => {
        const existing = state.conversations.find((c) => c.name === name);
        if (existing) return existing.id;
        const id = makeId();
        const colorsPool = ["#7C3AED", "#F59E0B", "#EC4899", "#3B82F6"];
        setState((prev) => ({
          ...prev,
          conversations: [
            {
              id,
              name,
              initials: name.charAt(0).toUpperCase(),
              color: colorsPool[prev.conversations.length % colorsPool.length],
              unread: 0,
              messages: [],
            },
            ...prev.conversations,
          ],
        }));
        return id;
      },
      resetDemoData: () => setState(seedState()),
    };
  }, [state, loaded]);

  return (
    <JuntoContext.Provider value={value}>{children}</JuntoContext.Provider>
  );
}

export function useJunto() {
  const ctx = useContext(JuntoContext);
  if (!ctx) throw new Error("useJunto must be used within a JuntoProvider");
  return ctx;
}
