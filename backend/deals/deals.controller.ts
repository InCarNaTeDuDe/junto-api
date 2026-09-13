import { Request, Response, NextFunction } from "express";
import {
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  contactSeller,
} from "./deals.service";
import {
  CreateDealInput,
  UpdateDealInput,
  QueryDealsInput,
  ContactSellerInput,
} from "./deals.schema";

export async function listDealsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const deals = await listDeals(req.query as unknown as QueryDealsInput);
    return res.status(200).json({
      success: true,
      data: deals,
      total: deals.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDealByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const deal = await getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal listing not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: deal,
    });
  } catch (err) {
    next(err);
  }
}

export async function createDealHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const deal = await createDeal(req.body as CreateDealInput, req.user);
    return res.status(201).json({
      success: true,
      message: "Deal listed successfully in neighborhood marketplace",
      data: deal,
    });
  } catch (err) {
    next(err);
  }
}

export async function contactSellerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await contactSeller(
      req.params.id,
      req.body as ContactSellerInput,
    );
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateDealHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const updated = await updateDeal(
      req.params.id,
      req.body as UpdateDealInput,
      req.user,
    );
    return res.status(200).json({
      success: true,
      message: "Deal listing updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDealHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const success = await deleteDeal(req.params.id, req.user);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Deal not found or already deleted",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Deal listing deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}
