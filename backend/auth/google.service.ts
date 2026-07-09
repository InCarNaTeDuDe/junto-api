import { oauthClient, GOOGLE_WEB_CLIENT_ID } from "../config/google";

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
}

export async function verifyGoogleToken(idToken: string): Promise<GoogleUser> {
  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: GOOGLE_WEB_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Google token payload missing.");
  }

  if (!payload.sub) {
    throw new Error("Google subject missing.");
  }

  if (!payload.email) {
    throw new Error("Google email missing.");
  }

  if (!payload.email_verified) {
    throw new Error("Google email is not verified.");
  }

  if (
    payload.iss !== "accounts.google.com" &&
    payload.iss !== "https://accounts.google.com"
  ) {
    throw new Error("Invalid Google issuer.");
  }

  console.log("Google token verified:", JSON.stringify(payload, null, 2));

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name ?? "",
    picture: payload.picture ?? "",
    emailVerified: payload.email_verified,
  };
}
