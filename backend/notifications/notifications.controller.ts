import { NextFunction, Request, Response } from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  sendPushNotification,
  registerUserPushToken,
} from "./notifications.service";

export async function registerToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log("📲 REGISTER TOKEN REQUEST");
    console.log("User:", req.user);
    console.log("Push token:", req.body.pushToken);

    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: "pushToken is required",
      });
    }

    const result = await registerUserPushToken(req.user!, pushToken);

    console.log("✅ REGISTER TOKEN RESULT:", result);

    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ REGISTER TOKEN ERROR:", err);
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await getUserNotifications(req.user!);
    return res.status(200).json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
}

export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await markNotificationAsRead(req.params.id as string, req.user!);
    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function send(req: Request, res: Response, next: NextFunction) {
  try {
    const { targetUserId, title, message, type, data } = req.body;
    const notif = await sendPushNotification(
      targetUserId,
      title,
      message,
      type,
      data,
    );
    return res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    next(err);
  }
}
