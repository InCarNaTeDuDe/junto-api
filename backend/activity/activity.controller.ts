import { NextFunction, Request, Response } from "express";

import { createActivity } from "./activity.service";
import type { CreateActivityRequest } from "./activity.schema";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const activity = await createActivity(
      req.body as CreateActivityRequest,
      req.user!,
    );

    return res.status(201).json({
      success: true,
      message: "Activity created successfully.",
      activity,
    });
  } catch (err) {
    next(err);
  }
}
