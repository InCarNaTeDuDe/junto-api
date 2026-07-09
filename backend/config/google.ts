import { OAuth2Client } from "google-auth-library";

export const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID ?? "";

export const oauthClient = new OAuth2Client(GOOGLE_WEB_CLIENT_ID);
