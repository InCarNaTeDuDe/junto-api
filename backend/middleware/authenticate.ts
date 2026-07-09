import { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../auth/jwt.service";
import { db } from "../db"; // <-- Adjust import

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Authorization header missing.",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Invalid Authorization header.",
      });
    }

    const token = authHeader.substring(7);

    const payload = verifyAccessToken(token);

    const user = await db.users.findOne(payload.uid);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found.",
      });
    }

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token.",
    });
  }
}
