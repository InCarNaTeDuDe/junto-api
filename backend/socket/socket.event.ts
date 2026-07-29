// Register all events
import { Server, Socket } from "socket.io";

export function registerSocketEvents(socket: Socket, io: Server) {
  socket.on("join-chat", (chatId: string) => {
    socket.join(chatId);
  });

  socket.on("leave-chat", (chatId: string) => {
    socket.leave(chatId);
  });

  socket.on("disconnect", () => {});
}
