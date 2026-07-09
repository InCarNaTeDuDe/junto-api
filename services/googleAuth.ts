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

            // TODO:
            // Send credentialResponse.credential (Google ID Token)
            // to your backend.
            //
            // Example:
            //
            // const user = await axios.post("/auth/google", {
            //   idToken: credentialResponse.credential,
            // });
            //
            // resolve(user.data);

            resolve(credentialResponse);
          },
        });

        google.accounts.id.prompt();

        // Render the standard Sign In button in the container
        // const container = document.getElementById(
        //   "google-one-tap-button-container",
        // );
        // if (container) {
        //   google.accounts.id.renderButton(container, {
        //     theme: "filled_black",
        //     size: "large",
        //     text: "continue_with",
        //     shape: "pill",
        //     width: 320,
        //   });
        // }
      });
    }

    // ============================================================
    // ANDROID / IOS LOGIN
    // ============================================================

    await GoogleSignin.hasPlayServices();

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return null;
    }

    return response.data;
  } catch (error: any) {
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
