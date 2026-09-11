import { Request, Response } from "express";
import { queryUniversalNeedFromDb } from "./universalneed.service";

export async function queryUniversalNeedHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const rawQuery =
      (req.query.q as string) ||
      (req.query.query as string) ||
      (req.body?.query as string) ||
      "";

    const result = await queryUniversalNeedFromDb(rawQuery);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Error querying universal need from DB:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to query database for universal need.",
    });
  }
}

export async function getUniversalNeedExamplesHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const examples = [
      {
        id: "ex-bike-mechanic",
        text: "I need a bike mechanic near me",
        category: "Auto Repair",
        entity: "LocalService",
        icon: "build-outline",
      },
      {
        id: "ex-vijayawada-ride",
        text: "I need someone to go to Vijayawada with",
        category: "Carpool",
        entity: "Ride",
        icon: "car-outline",
      },
      {
        id: "ex-movie-ticket",
        text: "I need a movie ticket for tonight",
        category: "Tickets",
        entity: "Ticket",
        icon: "ticket-outline",
      },
      {
        id: "ex-lost-wallet",
        text: "I lost my wallet in Hitec City",
        category: "Ask Nearby",
        entity: "Activity",
        icon: "alert-circle-outline",
      },
      {
        id: "ex-visit-hyd",
        text: "I'm visiting Hyderabad tomorrow",
        category: "City Tour",
        entity: "Activity",
        icon: "compass-outline",
      },
      {
        id: "ex-used-cycle",
        text: "I want to buy a used cycle",
        category: "Deals",
        entity: "LocalDeal",
        icon: "pricetag-outline",
      },
      {
        id: "ex-badminton",
        text: "Need a badminton partner for 7 PM",
        category: "Sports",
        entity: "Activity",
        icon: "fitness-outline",
      },
      {
        id: "ex-home-tiffin",
        text: "Looking for home tiffin food",
        category: "Home Food",
        entity: "LocalService",
        icon: "restaurant-outline",
      },
    ];

    res.status(200).json({
      success: true,
      data: examples,
    });
  } catch (err: any) {
    console.error("Error fetching universal need examples:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch examples.",
    });
  }
}
