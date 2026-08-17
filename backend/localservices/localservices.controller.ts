import { Request, Response, NextFunction } from "express";
import {
  listServicePros,
  getServiceProById,
  createServicePro,
  bookService,
  listBookings,
  updateBookingStatus,
} from "./localservices.service";
import {
  CreateServiceProInput,
  QueryServicesInput,
  BookServiceInput,
  UpdateBookingStatusInput,
} from "./localservices.schema";

export async function listServiceProsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const pros = await listServicePros(
      req.query as unknown as QueryServicesInput,
    );
    return res.status(200).json({
      success: true,
      data: pros,
      total: pros.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function getServiceProByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const pro = await getServiceProById(req.params.id);
    if (!pro) {
      return res.status(404).json({
        success: false,
        message: "Service provider not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: pro,
    });
  } catch (err) {
    next(err);
  }
}

export async function createServiceProHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const pro = await createServicePro(
      req.body as CreateServiceProInput,
      req.user,
    );
    return res.status(201).json({
      success: true,
      message: "Service provider registered successfully",
      data: pro,
    });
  } catch (err) {
    next(err);
  }
}

export async function bookServiceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const booking = await bookService(
      req.params.id,
      req.body as BookServiceInput,
      req.user,
    );
    return res.status(201).json({
      success: true,
      message: `Booking request sent to ${booking.serviceProName}!`,
      data: booking,
    });
  } catch (err) {
    next(err);
  }
}

export async function listBookingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const clientId = req.user?.id || (req.query.clientId as string);
    const bookings = await listBookings(clientId);
    return res.status(200).json({
      success: true,
      data: bookings,
      total: bookings.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const booking = await updateBookingStatus(
      req.params.id,
      req.body as UpdateBookingStatusInput,
    );
    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: booking,
    });
  } catch (err) {
    next(err);
  }
}
