import { Activity, ActivityCategory } from "../db/entities/Activity.entity";
import {
  CreateActivityRequest,
  CreateTicketForSaleRequest,
} from "./activity.schema";
import { AppDataSource } from "../db/data-source";
import { User } from "../db/entities/User.entity";
import { activityRepository } from "../db/repository/Activity.repository";

export async function createActivity(
  body: CreateActivityRequest,
  organizer: User,
) {
  const date = new Date(body.date);
  const time = new Date(body.time);

  if (!isNaN(date.getTime()) && !isNaN(time.getTime())) {
    date.setHours(
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getMilliseconds(),
    );
  }

  return activityRepository.create({
    organizerId: organizer.id,

    title: body.activity,
    description: "",
    category: ActivityCategory.DAY_MATES,

    activityEmoji: body.activityEmoji,

    locationName: body.locationName,
    locationState: body.locationState,
    latitude: body.latitude,
    longitude: body.longitude,
    isAutoDetected: body.isAutoDetected ?? false,

    datetime: date,

    cost: 0,
    maxParticipants: body.matesNeeded,
    remainingSeats: body.matesNeeded,

    participantIds: [],
    tags: [],
  });
}

export async function popularActivitiesAround() {
  const activities = await activityRepository.findAll();

  return activities
    .map((activity) => {
      switch (activity.category) {
        case ActivityCategory.MOVIES:
          return {
            id: activity.id,
            type: ActivityCategory.MOVIES,
            typeColor: "#A855F7",
            title: activity.title,
            place: `${activity.locationName}, ${activity.locationState}`,
            user: activity.organizer?.name || "Junto User",
            userAvatar: activity.organizer?.avatar,
            organizerId: activity.organizerId,
            activityEmoji: activity.activityEmoji,
            right: `${activity.remainingSeats} Ticket${activity.remainingSeats > 1 ? "s" : ""}`,
            rightSub: `₹${activity.cost} each`,
            rightSubColor: "#A855F7",
            thumbBg: "#3B1F5E",
            thumbIcon: "film",
            thumbIconColor: "#C084FC",
            datetime: activity.datetime,
          };

        case ActivityCategory.DAY_MATES:
          return {
            id: activity.id,
            type: ActivityCategory.DAY_MATES,
            typeColor: "#EA580C",
            title: activity.title,
            place: `${activity.locationName}, ${activity.locationState}`,
            user: activity.organizer?.name || "Junto User",
            userAvatar: activity.organizer?.avatar,
            organizerId: activity.organizerId,
            activityEmoji: activity.activityEmoji,
            right: `${activity.remainingSeats} Mates`,
            rightColor: "#F59E0B",
            rightSub: `${activity.maxParticipants} Needed`,
            rightSubColor: "#A855F7",
            thumbBg: "#1E3A2E",
            thumbIcon: "people",
            thumbIconColor: "#4ADE80",
            datetime: activity.datetime,
          };

        case ActivityCategory.SPORTS:
          return {
            id: activity.id,
            type: ActivityCategory.SPORTS,
            typeColor: "#22C55E",
            title: activity.title,
            place: `${activity.locationName}, ${activity.locationState}`,
            user: activity.organizer?.name || "Junto User",
            userAvatar: activity.organizer?.avatar,
            organizerId: activity.organizerId,
            activityEmoji: activity.activityEmoji,
            right: `${activity.remainingSeats} Spots`,
            rightColor: "#22C55E",
            rightSub: activity.description,
            rightSubColor: "#22C55E",
            thumbBg: "#123524",
            thumbIcon: "football",
            thumbIconColor: "#4ADE80",
            datetime: activity.datetime,
          };

        case ActivityCategory.FOOD:
          return {
            id: activity.id,
            type: ActivityCategory.FOOD,
            typeColor: "#F97316",
            title: activity.title,
            place: `${activity.locationName}, ${activity.locationState}`,
            user: activity.organizer?.name || "Junto User",
            userAvatar: activity.organizer?.avatar,
            organizerId: activity.organizerId,
            activityEmoji: activity.activityEmoji,
            right: `${activity.remainingSeats} Seats`,
            rightColor: "#F97316",
            rightSub: activity.description,
            rightSubColor: "#F97316",
            thumbBg: "#3A1F10",
            thumbIcon: "restaurant",
            thumbIconColor: "#FDBA74",
            datetime: activity.datetime,
          };

        default:
          return null;
      }
    })
    .filter(Boolean);
}
export async function exploreByLatLong(location: {
  latitude: number;
  longitude: number;
}) {
  if (!location.latitude || !location.longitude) {
    console.log("No lat long found from req", location);
  }
  try {
    const activityRepository = AppDataSource.getRepository(Activity);
    const activities = await activityRepository.find({
      where: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      select: {
        id: true,
        title: true,
        category: true,
        cost: true,
        latitude: true,
        longitude: true,
        locationName: true,
        organizer: {
          name: true,
          avatar: true,
        },
      },
      relations: {
        organizer: true,
      },
    });

    return activities.map(
      ({
        id,
        title,
        category,
        cost,
        latitude,
        longitude,
        locationName,
        organizer,
      }) => ({
        id,
        lat: Number(latitude),
        lng: Number(longitude),
        title,
        type: category.toLowerCase(),
        venue: locationName,
        price: cost > 0 ? `₹${cost}` : null,
        ownerName: organizer.name,
        ownerAvatar: organizer.avatar,
      }),
    );
  } catch (error) {
    throw error;
  }
}

export async function addTicketForSale(
  body: CreateTicketForSaleRequest,
  organizer: User,
) {
  try {
    const activityRepository = AppDataSource.getRepository(Activity);

    const activity = activityRepository.create({
      organizerId: organizer.id,

      title: body.movieName,
      description: body.note ?? "",

      category: ActivityCategory.MOVIES,

      datetime: new Date(`${body.showDate}T${body.showTime}`),
      cost: body.sellingPrice,

      maxParticipants: body.quantity,
      remainingSeats: body.quantity,

      participantIds: [],
      tags: [],

      locationName: body.locationName,
      locationState: body.locationState,
      latitude: body.latitude,
      longitude: body.longitude,
      isAutoDetected: body.isAutoDetected ?? false,
    });

    return await activityRepository.save(activity);
  } catch (error) {
    throw error;
  }
}
