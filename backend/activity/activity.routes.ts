import { Router } from "express";

import { validate } from "../middleware/validate";
import {
  create,
  exploreByArea,
  fetchActivitiesByLoc,
  postTicket,
  getJuntoNowStatsHandler,
  getActivityById,
} from "./activity.controller";
import { CreateActivitySchema } from "./activity.schema";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.get("/junto-now-stats", authenticate, getJuntoNowStatsHandler);
router.get("/:id", getActivityById);
router.post("/", authenticate, validate(CreateActivitySchema), create);
router.post("/activities-around", authenticate, fetchActivitiesByLoc);

router.post("/explore", authenticate, exploreByArea);

// sell ticket
router.post("/sell-ticket", authenticate, postTicket);

export default router;
