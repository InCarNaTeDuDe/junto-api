import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  getRidesHandler,
  getRideByIdHandler,
  createRideHandler,
  joinRideHandler,
  updateRideHandler,
  getMyRidesHandler,
} from "./rides.controller";
import {
  CreateRideSchema,
  JoinRideSchema,
  UpdateRideSchema,
} from "./rides.schema";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Authenticated ride endpoints
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
router.patch(
  "/:id",
  authenticate,
  validate(UpdateRideSchema),
  updateRideHandler,
);

export default router;
