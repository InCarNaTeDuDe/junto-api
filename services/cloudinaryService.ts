import { ApiService } from "./api";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export type CloudinaryFolder =
  | "users"
  | "activities"
  | "rides"
  | "services"
  | "deals"
  | "chats";

export interface UploadResponse {
  success: boolean;
  url: string;
  publicId: string;
  folder: string;
}

export async function uploadToCloudinary(
  imageSource: string,
  folder: CloudinaryFolder = "deals",
): Promise<UploadResponse> {
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

  const uploadData = res?.data || res;
  if (!uploadData?.url) {
    throw new Error("Failed to get uploaded image URL from Cloudinary");
  }

  return {
    success: true,
    url: uploadData.url,
    publicId: uploadData.publicId,
    folder: uploadData.folder || folder,
  };
}

export async function pickAndUploadImage(
  folder: CloudinaryFolder = "deals",
  options: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  } = {},
): Promise<UploadResponse | null> {
  if (Platform.OS !== "web") {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const payload = asset.base64
    ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
    : asset.uri;

  return uploadToCloudinary(payload, folder);
}
