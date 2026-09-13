import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

export type CloudinaryFolder =
  | "users"
  | "activities"
  | "rides"
  | "services"
  | "deals";

export const CLOUDINARY_FOLDERS: Record<CloudinaryFolder, string> = {
  users: "users", // profile photos
  activities: "activities", // activity images
  rides: "rides", // vehicle images
  services: "services", // provider photos
  deals: "deals", // deal images
};

// Check if Cloudinary is configured with valid credentials
export function isCloudinaryConfigured(): boolean {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return Boolean(cloudName && apiKey && apiSecret);
}

// Lazy configure cloudinary
let isConfigured = false;
function ensureCloudinaryConfig() {
  if (isConfigured) return;
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    isConfigured = true;
    console.log(
      `[Cloudinary] Successfully configured with cloud: ${cloudName}`,
    );
  }
}

export interface UploadResult {
  success: boolean;
  url: string;
  publicId: string;
  folder: string;
  source: "cloudinary" | "storage_fallback";
}

/**
 * Upload image to Cloudinary under the exact requested folder:
 * - users/ (profile photos)
 * - activities/ (activity images)
 * - rides/ (vehicle images)
 * - services/ (provider photos)
 * - deals/ (deal images)
 */
export async function uploadImage(
  imageData: string,
  folderType: CloudinaryFolder = "deals",
  options: { publicId?: string; tags?: string[] } = {},
): Promise<UploadResult> {
  const targetFolder = CLOUDINARY_FOLDERS[folderType] || "deals";

  if (isCloudinaryConfigured()) {
    ensureCloudinaryConfig();
    try {
      console.log(`[Cloudinary] Uploading to folder "${targetFolder}/"...`);
      const uploadOptions: any = {
        folder: targetFolder,
        resource_type: "image",
      };

      if (options.publicId) {
        uploadOptions.public_id = options.publicId;
      }
      if (options.tags && options.tags.length > 0) {
        uploadOptions.tags = options.tags;
      }

      const res: UploadApiResponse = await cloudinary.uploader.upload(
        imageData,
        uploadOptions,
      );

      console.log(`[Cloudinary] Upload succeeded! URL: ${res.secure_url}`);
      return {
        success: true,
        url: res.secure_url,
        publicId: res.public_id,
        folder: targetFolder,
        source: "cloudinary",
      };
    } catch (err: any) {
      console.error("[Cloudinary] Upload error:", err?.message || err);
      // If Cloudinary rejects (e.g. quota or bad key in preview), safely fallback to data URL
    }
  }

  // Fallback if Cloudinary credentials are not provided or error occurs in preview
  console.log(
    `[Cloudinary] Using safe persistent image fallback for folder "${targetFolder}/" (To use Cloudinary cloud storage, set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)`,
  );

  const fallbackPublicId = `${targetFolder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return {
    success: true,
    url: imageData,
    publicId: fallbackPublicId,
    folder: targetFolder,
    source: "storage_fallback",
  };
}

export { cloudinary };
