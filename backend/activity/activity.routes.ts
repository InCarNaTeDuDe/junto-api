import { Router } from "express";

import { validate } from "../middleware/validate";
import {
  create,
  exploreByArea,
  fetchActivitiesByLoc,
  postTicket,
  getJuntoNowStatsHandler,
  listAllActivities,
  getActivityById,
  updateActivityHandler,
  deleteActivityHandler,
} from "./activity.controller";
import { CreateActivitySchema } from "./activity.schema";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// General CRUD & listing endpoints
router.get("/", authenticate, listAllActivities);
router.get("/junto-now-stats", authenticate, getJuntoNowStatsHandler);
router.get("/:id", getActivityById);
router.patch("/:id", authenticate, updateActivityHandler);
router.put("/:id", authenticate, updateActivityHandler);
router.delete("/:id", authenticate, deleteActivityHandler);
router.post("/", authenticate, validate(CreateActivitySchema), create);
router.post("/activities-around", authenticate, fetchActivitiesByLoc);

router.post("/explore", authenticate, exploreByArea);

// sell ticket
router.post("/sell-ticket", authenticate, postTicket);

export default router;
