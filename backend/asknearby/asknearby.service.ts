import { AppDataSource } from "../db/data-source";
import { Activity, ActivityCategory } from "../db/entities/Activity.entity";
import { User } from "../db/entities/User.entity";
import { Notification } from "../db/entities/Notification.entity";
import {
  CreateAskNearbyRequest,
  QueryAskNearbyRequest,
  RespondAskNearbyRequest,
} from "./asknearby.schema";
import { io } from "../socket/socket";

export async function createAskNearby(
  body: CreateAskNearbyRequest,
  organizer: User,
) {
  const activityRepository = AppDataSource.getRepository(Activity);

  const request = activityRepository.create({
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

  return await activityRepository.save(request);
}

export async function listAskNearbyRequests(query: QueryAskNearbyRequest) {
  const activityRepository = AppDataSource.getRepository(Activity);

  const whereCondition: any = {
    category: ActivityCategory.ASK_NEARBY,
  };

  const requests = await activityRepository.find({
    where: whereCondition,
    relations: { organizer: true },
    order: { createdAt: "DESC" },
  });

  return requests.map((req) => ({
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
  const activityRepository = AppDataSource.getRepository(Activity);
  const req = await activityRepository.findOne({
    where: { id },
    relations: { organizer: true },
  });

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
  const activityRepository = AppDataSource.getRepository(Activity);
  const notificationRepository = AppDataSource.getRepository(Notification);

  const request = await activityRepository.findOne({
    where: { id },
    relations: { organizer: true },
  });

  if (!request) {
    throw new Error("AskNearby request not found");
  }

  // Add helper to participants
  const participants = new Set(request.participantIds || []);
  participants.add(helper.id);
  request.participantIds = Array.from(participants);
  await activityRepository.save(request);

  // Send push notification record to database
  const notification = notificationRepository.create({
    userId: request.organizerId,
    title: `Someone is helping! 🆘`,
    message: `${helper.name || "A neighbor nearby"} offered help on your request "${request.title}"! ${body.message ? `Note: "${body.message}"` : ""}`,
    type: "ask_nearby",
    read: false,
  });
  await notificationRepository.save(notification);

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

  return {
    success: true,
    message:
      "Offer to help submitted successfully. The organizer has been notified!",
  };
}

export async function resolveAskNearby(id: string, organizer: User) {
  const activityRepository = AppDataSource.getRepository(Activity);

  const request = await activityRepository.findOne({
    where: { id },
  });

  if (!request) {
    throw new Error("AskNearby request not found");
  }

  if (request.organizerId !== organizer.id) {
    throw new Error("Unauthorized to resolve this request");
  }

  request.remainingSeats = 0;
  await activityRepository.save(request);

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
