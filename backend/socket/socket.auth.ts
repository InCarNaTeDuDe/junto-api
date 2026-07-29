import { Socket } from "socket.io";
import { verifyAccessToken } from "../auth/jwt.service";

export async function socketAuth(socket: Socket, next: any) {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const user = verifyAccessToken(token);

    socket.data.user = user;

    next();
  } catch {
    next(new Error("Unauthorized"));
  }
}
