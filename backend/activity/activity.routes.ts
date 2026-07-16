import { Router } from "express";

import { validate } from "../middleware/validate";
import { create } from "./activity.controller";
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
export default router;
