import { NextFunction, Request, Response } from "express";

import { User } from "../db/entities/User.entity";
import { verifyAccessToken } from "../auth/jwt.service";
import { AppDataSource } from "../db/data-source";

declare global {
  namespace Express {
    interface Request {
      user?: User;
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

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authorization token missing.",
      });
    }

    const token = authHeader.substring(7);

    const payload = verifyAccessToken(token);

    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: {
        id: payload.uid,
      },
    });

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
