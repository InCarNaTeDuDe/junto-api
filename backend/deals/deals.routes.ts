import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  listDealsHandler,
  getDealByIdHandler,
  createDealHandler,
  contactSellerHandler,
} from "./deals.controller";
import { CreateDealSchema, ContactSellerSchema } from "./deals.schema";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Public / optional-auth read endpoints
router.get("/", authenticate, listDealsHandler);
router.get("/:id", authenticate, getDealByIdHandler);

// Create deal & contact seller
router.post("/", authenticate, validate(CreateDealSchema), createDealHandler);
router.post(
  "/:id/contact",
  authenticate,
  validate(ContactSellerSchema),
  contactSellerHandler,
);

export default router;
