import { Router } from "express";

import { googleLogin, me, updateMe } from "./auth.controller";
import { GoogleLoginSchema, GoogleWebLoginSchema } from "./auth.schema";

import { validate } from "../middleware/validate";
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
router.post(
  "/google",
  validate(GoogleWebLoginSchema, GoogleLoginSchema),
  googleLogin,
);

router.get("/me", authenticate, me);
router.patch("/me", authenticate, updateMe);
router.put("/profile", authenticate, updateMe);

export default router;
