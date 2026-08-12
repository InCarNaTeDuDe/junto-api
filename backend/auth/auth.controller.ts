import { Request, Response, NextFunction } from "express";
import {
  getCurrentUser,
  getUserProfile,
  loginWithGoogle,
  updateProfile,
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

export async function updateMe(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const updatedUser = await updateProfile(req.user.id, req.body);
    return res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}
