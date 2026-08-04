import { Server } from "socket.io";
import { Server as HttpServer } from "http";

import { socketAuth } from "./socket.auth";
import { registerSocketEvents } from "./socket.event";
import { createAndSaveMessage } from "../messages/messages.service";

export let io: Server;

export function initializeSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    socket.on("join_user", (userId) => {
      console.log("USER JOIN", userId);

      socket.join(`user:${userId}`);
    });

    socket.on("join_conversation", (activityId) => {
      console.log("JOIN ACTIVITY", activityId);

      socket.join(activityId);
    });

    socket.on("send_message", async (data) => {
      console.log("SERVER RECEIVED MESSAGE:", data);

      const savedMessage = await createAndSaveMessage(
        data.chatId,
        data.senderId,
        data.content,
        data.participantId,
      );

      // console.log("SAVED MESSAGE:", savedMessage);

      io.to(data.chatId).emit("receive_message", savedMessage);
    });

    socket.on(
      "typing",
      (data: { chatId: string; userId: string; userName?: string }) => {
        console.log("TYPING EVENT:", data);
        socket.to(data.chatId).emit("user_typing", {
          userId: data.userId,
          userName: data.userName,
          isTyping: true,
        });
      },
    );

    socket.on("stop_typing", (data: { chatId: string; userId: string }) => {
      console.log("STOP TYPING EVENT:", data);
      socket.to(data.chatId).emit("user_typing", {
        userId: data.userId,
        isTyping: false,
      });
    });
  });

  return io;
}
