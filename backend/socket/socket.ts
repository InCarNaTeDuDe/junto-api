import { Server } from "socket.io";
import { Server as HttpServer } from "http";

import { socketAuth } from "./socket.auth";
import { registerSocketEvents } from "./socket.event";
import { createAndSaveMessage } from "../messages/messages.service";
import { userRepository } from "../repositories";

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
      async (data: {
        chatId: string;
        userId: string;
        partnerId?: string;
        userName?: string;
        avatar?: string;
        userAvatar?: string;
      }) => {
        let avatar = data.avatar || data.userAvatar;
        let userName = data.userName;
        if (!avatar && data.userId) {
          try {
            const u = await userRepository.findById(data.userId);
            if (u?.avatar) avatar = u.avatar;
            if (!userName && u?.name) userName = u.name;
          } catch {
            // Ignore DB lookup error
          }
        }

        const payload = {
          chatId: data.chatId,
          userId: data.userId,
          userName,
          avatar,
          userAvatar: avatar,
          isTyping: true,
        };

        if (data.partnerId) {
          io.to(`user:${data.partnerId}`).emit("user_typing", payload);
        } else if (data.chatId) {
          socket.to(data.chatId).emit("user_typing", payload);
        }
      },
    );

    socket.on(
      "stop_typing",
      (data: { chatId: string; userId: string; partnerId?: string }) => {
        const payload = {
          chatId: data.chatId,
          userId: data.userId,
          isTyping: false,
        };

        if (data.partnerId) {
          io.to(`user:${data.partnerId}`).emit("user_typing", payload);
        } else if (data.chatId) {
          socket.to(data.chatId).emit("user_typing", payload);
        }
      },
    );
  });

  return io;
}
