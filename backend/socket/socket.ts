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

      const savedMessage = await createAndSaveMessage({
        entityId: data.entityId || data.chatId,
        entityType: data.entityType || "ACTIVITY",
        senderId: data.senderId,
        content: data.content,
        participantId: data.participantId,
        image: data.image,
      });
      // Deliver message strictly to both parties involved
      // in the conversation
      io.to(`user:${data.senderId}`).emit("receive_message", savedMessage);

      if (
        savedMessage.participantId &&
        savedMessage.participantId !== data.senderId
      ) {
        io.to(`user:${savedMessage.participantId}`).emit(
          "receive_message",
          savedMessage,
        );
      }
    });

    socket.on(
      "typing",
      (data: {
        chatId: string;
        userId: string;
        partnerId?: string;
        userName?: string;
      }) => {
        if (data.partnerId) {
          io.to(`user:${data.partnerId}`).emit("user_typing", {
            chatId: data.chatId,
            userId: data.userId,
            userName: data.userName,
            isTyping: true,
          });
        }
      },
    );

    socket.on(
      "stop_typing",
      (data: { chatId: string; userId: string; partnerId?: string }) => {
        if (data.partnerId) {
          io.to(`user:${data.partnerId}`).emit("user_typing", {
            chatId: data.chatId,
            userId: data.userId,
            isTyping: false,
          });
        }
      },
    );
  });

  return io;
}
