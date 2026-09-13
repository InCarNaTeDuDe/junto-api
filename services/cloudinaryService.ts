import { ApiService } from "./api";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export type CloudinaryFolder =
  | "users"
  | "activities"
  | "rides"
  | "services"
  | "deals";

export interface UploadResponse {
  success: boolean;
  url: string;
  publicId: string;
  folder: string;
  source?: "cloudinary" | "storage_fallback";
}

/**
 * Upload an image (base64, data URI, or URL) to Cloudinary into the designated folder:
 * - users/ (profile photos)
 * - activities/ (activity images)
 * - rides/ (vehicle images)
 * - services/ (provider photos)
 * - deals/ (deal images)
 */
export async function uploadToCloudinary(
  imageSource: string,
  folder: CloudinaryFolder = "deals",
): Promise<UploadResponse> {
  try {
    const res = await ApiService.post<{
      success: boolean;
      url: string;
      publicId: string;
      folder: string;
      data?: UploadResponse;
    }>("/api/upload", {
      image: imageSource,
      folder,
    });

    if (res && res.url) {
      return {
        success: true,
        url: res.url,
        publicId: res.publicId || `${folder}/${Date.now()}`,
        folder: res.folder || folder,
      };
    } else if (res && res.data && res.data.url) {
      return res.data;
    }

    throw new Error("Invalid upload response");
  } catch (error: any) {
    console.warn(
      "[Cloudinary] Upload request failed:",
      error?.message || error,
    );
    // If backend failed, return imageSource as fallback so UI remains functional
    return {
      success: true,
      url: imageSource,
      publicId: `${folder}/${Date.now()}`,
      folder,
      source: "storage_fallback",
    };
  }
}

/**
 * Launch Image Picker (supporting web, iOS, Android) and upload image directly to Cloudinary
 */
export async function pickAndUploadImage(
  folder: CloudinaryFolder = "deals",
  options: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  } = {},
): Promise<UploadResponse | null> {
  try {
    // Request permissions on native platforms
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Camera roll / gallery permissions are needed to upload photos.");
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [4, 3],
      quality: options.quality ?? 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    let payload = asset.uri;

    // Prefer base64 data URI for direct reliable transit
    if (asset.base64) {
      const mime = asset.mimeType || "image/jpeg";
      payload = `data:${mime};base64,${asset.base64}`;
    }

    return await uploadToCloudinary(payload, folder);
  } catch (err: any) {
    console.error("[ImagePicker] Error picking/uploading image:", err);
    return null;
  }
}
