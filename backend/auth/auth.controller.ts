import { Request, Response, NextFunction } from "express";
import { getCurrentUser, loginWithGoogle } from "./auth.service";
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
  return res.json({ success: true, user: req.user });
}
