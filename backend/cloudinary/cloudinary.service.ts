import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type CloudinaryFolder =
  | "users"
  | "activities"
  | "rides"
  | "services"
  | "deals"
  | "chats";

export const CLOUDINARY_FOLDERS: Record<CloudinaryFolder, string> = {
  users: "users",
  activities: "activities",
  rides: "rides",
  services: "services",
  deals: "deals",
  chats: "chats",
};

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

export interface UploadResult {
  success: boolean;
  url: string;
  publicId: string;
  folder: string;
}

export async function uploadImage(
  imageData: string,
  folderType: CloudinaryFolder = "deals",
  options: { publicId?: string; tags?: string[] } = {},
): Promise<UploadResult> {
  const targetFolder = CLOUDINARY_FOLDERS[folderType] || "deals";

  const res = await cloudinary.uploader.upload(imageData, {
    folder: targetFolder,
    resource_type: "image",
    public_id: options.publicId,
    tags: options.tags,
  });

  return {
    success: true,
    url: res.secure_url,
    publicId: res.public_id,
    folder: targetFolder,
  };
}

export { cloudinary };
