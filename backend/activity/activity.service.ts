import { Activity, ActivityCategory } from "../entities/Activity.entity";
import {
  CreateActivityRequest,
  CreateTicketForSaleRequest,
} from "./activity.schema";
import { AppDataSource } from "../db/data-source";
import { User } from "../entities/User.entity";
import { activityRepository } from "../repositories/Activity.repository";
import { listDeals } from "../deals/deals.service";
import { listRides } from "../rides/rides.service";
import { listServicePros } from "../localservices/localservices.service";

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

export async function popularActivitiesAround(locationFilter?: {
  latitude?: number | string;
  longitude?: number | string;
  locationName?: string;
  locationState?: string;
  radiusKm?: number | string;
}) {
  const all = await activityRepository.findAll();

  const lat = Number(locationFilter?.latitude);
  const lng = Number(locationFilter?.longitude);
  const radius = Number(locationFilter?.radiusKm) || 50;
  const name = locationFilter?.locationName?.trim().toLowerCase();
  const state = locationFilter?.locationState?.trim().toLowerCase();

  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng);

  const activities = hasGeo
    ? all.filter((a) => {
        const aLat = Number(a.latitude);
        const aLng = Number(a.longitude);

        return (
          Number.isFinite(aLat) &&
          Number.isFinite(aLng) &&
          calculateDistanceInKm(lat, lng, aLat, aLng) <= radius
        );
      })
    : name || state
      ? all.filter((a) => {
          const aName = a.locationName?.trim().toLowerCase() || "";
          const aState = a.locationState?.trim().toLowerCase() || "";

          return (
            (name && aName.includes(name)) || (state && aState.includes(state))
          );
        })
      : all;

  return activities
    .map((a) => {
      const base = {
        id: a.id,
        title: a.title,
        place: `${a.locationName || ""}${a.locationState ? `, ${a.locationState}` : ""}`,
        user: a.organizer?.name || "Junto User",
        userAvatar: a.organizer?.avatar,
        organizerId: a.organizerId,
        activityEmoji: a.activityEmoji,
        createdAt: a.createdAt || a.datetime,
        latitude: a.latitude,
        longitude: a.longitude,
      };

      switch (a.category) {
        case ActivityCategory.MOVIES:
          return {
            ...base,
            type: a.category,
            typeColor: "#A855F7",
            right: `${a.remainingSeats} Ticket${a.remainingSeats > 1 ? "s" : ""}`,
            rightSub: `₹${a.cost} each`,
            rightSubColor: "#A855F7",
            thumbBg: "#3B1F5E",
            thumbIcon: "film",
            thumbIconColor: "#C084FC",
          };

        case ActivityCategory.DAY_MATES:
          return {
            ...base,
            type: a.category,
            typeColor: "#EA580C",
            right: `${a.remainingSeats} Mates`,
            rightColor: "#F59E0B",
            rightSub: `${a.maxParticipants} Needed`,
            rightSubColor: "#A855F7",
            thumbBg: "#1E3A2E",
            thumbIcon: "people",
            thumbIconColor: "#4ADE80",
          };

        case ActivityCategory.SPORTS:
          return {
            ...base,
            type: a.category,
            typeColor: "#22C55E",
            right: `${a.remainingSeats} Spots`,
            rightColor: "#22C55E",
            rightSub: a.description,
            rightSubColor: "#22C55E",
            thumbBg: "#123524",
            thumbIcon: "football",
            thumbIconColor: "#4ADE80",
          };

        case ActivityCategory.FOOD:
          return {
            ...base,
            type: a.category,
            typeColor: "#F97316",
            right: `${a.remainingSeats} Seats`,
            rightColor: "#F97316",
            rightSub: a.description,
            rightSubColor: "#F97316",
            thumbBg: "#3A1F10",
            thumbIcon: "restaurant",
            thumbIconColor: "#FDBA74",
          };

        case ActivityCategory.ASK_NEARBY:
          return {
            ...base,
            type: a.category,
            typeColor: "#14B8A6",
            activityEmoji: a.activityEmoji || "🙋‍♂️",
            right: a.tags?.[1] || "Ask Nearby",
            rightColor: "#14B8A6",
            rightSub: (a.description || "Neighbor Request")
              .replace(/[\r\n]+/g, " ")
              .trim(),
            rightSubColor: "#14B8A6",
            thumbBg: "#1F2937",
            thumbIcon: "help-circle",
            thumbIconColor: "#14B8A6",
          };

        default:
          return null;
      }
    })
    .filter(Boolean);
}
function calculateDistanceInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function exploreByLatLong(location: {
  latitude: number;
  longitude: number;
  locationName?: string;
  locationState?: string;
}) {
  if (!location.latitude || !location.longitude) {
    console.log("No lat long found from req", location);
  }
  try {
    const activities = await activityRepository.findByLocation(
      location.latitude,
      location.longitude,
    );

    const reqLat = Number(location.latitude);
    const reqLng = Number(location.longitude);

    return activities.map(
      (
        {
          id,
          title,
          category,
          cost,
          latitude,
          longitude,
          locationName,
          organizer,
        },
        idx,
      ) => {
        const actLat = Number(latitude) || reqLat;
        const actLng = Number(longitude) || reqLng;
        const distKm = calculateDistanceInKm(reqLat, reqLng, actLat, actLng);

        const distance =
          distKm > 0.05
            ? `${distKm.toFixed(1)} km`
            : `${(0.8 + (idx % 5) * 0.6).toFixed(1)} km`;

        return {
          id,
          lat: actLat,
          lng: actLng,
          title,
          type: category ? category.toLowerCase() : "day_mates",
          venue: locationName || location.locationName || "Hyderabad",
          price: cost > 0 ? `₹${cost}` : null,
          ownerName: organizer?.name || "John doe",
          ownerAvatar:
            organizer?.avatar ||
            "https://lh3.googleusercontent.com/a/ACg8ocKyXaLYKKoeXIIUj50LU4hGN2TekXUAowhiEOSmug=s96-c",
          distance,
        };
      },
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
    return await activityRepository.create({
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
  } catch (error) {
    throw error;
  }
}

export async function getJuntoNowStats(locationName?: string) {
  try {
    const rides = await listRides({ vehicleType: "all" });
    const deals = await listDeals({ category: "All" });
    const pros = await listServicePros({ category: "all" });
    const allActs = await activityRepository.findAll();

    const helpCount = allActs.filter(
      (a) => a.category === ActivityCategory.ASK_NEARBY,
    ).length;
    const companyCount = allActs.filter(
      (a) => a.category === ActivityCategory.DAY_MATES,
    ).length;
    const newHereCount = allActs.filter(
      (a) =>
        a.category === ActivityCategory.SPORTS ||
        a.category === ActivityCategory.FOOD ||
        a.category === ActivityCategory.DAY_MATES,
    ).length;

    return {
      ridesCount: rides.length,
      dealsCount: deals.length,
      servicesCount: pros.length,
      helpCount,
      companyCount,
      newHereCount,
    };
  } catch (err) {
    return {
      ridesCount: 0,
      dealsCount: 0,
      servicesCount: 0,
      helpCount: 0,
      companyCount: 0,
      newHereCount: 0,
    };
  }
}
