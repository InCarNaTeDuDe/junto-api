import jwt from "jsonwebtoken";
import { User } from "../entities/User.entity";
// import { DbUser } from "../db"; // Adjust import

const JWT_SECRET =
  (process.env.JWT_SECRET as string) || "123456789012345678901234567890123"; // Ensure this is a 32-character string for HS256

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing.");
}

const ACCESS_TOKEN_EXPIRY = "7d";

export interface JwtPayload {
  uid: string;
  email: string;
}

export function generateAccessToken(user: User): string {
  return jwt.sign(
    {
      uid: user.id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: "daymates-api",
      audience: "daymates-app",
    },
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET, {
    issuer: "daymates-api",
    audience: "daymates-app",
  }) as JwtPayload;
}
