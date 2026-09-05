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

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

const CATEGORY_EMOJIS: Record<string, string> = {
  blood: "❤️",
  "blood donation": "❤️",
  wallet: "👜",
  "lost wallet": "👜",
  keys: "🔑",
  "lost keys": "🔑",
  bag: "💼",
  "lost bag": "💼",
  vehicle: "🚗",
  "vehicle help": "🚗",
  phone: "📱",
  "lost phone": "📱",
  medicine: "💊",
};

const getEmojiForCategory = (cat: string) =>
  CATEGORY_EMOJIS[cat?.toLowerCase()] || "🆘";

const mapAskNearbyResponse = (req: any) => ({
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
  organizerAvatar: req.organizer?.avatar || DEFAULT_AVATAR,
  createdAt: req.createdAt,
  tags: req.tags || [],
  participantIds: req.participantIds || [],
});

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
  const placeStr = request.locationState
    ? `${request.locationName}, ${request.locationState}`
    : request.locationName;

  const notifDetails = {
    activityId: request.id,
    title: request.title,
    user: organizer.name,
    userId: organizer.id,
    organizerId: organizer.id,
    place: placeStr,
    right: body.urgency || "Urgent",
    type: "ASK NEARBY",
    category: "ASK NEARBY",
    avatar: organizer.avatar,
  };

  const notification = await notificationRepository.createNotification({
    userId: organizer.id,
    title: notifTitle,
    message: notifMsg,
    type: "ask_nearby",
    activityId: request.id,
    data: notifDetails,
  });

  if (io) {
    io.to(`user:${organizer.id}`).emit("push_notification", {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: "ask_nearby",
      activityId: request.id,
      requestId: request.id,
      timestamp: new Date().toISOString(),
      ...notifDetails,
      data: notifDetails,
    });
  }

  sendExpoPushNotification(organizer.id, notifTitle, notifMsg, {
    ...notifDetails,
    type: "ask_nearby",
    requestId: request.id,
  }).catch((e) => console.error("Error sending push to organizer:", e));

  await broadcastExpoPushNotification(
    `🆘 New Request Nearby: ${body.category || "Help Needed"}`,
    `${organizer.name || "A neighbor"} in ${request.locationName} posted a request: "${request.title}".`,
    {
      ...notifDetails,
      type: "ask_nearby",
      requestId: request.id,
      category: "ASK NEARBY",
      urgency: body.urgency || "Urgent",
      organizerId: organizer.id,
    },
    organizer.id,
  );

  return request;
}

export async function listAskNearbyRequests(_query?: QueryAskNearbyRequest) {
  const requests = await activityRepository.findAll({
    category: ActivityCategory.ASK_NEARBY,
  });
  return requests.map(mapAskNearbyResponse);
}

export async function getAskNearbyById(id: string) {
  const req = await activityRepository.findById(id);
  return req ? mapAskNearbyResponse(req) : null;
}

export async function respondToAskNearby(
  id: string,
  helper: User,
  body: RespondAskNearbyRequest,
) {
  const request = await activityRepository.findById(id);
  if (!request) throw new Error("AskNearby request not found");

  const participants = Array.from(
    new Set([...(request.participantIds || []), helper.id]),
  );
  await activityRepository.update(id, { participantIds: participants });

  const notifTitle = `Someone is helping! 🆘`;
  const notifMsg = `${helper.name || "A neighbor nearby"} offered help on your request "${request.title}"! ${body.message ? `Note: "${body.message}"` : ""}`;

  const notification = await notificationRepository.createNotification({
    userId: request.organizerId,
    title: notifTitle,
    message: notifMsg,
    type: "ask_nearby",
  });

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
  if (!request) throw new Error("AskNearby request not found");
  if (request.organizerId !== organizer.id)
    throw new Error("Unauthorized to resolve this request");

  await activityRepository.update(id, { remainingSeats: 0 });
  return { success: true, message: "Request marked as resolved." };
}

export async function broadcastAskNearby(
  activityId: string,
  title: string,
  message: string,
  data: Record<string, any> = {},
) {
  const activity = await activityRepository.findById(activityId);
  if (!activity) throw new Error("Ask Nearby activity not found");
  if (activity.category !== ActivityCategory.ASK_NEARBY)
    throw new Error("Activity is not an Ask Nearby activity");
  if (activity.latitude == null || activity.longitude == null)
    throw new Error("Ask Nearby activity has no location");

  const users = await userRepository.findUsersByLatLong(
    Number(activity.latitude),
    Number(activity.longitude),
  );
  if (!users.length) return { recipients: 0 };

  let organizer = activity.organizer;
  if ((!organizer || !organizer.avatar) && activity.organizerId) {
    const fetched = await userRepository.findById(activity.organizerId);
    if (fetched) organizer = fetched;
  }

  const placeStr = activity.locationState
    ? `${activity.locationName}, ${activity.locationState}`
    : activity.locationName;
  const notifDetails = {
    activityId: activity.id,
    title: activity.title,
    user: organizer?.name || activity.organizer?.name || "Neighbor",
    userId: activity.organizerId || activity.organizer?.id,
    organizerId: activity.organizerId || activity.organizer?.id,
    place: placeStr,
    right: activity.tags?.[1] || "Urgent",
    type: "ASK NEARBY",
    category: "ASK NEARBY",
    avatar: organizer?.avatar || activity.organizer?.avatar || DEFAULT_AVATAR,
    ...(data || {}),
  };

  await notificationRepository.createNotifications(
    users.map((u) => ({
      userId: u.id,
      title,
      message,
      type: "ask_nearby",
      activityId: activity.id,
      data: notifDetails,
    })),
  );

  // Send push notifications in parallel chunks
  const CHUNK_SIZE = 50;
  for (let i = 0; i < users.length; i += CHUNK_SIZE) {
    const chunk = users.slice(i, i + CHUNK_SIZE);
    await Promise.allSettled(
      chunk.map((u) =>
        sendExpoPushNotification(u.id, title, message, {
          ...notifDetails,
          type: "ask_nearby",
          activityId: activity.id,
        }),
      ),
    );
  }

  return { recipients: users.length };
}
