export const Env = {
  GOOGLE_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID! ||
    "310875006924-5dsprg0oqeivq38pam5glqeb9hkslf9k.apps.googleusercontent.com",
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_URL || "https://junto-api-5dao.onrender.com",
};
