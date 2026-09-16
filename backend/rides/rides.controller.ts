import { Request, Response, NextFunction } from "express";
import {
  listRides,
  getRideById,
  createRide,
  joinRide,
  updateRide,
  getMyRides,
  confirmRidePassenger,
  declineRidePassenger,
  cancelSeatRequest,
  deleteRide,
  startRide,
  completeRide,
  updateRideGpsLocation,
  rateRide,
  reportRideProblem,
  startTravellingRide,
  verifyVehicleService,
  verifyDriverService,
  verifyRideOtp,
  checkVehicleAvailability,
} from "./rides.service";
import {
  CreateRideInput,
  QueryRideInput,
  JoinRideInput,
  UpdateRideInput,
  UpdateLocationInput,
  RideRatingInput,
  ReportProblemInput,
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
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err?.message || "Failed to create ride",
    });
  }
}

export async function verifyRideOtpHandler(
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
    const { passengerUserId, otpCode } = req.body || {};
    const result = await verifyRideOtp(
      req.params.id,
      req.user!,
      passengerUserId,
      otpCode,
    );
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err?.message || "Failed to verify OTP",
    });
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

export async function confirmPassengerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id, passengerUserId } = req.params;
    const result = await confirmRidePassenger(id, passengerUserId, req.user!);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function declinePassengerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id, passengerUserId } = req.params;
    const result = await declineRidePassenger(id, passengerUserId, req.user!);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function cancelSeatRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await cancelSeatRequest(req.params.id, req.user!);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteRideHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await deleteRide(req.params.id, req.user!);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function startRideHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await startRide(req.params.id, req.user!);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function startTravellingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await startTravellingRide(req.params.id, req.user!);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function completeRideHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await completeRide(req.params.id, req.user!);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await updateRideGpsLocation(
      req.params.id,
      req.user!,
      req.body as UpdateLocationInput,
    );
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function rateRideHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await rateRide(
      req.params.id,
      req.user!,
      req.body as RideRatingInput,
    );
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function reportProblemHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await reportRideProblem(
      req.params.id,
      req.user!,
      req.body as ReportProblemInput,
    );
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function verifyVehicleHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { registrationNumber, vehicleType } = req.body;
    const result = await verifyVehicleService(registrationNumber, vehicleType);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function verifyDriverHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { dlNumber, phone } = req.body;
    const result = await verifyDriverService(dlNumber, phone, req.user);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function checkVehicleAvailabilityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const registrationNumber = (req.query.registrationNumber as string) || "";
    const excludeRideId = (req.query.excludeRideId as string) || undefined;
    const result = await checkVehicleAvailability(
      registrationNumber,
      excludeRideId,
    );
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
