import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  listDealsHandler,
  getDealByIdHandler,
  createDealHandler,
  updateDealHandler,
  deleteDealHandler,
  contactSellerHandler,
} from "./deals.controller";
import {
  CreateDealSchema,
  UpdateDealSchema,
  ContactSellerSchema,
} from "./deals.schema";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Authenticated deal endpoints
router.get("/", authenticate, listDealsHandler);
router.get("/:id", authenticate, getDealByIdHandler);

// Create deal & contact seller
router.post("/", authenticate, validate(CreateDealSchema), createDealHandler);
router.patch(
  "/:id",
  authenticate,
  validate(UpdateDealSchema),
  updateDealHandler,
);
router.put("/:id", authenticate, validate(UpdateDealSchema), updateDealHandler);
router.delete("/:id", authenticate, deleteDealHandler);
router.post(
  "/:id/contact",
  authenticate,
  validate(ContactSellerSchema),
  contactSellerHandler,
);

export default router;
