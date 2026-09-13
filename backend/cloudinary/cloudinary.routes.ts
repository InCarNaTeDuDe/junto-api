import { Router, Request, Response } from "express";
import {
  uploadImage,
  CloudinaryFolder,
  isCloudinaryConfigured,
} from "./cloudinary.service";

const router = Router();

const handleUpload = async (req: Request, res: Response) => {
  try {
    const { image, folder = "deals", publicId, tags } = req.body;
    if (!image) {
      return res
        .status(400)
        .json({ success: false, message: "Image data is required" });
    }

    const result = await uploadImage(image, folder as CloudinaryFolder, {
      publicId,
      tags,
    });
    return res.status(200).json({ success: true, ...result, data: result });
  } catch (error: any) {
    console.error("[Cloudinary] Upload failed:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to upload image to Cloudinary",
    });
  }
};

router.post("/upload", handleUpload);
router.post("/", handleUpload);

router.get("/status", (_req: Request, res: Response) => {
  res.json({ success: true, configured: isCloudinaryConfigured() });
});

export default router;
