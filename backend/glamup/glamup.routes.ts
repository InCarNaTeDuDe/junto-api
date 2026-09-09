import { Router, Request, Response, NextFunction } from "express";
import {
  listServicePros,
  getServiceProById,
  createServicePro,
  bookService,
  listBookings,
  updateBookingStatus,
} from "../localservices/localservices.service";
import { io } from "../socket/socket";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// List beauty & grooming specialists (Cluster: "glam")
router.get("/artists", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pros = await listServicePros({
      cluster: "glam",
      category: req.query.category as string,
      search: req.query.search as string,
      verifiedOnly: req.query.verifiedOnly as any,
    });
    return res.status(200).json({ success: true, data: pros });
  } catch (err) {
    next(err);
  }
});

// Category list for GlamUp
router.get("/categories", (_req: Request, res: Response) => {
  const categories = [
    { id: "all", name: "All Glam Services", emoji: "✨" },
    { id: "bridal", name: "Bridal Makeup", emoji: "💄" },
    { id: "facial", name: "Facial & Glow", emoji: "🌸" },
    { id: "mehendi", name: "Mehendi Art", emoji: "🌿" },
    { id: "hair", name: "Hair Styling", emoji: "✂️" },
    { id: "nails", name: "Nails & Art", emoji: "💅" },
    { id: "waxing", name: "Waxing & Detan", emoji: "🍯" },
  ];
  return res.status(200).json({ success: true, data: categories });
});

// Get individual artist
router.get("/artists/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pro = await getServiceProById(req.params.id);
    if (!pro) {
      return res.status(404).json({ success: false, message: "Artist not found" });
    }
    return res.status(200).json({ success: true, data: pro });
  } catch (err) {
    next(err);
  }
});

// Register as a GlamUp beauty expert into unified ServiceProvider table
router.post("/artists", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pro = await createServicePro(
      {
        name: req.body.name,
        category: req.body.category || "Bridal Makeup",
        cluster: "glam",
        categoryIcon: req.body.categoryIcon || "rose",
        avatarBg: req.body.avatarBg || "#EC4899",
        phone: req.body.phone,
        experience: req.body.experience || "3+ yrs exp",
        distance: req.body.distance || "1.0 km away",
        rate: req.body.rate || "From ₹299 visit",
        description: req.body.description || "Certified GlamUp beauty specialist",
        availableToday: req.body.availableToday ?? true,
        verified: req.body.verified ?? true,
      },
      req.user,
    );

    if (io) {
      io.emit("glam_artist_created", pro);
    }
    return res.status(201).json({ success: true, data: pro });
  } catch (err) {
    next(err);
  }
});

// Book doorstep beauty session
router.post("/artists/:id/book", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookService(
      req.params.id,
      {
        clientName: req.body.clientName,
        clientPhone: req.body.clientPhone,
        clientAddress: req.body.clientAddress,
        preferredTime: req.body.preferredTime || "Today",
        issueDescription: req.body.notes || req.body.issueDescription || "Doorstep beauty session",
        urgency: req.body.urgency || "today",
      },
      req.user,
    );

    if (io) {
      io.emit("glam_booking_created", booking);
    }
    return res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

// Quick Broadcast for beauty need
router.post("/broadcast", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const broadcastRecord = {
      id: `glam_bc_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    if (io) {
      io.emit("glam_broadcast_received", broadcastRecord);
    }
    return res.status(201).json({ success: true, data: broadcastRecord });
  } catch (err) {
    next(err);
  }
});

// List bookings
router.get("/bookings", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = req.user?.id || (req.query.clientId as string);
    const bookings = await listBookings(clientId);
    return res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
});

// Update booking status
router.patch("/bookings/:id/status", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await updateBookingStatus(req.params.id, {
      status: req.body.status,
      notes: req.body.notes,
    });
    return res.status(200).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

export default router;
