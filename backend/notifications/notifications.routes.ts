import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  list,
  markRead,
  send,
  registerToken,
} from "./notifications.controller";

const router = Router();

router.get("/", authenticate, list);
router.patch("/:id/read", authenticate, markRead);
router.post("/send", authenticate, send);
router.post("/register-token", authenticate, registerToken);

export default router;
