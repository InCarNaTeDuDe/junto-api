import { Activity, ActivityCategory } from "../db/entities/Activity.entity";
import {
  CreateActivityRequest,
  CreateTicketForSaleRequest,
} from "./activity.schema";
import { AppDataSource } from "../db/data-source";
import { User } from "../db/entities/User.entity";

export async function createActivity(
  body: CreateActivityRequest,
  organizer: User,
) {
  const activityRepository = AppDataSource.getRepository(Activity);

  /**
   * Combine date + time
   */
  const date = new Date(body.date);
  const time = new Date(body.time);

  date.setHours(
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds(),
  );

  const activity = activityRepository.create({
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

  return await activityRepository.save(activity);
}

export async function fetchUserActivities(organizer: User) {
  try {
    const activityRepository = AppDataSource.getRepository(Activity);
    return await activityRepository.findBy({ organizerId: organizer.id });
  } catch (error) {}
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
