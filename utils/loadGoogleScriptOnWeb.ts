import { Platform } from "react-native";

let googleScriptPromise: Promise<void> | null = null;

export async function loadGoogleScript() {
  if (Platform.OS !== "web") return;

  if ((window as any).google?.accounts?.id) {
    return;
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();

      script.onerror = () =>
        reject(new Error("Failed to load Google Identity Services"));

      document.head.appendChild(script);
    });
  }

  await googleScriptPromise;
}
