import { Env } from "@/config/env";
import { loadGoogleScript } from "@/utils/loadGoogleScriptOnWeb";
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  offlineAccess: true,
});

export async function signOutFromGoogle() {
  try {
    if (Platform.OS !== "web") {
      await GoogleSignin.signOut().catch(() => {});
    } else {
      if (
        typeof window !== "undefined" &&
        (window as any).google?.accounts?.id
      ) {
        (window as any).google.accounts.id.disableAutoSelect();
      }
    }
  } catch (err) {
    console.warn("Error signing out of Google:", err);
  }
}

export async function signInWithGoogle() {
  console.log(
    "process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID:",
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  );
  try {
    // ============================================================
    // WEB LOGIN
    // ============================================================
    if (Platform.OS === "web") {
      await loadGoogleScript();
      const google = (window as any).google;

      try {
        google?.accounts?.id?.disableAutoSelect();
      } catch {}

      return await new Promise((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
          auto_select: false,
          cancel_on_tap_outside: true,

          callback: (credentialResponse: any) => {
            if (!credentialResponse?.credential) {
              resolve(null);
              return;
            }
            resolve(credentialResponse);
          },
        });

        google.accounts.id.prompt();
      });
    }

    // ============================================================
    // ANDROID / IOS LOGIN
    // ============================================================
    await GoogleSignin.hasPlayServices();

    // Clear previous session so Android Google Play Services always prompts
    // the account picker dialog, allowing users with multiple logged-in accounts to choose.
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignore
    }

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return null;
    }

    return response.data;
  } catch (error: any) {
    console.error(`GLogin failed for ${Platform.OS}: `, error);
    if (
      error.code === statusCodes.SIGN_IN_CANCELLED ||
      error.code === statusCodes.IN_PROGRESS
    ) {
      return null;
    }

    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Google Play Services not available");
    }

    throw error;
  }
}
