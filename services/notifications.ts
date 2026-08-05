import { ApiService } from "@/services/api";
import { socket } from "@/services/socket";
import { Alert, Platform } from "react-native";

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
