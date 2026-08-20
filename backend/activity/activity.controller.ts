import { NextFunction, Request, Response } from "express";

import {
  addTicketForSale,
  createActivity,
  exploreByLatLong,
  popularActivitiesAround,
  getJuntoNowStats,
} from "./activity.service";
import type { CreateActivityRequest } from "./activity.schema";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const activity = await createActivity(
      req.body as CreateActivityRequest,
      req.user!,
    );

    return res.status(201).json({
      success: true,
      message: "Activity created successfully.",
      activity,
    });
  } catch (err) {
    next(err);
  }
}

export async function fetchActivitiesByLoc(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const location = {
      latitude: req.body?.latitude ?? req.query?.latitude,
      longitude: req.body?.longitude ?? req.query?.longitude,
      locationName: req.body?.locationName ?? req.query?.locationName,
      locationState: req.body?.locationState ?? req.query?.locationState,
      radiusKm: req.body?.radiusKm ?? req.query?.radiusKm,
    };
    const feed = await popularActivitiesAround(location);
    res.status(200).json({ userActivities: feed });
  } catch (error) {
    next(error);
  }
}

export async function exploreByArea(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const activePinsInLocation = await exploreByLatLong(req.body);

    res.status(200).json(activePinsInLocation || []);
  } catch (error) {}
}

export async function postTicket(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const d = await addTicketForSale(req.body, req.user!);
    console.log("-->>>", d);

    res.status(201).json(d || {});
  } catch (error) {}
}

export async function getJuntoNowStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const locationName = (req.query?.locationName as string) || "";
    const stats = await getJuntoNowStats(locationName);
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
}
