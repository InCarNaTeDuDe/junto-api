import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import {
  create,
  getById,
  list,
  respond,
  resolve,
} from "./asknearby.controller";
import {
  CreateAskNearbySchema,
  RespondAskNearbySchema,
} from "./asknearby.schema";

const router = Router();

router.post("/", authenticate, validate(CreateAskNearbySchema), create);
router.get("/", authenticate, list);
router.get("/:id", authenticate, getById);
router.post(
  "/:id/respond",
  authenticate,
  validate(RespondAskNearbySchema),
  respond,
);
router.patch("/:id/resolve", authenticate, resolve);

export default router;
