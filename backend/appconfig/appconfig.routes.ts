import { Router } from "express";
import {
  getAppConfigHandler,
  updateAppConfigHandler,
  resetAppConfigHandler,
} from "./appconfig.controller";

const router = Router();

// Publicly readable so mobile/web apps and guests can check maintenance and feature availability
router.get("/", getAppConfigHandler);

// Dynamic update routes to change configs directly in DB without shipping code
router.patch("/", updateAppConfigHandler);
router.post("/", updateAppConfigHandler);
router.post("/reset", resetAppConfigHandler);

export default router;
