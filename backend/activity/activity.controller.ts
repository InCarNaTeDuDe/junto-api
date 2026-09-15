import { NextFunction, Request, Response } from "express";
import { activityRepository } from "../repositories/Activity.repository";

import {
  addTicketForSale,
  createActivity,
  exploreByLatLong,
  popularActivitiesAround,
  getJuntoNowStats,
  deleteActivity,
} from "./activity.service";
import type { CreateActivityRequest } from "./activity.schema";
import { dealsRepository } from "../repositories";

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

export async function listAllActivities(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const activities = await activityRepository.findAll();
    return res.status(200).json({ success: true, activities });
  } catch (error) {
    next(error);
  }
}

export async function getActivityById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const { entityType = "ACTIVITY" } = req.query;

    let entity;

    if (entityType === "LOCAL_DEALS") {
      entity = await dealsRepository.findById(id);
    } else {
      entity = await activityRepository.findById(id);
    }

    if (!entity) {
      return res.status(404).json({
        success: false,
        message: `${entityType} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      entity,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateActivityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const updated = await activityRepository.updateAndGet(id, req.body);
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Activity not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      activity: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteActivityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const result = await deleteActivity(id, req.user);
    return res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
