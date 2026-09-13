import { Router, Request, Response } from "express";
import {
  uploadImage,
  isCloudinaryConfigured,
  CloudinaryFolder,
  CLOUDINARY_FOLDERS,
} from "./cloudinary.service";

const router = Router();

/**
 * POST /api/upload
 * POST /api/cloudinary/upload
 * Accepts { image: string, folder: "users" | "activities" | "rides" | "services" | "deals" }
 */
router.post("/upload", async (req: Request, res: Response) => {
  try {
    const { image, folder = "deals", publicId, tags } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image data (base64 string or URL) is required.",
      });
    }

    const folderKey = (folder || "deals").toLowerCase() as CloudinaryFolder;
    if (!CLOUDINARY_FOLDERS[folderKey]) {
      return res.status(400).json({
        success: false,
        message: `Invalid folder. Must be one of: ${Object.keys(
          CLOUDINARY_FOLDERS,
        ).join(", ")}`,
      });
    }

    const result = await uploadImage(image, folderKey, { publicId, tags });
    return res.status(200).json({
      success: true,
      data: result,
      folder: result.folder,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error: any) {
    console.error("Cloudinary upload route error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to upload image",
    });
  }
});

// Alias for direct POST / (when mounted at /api/upload)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { image, folder = "deals", publicId, tags } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image data (base64 string or URL) is required.",
      });
    }

    const folderKey = (folder || "deals").toLowerCase() as CloudinaryFolder;
    const result = await uploadImage(image, folderKey, { publicId, tags });
    return res.status(200).json({
      success: true,
      data: result,
      folder: result.folder,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to upload image",
    });
  }
});

/**
 * GET /api/cloudinary/status
 * Returns Cloudinary integration status and folder architecture
 */
router.get("/status", (req: Request, res: Response) => {
  res.json({
    success: true,
    configured: isCloudinaryConfigured(),
    folderStructure: {
      root: "Cloudinary",
      folders: {
        users: "users/ (profile photos)",
        activities: "activities/ (activity images)",
        rides: "rides/ (vehicle images)",
        services: "services/ (provider photos)",
        deals: "deals/ (deal images)",
      },
    },
  });
});

export default router;
