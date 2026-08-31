import { activityRepository } from "../repositories/Activity.repository";
import { notificationRepository } from "../repositories/Notification.repository";
import { ActivityCategory } from "../entities/Activity.entity";
import { User } from "../entities/User.entity";
import {
  CreateAskNearbyRequest,
  QueryAskNearbyRequest,
  RespondAskNearbyRequest,
} from "./asknearby.schema";
import { io } from "../socket/socket";
import {
  sendExpoPushNotification,
  broadcastExpoPushNotification,
} from "../notifications/notifications.service";
import { userRepository } from "../repositories/User.repository";

export async function createAskNearby(
  body: CreateAskNearbyRequest,
  organizer: User,
) {
  const request = await activityRepository.create({
    organizerId: organizer.id,
    title: body.title || `${body.category}: Need Help`,
    description:
      body.description || `${body.category} request (${body.urgency})`,
    category: ActivityCategory.ASK_NEARBY,
    activityEmoji: getEmojiForCategory(body.category),
    datetime: new Date(),
    cost: 0,
    maxParticipants: 5,
    remainingSeats: 5,
    participantIds: [],
    tags: [body.category, body.urgency, "ASK_NEARBY"],
    locationName: body.locationName,
    locationState: body.locationState || "Karnataka",
    latitude: body.latitude ?? 12.9352,
    longitude: body.longitude ?? 77.6245,
    isAutoDetected: body.isAutoDetected ?? false,
  });

  const notifTitle = `Ask Nearby Broadcasted! 📢`;
  const notifMsg = `Your request "${request.title}" was posted to DayMates nearby in ${request.locationName}.`;

  // Create push notification entry
  const notification = await notificationRepository.createNotification({
    userId: organizer.id,
    title: notifTitle,
    message: notifMsg,
    type: "ask_nearby",
  });

  if (io) {
    io.to(`user:${organizer.id}`).emit("push_notification", {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: "ask_nearby",
      requestId: request.id,
      timestamp: new Date().toISOString(),
    });
  }

  // Dispatch mobile push notification to organizer
  sendExpoPushNotification(organizer.id, notifTitle, notifMsg, {
    type: "ask_nearby",
    requestId: request.id,
  }).catch((e) => console.error("Error sending push to organizer:", e));

  // Broadcast Mobile Push Notification to all nearby DayMates users!
  const broadcastTitle = `🆘 New Request Nearby: ${body.category || "Help Needed"}`;
  const broadcastMsg = `${organizer.name || "A neighbor"} in ${request.locationName} posted a request: "${request.title}".`;

  await broadcastExpoPushNotification(
    broadcastTitle,
    broadcastMsg,
    {
      type: "ask_nearby",
      requestId: request.id,
      category: body.category,
      urgency: body.urgency,
      organizerId: organizer.id,
    },
    organizer.id, // exclude organizer from broadcast
  );

  return request;
}

export async function listAskNearbyRequests(query: QueryAskNearbyRequest) {
  const requests = await activityRepository.findAll();
  const askNearbyRequests = requests.filter(
    (req) => req.category === ActivityCategory.ASK_NEARBY,
  );

  return askNearbyRequests.map((req) => ({
    id: req.id,
    title: req.title,
    description: req.description,
    category: req.tags?.[0] || "General",
    urgency: req.tags?.[1] || "Urgent",
    locationName: req.locationName,
    locationState: req.locationState,
    latitude: req.latitude,
    longitude: req.longitude,
    organizerId: req.organizerId,
    organizerName: req.organizer?.name || "Neighbor",
    organizerAvatar:
      req.organizer?.avatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    createdAt: req.createdAt,
    tags: req.tags || [],
  }));
}

export async function getAskNearbyById(id: string) {
  const req = await activityRepository.findById(id);

  if (!req) return null;

  return {
    id: req.id,
    title: req.title,
    description: req.description,
    category: req.tags?.[0] || "General",
    urgency: req.tags?.[1] || "Urgent",
    locationName: req.locationName,
    locationState: req.locationState,
    latitude: req.latitude,
    longitude: req.longitude,
    organizerId: req.organizerId,
    organizerName: req.organizer?.name || "Neighbor",
    organizerAvatar:
      req.organizer?.avatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    createdAt: req.createdAt,
    tags: req.tags || [],
    participantIds: req.participantIds || [],
  };
}

export async function respondToAskNearby(
  id: string,
  helper: User,
  body: RespondAskNearbyRequest,
) {
  const request = await activityRepository.findById(id);

  if (!request) {
    throw new Error("AskNearby request not found");
  }

  // Add helper to participants
  const participants = new Set(request.participantIds || []);
  participants.add(helper.id);
  request.participantIds = Array.from(participants);
  await activityRepository.update(id, {
    participantIds: request.participantIds,
  });

  const notifTitle = `Someone is helping! 🆘`;
  const notifMsg = `${helper.name || "A neighbor nearby"} offered help on your request "${request.title}"! ${body.message ? `Note: "${body.message}"` : ""}`;

  // Send push notification record to database
  const notification = await notificationRepository.createNotification({
    userId: request.organizerId,
    title: notifTitle,
    message: notifMsg,
    type: "ask_nearby",
  });

  // Real-time Push Notification socket event to organizer
  if (io) {
    io.to(`user:${request.organizerId}`).emit("push_notification", {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: "ask_nearby",
      requestId: request.id,
      helperId: helper.id,
      helperName: helper.name,
      timestamp: new Date().toISOString(),
    });
  }

  // Send Expo Mobile Push Notification to request organizer
  sendExpoPushNotification(request.organizerId, notifTitle, notifMsg, {
    type: "ask_nearby",
    requestId: request.id,
    helperId: helper.id,
  }).catch((e) =>
    console.error("Error sending response push to organizer:", e),
  );

  return {
    success: true,
    message:
      "Offer to help submitted successfully. The organizer has been notified!",
  };
}

export async function resolveAskNearby(id: string, organizer: User) {
  const request = await activityRepository.findById(id);

  if (!request) {
    throw new Error("AskNearby request not found");
  }

  if (request.organizerId !== organizer.id) {
    throw new Error("Unauthorized to resolve this request");
  }

  await activityRepository.update(id, { remainingSeats: 0 });

  return {
    success: true,
    message: "Request marked as resolved.",
  };
}

function getEmojiForCategory(category: string): string {
  switch (category?.toLowerCase()) {
    case "blood donation":
    case "blood":
      return "❤️";
    case "lost wallet":
    case "wallet":
      return "👜";
    case "lost keys":
    case "keys":
      return "🔑";
    case "lost bag":
    case "bag":
      return "💼";
    case "vehicle help":
    case "vehicle":
      return "🚗";
    case "lost phone":
    case "phone":
      return "📱";
    case "medicine":
      return "💊";
    default:
      return "🆘";
  }
}
export async function broadcastAskNearby(
  activityId: string,
  title: string,
  message: string,
  data: Record<string, any> = {},
) {
  const activity = await activityRepository.findById(activityId);

  if (!activity) {
    throw new Error("Ask Nearby activity not found");
  }

  if (activity.category !== ActivityCategory.ASK_NEARBY) {
    throw new Error("Activity is not an Ask Nearby activity");
  }

  if (activity.latitude == null || activity.longitude == null) {
    throw new Error("Ask Nearby activity has no location");
  }

  const users = await userRepository.findUsersByLatLong(
    Number(activity.latitude),
    Number(activity.longitude),
  );

  if (!users.length) {
    return { recipients: 0 };
  }

  const notifications = await notificationRepository.createNotifications(
    users.map((user) => ({
      userId: user.id,
      title,
      message,
      type: "ask_nearby",
    })),
  );

  await sendAskNearbyPushNotifications(
    users,
    activity.id,
    title,
    message,
    data,
  );

  return {
    recipients: users.length,
  };
}

async function sendAskNearbyPushNotifications(
  users: User[],
  activityId: string,
  title: string,
  message: string,
  data: Record<string, any> = {},
) {
  const BATCH_SIZE = 50;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map((user) =>
        sendExpoPushNotification(user.id, title, message, {
          ...data,
          type: "ask_nearby",
          activityId,
        }),
      ),
    );

    console.log(
      `📢 Ask Nearby push batch sent: ${Math.min(
        i + BATCH_SIZE,
        users.length,
      )}/${users.length}`,
    );
  }
}
