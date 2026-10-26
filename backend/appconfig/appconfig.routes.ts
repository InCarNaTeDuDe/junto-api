import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  getAppConfigHandler,
  updateAppConfigHandler,
  resetAppConfigHandler,
} from "./appconfig.controller";

const router = Router();

// Secure all app-config routes with existing authentication middleware
router.use(authenticate);

const ADMIN_USER_ID = "ab206515-e1fe-4ce0-a3a5-1bb505feae47";

function requireConfigAdmin(req: any, res: any, next: any) {
  if (req.user?.id !== ADMIN_USER_ID) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only authorized administrators can modify app configuration.",
    });
  }
  next();
}

router.get("/", getAppConfigHandler);
router.patch("/", requireConfigAdmin, updateAppConfigHandler);
router.post("/", requireConfigAdmin, updateAppConfigHandler);
router.post("/reset", requireConfigAdmin, resetAppConfigHandler);

export default router;
