import { NextFunction, Request, Response } from "express";
import {
  createAskNearby,
  getAskNearbyById,
  listAskNearbyRequests,
  respondToAskNearby,
  resolveAskNearby,
} from "./asknearby.service";
import type {
  CreateAskNearbyRequest,
  RespondAskNearbyRequest,
} from "./asknearby.schema";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const askNearbyReq = await createAskNearby(
      req.body as CreateAskNearbyRequest,
      req.user!,
    );

    return res.status(201).json({
      success: true,
      message: "AskNearby request posted successfully.",
      data: askNearbyReq,
    });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const requests = await listAskNearbyRequests(req.query as any);

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await getAskNearbyById(req.params.id as string);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "AskNearby request not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (err) {
    next(err);
  }
}

export async function respond(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await respondToAskNearby(
      req.params.id as string,
      req.user!,
      req.body as RespondAskNearbyRequest,
    );

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function resolve(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await resolveAskNearby(req.params.id as string, req.user!);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
