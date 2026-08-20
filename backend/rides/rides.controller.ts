import { Request, Response, NextFunction } from "express";
import {
  listRides,
  getRideById,
  createRide,
  joinRide,
  updateRide,
  getMyRides,
} from "./rides.service";
import {
  CreateRideInput,
  QueryRideInput,
  JoinRideInput,
  UpdateRideInput,
} from "./rides.schema";

export async function getRidesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rides = await listRides(req.query as unknown as QueryRideInput);
    return res.status(200).json({
      success: true,
      data: rides,
      total: rides.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRideByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const ride = await getRideById(req.params.id);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: ride,
    });
  } catch (err) {
    next(err);
  }
}

export async function createRideHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const ride = await createRide(req.body as CreateRideInput, req.user!);
    return res.status(201).json({
      success: true,
      message: "Ride offer published successfully.",
      data: ride,
    });
  } catch (err) {
    next(err);
  }
}

export async function joinRideHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await joinRide(
      req.params.id,
      req.body as JoinRideInput,
      req.user!,
    );
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateRideHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const ride = await updateRide(
      req.params.id,
      req.body as UpdateRideInput,
      req.user!,
    );
    return res.status(200).json({
      success: true,
      message: "Ride updated successfully",
      data: ride,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyRidesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id || (req.query.userId as string);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID required",
      });
    }
    const myRides = await getMyRides(userId);
    return res.status(200).json({
      success: true,
      data: myRides,
    });
  } catch (err) {
    next(err);
  }
}
