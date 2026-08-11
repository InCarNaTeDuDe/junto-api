import { ApiService } from "@/services/api";
import { socket } from "@/services/socket";
import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export interface PushNotificationPayload {
  id?: string;
  title: string;
  message: string;
  type?: string; // activity_join | ask_nearby | system | message
  activityId?: string;
  activityTitle?: string;
  joinerId?: string;
  joinerName?: string;
  timestamp?: string;
  data?: any;
}

export const PushNotificationService = {
  /**
   * Configure default notification behavior for foreground push notifications.
   */
  configureNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  },

  /**
   * Register device for Expo Push Notifications, request permissions, and store token on server.
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#A855F7",
      });
    }

    try {
      if (Device.isDevice || Platform.OS !== "web") {
        const existingPerm: any = await Notifications.getPermissionsAsync();
        let finalStatus = existingPerm.status || (existingPerm.granted ? "granted" : "denied");

        if (finalStatus !== "granted") {
          const reqPerm: any = await Notifications.requestPermissionsAsync();
          finalStatus = reqPerm.status || (reqPerm.granted ? "granted" : "denied");
        }

        if (finalStatus !== "granted") {
          console.warn("Push notification permission not granted.");
          return null;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
        console.log("📲 Expo Push Token:", token);

        if (token) {
          await ApiService.post("/api/notifications/register-token", { pushToken: token });
        }
      } else {
        console.log("Expo Push Notifications active (web fallback).");
      }
    } catch (err) {
      console.warn("Could not retrieve Expo push token:", err);
    }

    return token;
  },

  /**
   * Listen for incoming Expo notifications in foreground and taps on notifications.
   */
  addExpoNotificationListeners(
    onReceived?: (notification: Notifications.Notification) => void,
    onResponse?: (response: Notifications.NotificationResponse) => void,
  ) {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log("🔔 Expo Push Notification received:", notification);
      const title = notification.request.content.title || "New Push Notification";
      const body = notification.request.content.body || "";
      Alert.alert(`🔔 ${title}`, body);
      if (onReceived) onReceived(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 Expo Push Notification clicked:", response);
      const title = response.notification.request.content.title || "Notification Tapped";
      const body = response.notification.request.content.body || "";
      Alert.alert(`👆 ${title}`, body);
      if (onResponse) onResponse(response);
    });

    return () => {
      try {
        if (receivedSubscription && typeof receivedSubscription.remove === "function") {
          receivedSubscription.remove();
        } else if (typeof (Notifications as any).removeNotificationSubscription === "function") {
          (Notifications as any).removeNotificationSubscription(receivedSubscription);
        }
      } catch (e) {
        // Safe fallback
      }

      try {
        if (responseSubscription && typeof responseSubscription.remove === "function") {
          responseSubscription.remove();
        } else if (typeof (Notifications as any).removeNotificationSubscription === "function") {
          (Notifications as any).removeNotificationSubscription(responseSubscription);
        }
      } catch (e) {
        // Safe fallback
      }
    };
  },

  /**
   * Trigger a local push notification and display a debug Alert popup.
   */
  async triggerLocalPushNotification(title: string, body: string, data: any = {}): Promise<void> {
    try {
      console.log("🚀 Triggering Local Push Notification:", title, body);
      
      // Always show debug Alert for immediate confirmation
      Alert.alert(`📢 Push Notification`, `${title}\n\n${body}`);

      // Schedule Expo Push Notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // deliver immediately
      });
    } catch (err) {
      console.warn("Could not schedule local notification:", err);
    }
  },

  /**
   * Helper to join an activity and trigger a push notification to the owner/organizer.
   */
  async joinActivityAndNotifyOwner(activityId: string): Promise<any> {
    try {
      const response = await ApiService.post<any>(
        `/api/activity/${activityId}/join`,
        {
          activityId,
        },
      );

      if (response?.message) {
        if (Platform.OS !== "web") {
          Alert.alert("Activity Joined! 🎉", response.message);
        }
      }
      return response;
    } catch (err: any) {
      console.error("Failed to join activity:", err?.message || err);
      throw err;
    }
  },

  /**
   * Helper to send a custom push notification to a specific user.
   */
  async sendPushNotification(
    targetUserId: string,
    title: string,
    message: string,
    type = "activity",
    metaData: any = {},
  ): Promise<any> {
    try {
      return await ApiService.post("/api/notifications/send", {
        targetUserId,
        title,
        message,
        type,
        data: metaData,
      });
    } catch (err: any) {
      console.error("Failed to send push notification:", err?.message || err);
      throw err;
    }
  },

  /**
   * Helper to initialize real-time push notification socket listener.
   */
  initPushNotificationListener(
    onNotificationReceived?: (notification: PushNotificationPayload) => void,
  ): () => void {
    const handlePushNotification = (data: PushNotificationPayload) => {
      console.log("🔔 REALTIME PUSH NOTIFICATION RECEIVED:", data);
      Alert.alert("Push Notification", JSON.stringify(data, null, 2));
      if (onNotificationReceived) {
        onNotificationReceived(data);
      } else {
        // Default fallback banner / alert
        const alertTitle = data.title || "Notification";
        const alertMsg = data.message || "You have a new update.";
        if (Platform.OS !== "web") {
          Alert.alert(alertTitle, alertMsg);
        }
      }
    };

    socket.on("push_notification", handlePushNotification);

    return () => {
      socket.off("push_notification", handlePushNotification);
    };
  },

  /**
   * Fetch notification history for the current user.
   */
  async fetchNotifications(): Promise<PushNotificationPayload[]> {
    try {
      const res = await ApiService.get<{
        success: boolean;
        notifications: any[];
      }>("/api/notifications");
      return res.notifications || [];
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      return [];
    }
  },

  /**
   * Mark a notification as read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await ApiService.patch(`/api/notifications/${notificationId}/read`);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  },
};
