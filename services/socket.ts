import { getJwtToken } from "@/utils/secureStorage";
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.EXPO_PUBLIC_API_URL; /*||  "http://192.168.29.37:3000";*/

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

socket.on("connect", () => {
  console.log("✅ SOCKET CONNECTED:", socket.id);
});

socket.on("connect_error", (error) => {
  console.log("❌ SOCKET CONNECT ERROR:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ SOCKET DISCONNECTED:", reason);
});

export async function connectSocket(userId: string) {
  console.log("connectSocket called", userId);
  const token = await getJwtToken();

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    console.log("calling socket.connect()");
    socket.connect();
  }

  socket.emit("join_user", userId);
}
