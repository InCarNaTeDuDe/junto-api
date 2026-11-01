import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  list,
  markRead,
  markAllRead,
  send,
  registerToken,
} from "./notifications.controller";

const router = Router();

router.get("/", authenticate, list);
router.patch("/read-all", authenticate, markAllRead);
router.post("/mark-all-read", authenticate, markAllRead);
router.patch("/:id/read", authenticate, markRead);
router.post("/send", authenticate, send);
router.post("/register-token", authenticate, registerToken);

export default router;
