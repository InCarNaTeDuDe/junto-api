import { Request, Response, NextFunction } from "express";
import {
  getCurrentUser,
  getUserProfile,
  loginWithGoogle,
} from "./auth.service";
import type { GoogleLoginSchema } from "./auth.schema";

export async function googleLogin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = req.body as GoogleLoginSchema;
    const response = await loginWithGoogle(
      body,
      req.ip ?? req.socket.remoteAddress ?? "0.0.0.0",
    );

    return res.status(200).json({
      success: true,
      ...response,
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const userProfile = await getUserProfile(req.user);
    return res.json({
      success: true,
      user: userProfile,
    });
  } catch (err) {
    return res.json({ success: true, user: req.user });
  }
}
