import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  getRidesHandler,
  getRideByIdHandler,
  createRideHandler,
  joinRideHandler,
  updateRideHandler,
  getMyRidesHandler,
  confirmPassengerHandler,
  cancelSeatRequestHandler,
  deleteRideHandler,
  startRideHandler,
  completeRideHandler,
  updateLocationHandler,
  rateRideHandler,
  reportProblemHandler,
  verifyVehicleHandler,
  verifyDriverHandler,
} from "./rides.controller";
import {
  CreateRideSchema,
  JoinRideSchema,
  UpdateRideSchema,
  UpdateLocationSchema,
  RideRatingSchema,
  ReportProblemSchema,
} from "./rides.schema";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Authenticated ride endpoints
router.post("/verify-vehicle", authenticate, verifyVehicleHandler);
router.post("/verify-driver", authenticate, verifyDriverHandler);
router.get("/", authenticate, getRidesHandler);
router.get("/my", authenticate, getMyRidesHandler);
router.get("/:id", authenticate, getRideByIdHandler);

// Create & join endpoints (handles logged-in or guest commuter)
router.post("/", authenticate, validate(CreateRideSchema), createRideHandler);
router.post(
  "/:id/join",
  authenticate,
  validate(JoinRideSchema),
  joinRideHandler,
);
router.post("/:id/cancel-seat", authenticate, cancelSeatRequestHandler);
router.delete("/:id/join", authenticate, cancelSeatRequestHandler);
router.delete("/:id", authenticate, deleteRideHandler);
router.post(
  "/:id/passengers/:passengerUserId/confirm",
  authenticate,
  confirmPassengerHandler,
);
router.patch(
  "/:id",
  authenticate,
  validate(UpdateRideSchema),
  updateRideHandler,
);
router.put("/:id", authenticate, validate(UpdateRideSchema), updateRideHandler);

// Safety, Live GPS Tracking, Ratings & Reports endpoints
router.post("/:id/start", authenticate, startRideHandler);
router.post("/:id/complete", authenticate, completeRideHandler);
router.post(
  "/:id/location",
  authenticate,
  validate(UpdateLocationSchema),
  updateLocationHandler,
);
router.post(
  "/:id/rate",
  authenticate,
  validate(RideRatingSchema),
  rateRideHandler,
);
router.post(
  "/:id/report",
  authenticate,
  validate(ReportProblemSchema),
  reportProblemHandler,
);

export default router;
