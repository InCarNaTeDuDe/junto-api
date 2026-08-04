import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { list, markRead, send } from "./notifications.controller";

const router = Router();

router.get("/", authenticate, list);
router.patch("/:id/read", authenticate, markRead);
router.post("/send", authenticate, send);

export default router;
