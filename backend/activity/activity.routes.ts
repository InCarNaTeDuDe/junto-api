import { Router } from "express";

import { validate } from "../middleware/validate";
import {
  create,
  exploreByArea,
  fetchActivitiesByLoc,
  postTicket,
} from "./activity.controller";
import { CreateActivitySchema } from "./activity.schema";
import { authenticate } from "../middleware/authenticate";

const router = Router();

/**
 * POST /api/auth/google
 *
 * Body:
 * {
 *   idToken: string;
 *   platform: "ANDROID" | "IOS" | "WEB";
 *   deviceInfo?: {...}
 * }
 */
router.post("/", authenticate, validate(CreateActivitySchema), create);
router.post("/activities-around", authenticate, fetchActivitiesByLoc);

router.post("/explore", authenticate, exploreByArea);

// sell ticket
router.post("/sell-ticket", authenticate, postTicket);

export default router;
