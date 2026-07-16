import { Activity } from "../db/entities/Activity.entity";
import { CreateActivityRequest } from "./activity.schema";
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
    category: "DAY_MATES",

    activityEmoji: body.activityEmoji,

    location: body.location,

    datetime: date,

    cost: 0,

    maxParticipants: body.matesNeeded,
    remainingSeats: body.matesNeeded,

    participantIds: [],
    tags: [],
  });

  return await activityRepository.save(activity);
}
