import { Router } from "express";

import { googleLogin } from "./auth.controller";
import { GoogleLoginSchema, GoogleWebLoginSchema } from "./auth.schema";

import { validate } from "../middleware/validate";

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
router.post(
  "/google",
  validate(GoogleWebLoginSchema, GoogleLoginSchema),
  googleLogin,
);

export default router;
