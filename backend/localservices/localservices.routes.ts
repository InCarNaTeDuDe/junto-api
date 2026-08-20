import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  listServiceProsHandler,
  getServiceProByIdHandler,
  createServiceProHandler,
  bookServiceHandler,
  listBookingsHandler,
  updateBookingStatusHandler,
} from "./localservices.controller";
import {
  CreateServiceProSchema,
  BookServiceSchema,
  UpdateBookingStatusSchema,
} from "./localservices.schema";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Authenticated local services read endpoints
router.get("/", authenticate, listServiceProsHandler);
router.get("/bookings", authenticate, listBookingsHandler);
router.get("/:id", authenticate, getServiceProByIdHandler);

// Create pro & booking endpoints
router.post(
  "/",
  authenticate,
  validate(CreateServiceProSchema),
  createServiceProHandler,
);
router.post(
  "/:id/book",
  authenticate,
  validate(BookServiceSchema),
  bookServiceHandler,
);
router.patch(
  "/bookings/:id",
  authenticate,
  validate(UpdateBookingStatusSchema),
  updateBookingStatusHandler,
);

export default router;
