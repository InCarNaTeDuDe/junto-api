import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  listServiceProsHandler,
  getServiceProByIdHandler,
  createServiceProHandler,
  updateServiceProHandler,
  deleteServiceProHandler,
  bookServiceHandler,
  listBookingsHandler,
  updateBookingStatusHandler,
} from "./localservices.controller";
import {
  CreateServiceProSchema,
  UpdateServiceProSchema,
  BookServiceSchema,
  UpdateBookingStatusSchema,
} from "./localservices.schema";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Local services read endpoints (accessible to guests and authenticated users)
router.get("/", authenticate, listServiceProsHandler);
router.get("/bookings", authenticate, listBookingsHandler);
router.get("/:id", authenticate, getServiceProByIdHandler);

// Create pro & booking endpoints (supports both authenticated users and guests)
router.post(
  "/",
  authenticate,
  validate(CreateServiceProSchema),
  createServiceProHandler,
);
router.patch(
  "/:id",
  authenticate,
  validate(UpdateServiceProSchema),
  updateServiceProHandler,
);
router.put(
  "/:id",
  authenticate,
  validate(UpdateServiceProSchema),
  updateServiceProHandler,
);
router.delete("/:id", authenticate, deleteServiceProHandler);
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
