import "dotenv/config";
import { ExpoConfig } from "expo/config";
const IS_DEV = process.env.APP_VARIANT === "development";

const config: ExpoConfig = {
  name: IS_DEV ? "Junto Dev" : "Junto",
  slug: "junto",
  version: "1.0.0",
  orientation: "portrait",

  icon: "./assets/icon.png",

  userInterfaceStyle: "dark",
  newArchEnabled: true,

  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#090212",
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.daymates.app",
  },

  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon-maskable-512.png",
      backgroundColor: "#090212",
    },
    package: IS_DEV ? "com.junto.dev" : "com.junto",
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
  },

  web: {
    favicon: "./assets/icon.png",
    bundler: "metro",
  },

  plugins: [
    "expo-router",
    "expo-web-browser",
    "expo-secure-store",
    "@react-native-google-signin/google-signin",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Allow Junto to access your location to discover activities near you.",
      },
    ],
  ],

  scheme: "daymates",

  extra: {
    router: {
      origin:
        "https://ais-dev-do6tm66cxhkyor7idpd6ap-692488307747.asia-east1.run.app",
      headOrigin:
        "https://ais-pre-do6tm66cxhkyor7idpd6ap-692488307747.asia-east1.run.app",
    },
  },
};

export default config;
