// socket.js
const Socket = require("socket.io");
const { Chat } = require("../../models/chat");
const connectionRequestModel = require("../../models/connectionRequest");

const initializeSocket = (server) => {
  const io = Socket(server, {
    cors: {
      origin: "http://localhost:5174",
      credentials: true,
    },
  });

  const userSockets = new Map(); // userId -> Set of socketIds

  io.on("connection", (socket) => {
    console.log("🔗 A user connected");

    socket.on("userOnline", ({ userId }) => {
      socket.userId = userId;

      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      console.log(`👤 User ${userId} is online with socket ${socket.id}`);
    });

    // 🗨️ Chat room logic (omitted here for brevity)
    // ...

    // 🗨️ Join chat room
    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = [userId, targetUserId].sort().join("_");
      console.log(`💬 ${firstName} joined chat room: ${roomId}`);
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = userId;

      // Add to user socket mapping
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
    });

    // 💬 Handle message send
    socket.on(
      "sendMessage",
      async ({ firstName, targetUserId, userId, text }) => {
        const roomId = [userId, targetUserId].sort().join("_");

        try {
          const allowedChat = await connectionRequestModel.findOne({
            $or: [
              {
                fromUserId: targetUserId,
                toUserId: userId,
                status: "accepted",
              },
              {
                fromUserId: userId,
                toUserId: targetUserId,
                status: "accepted",
              },
            ],
          });

          if (!allowedChat) {
            console.log("❌ Unauthorized chat attempt");
            return;
          }

          let chat = await Chat.findOne({
            participents: { $all: [userId, targetUserId] },
          });

          if (!chat) {
            chat = new Chat({
              participents: [userId, targetUserId],
              messages: [],
            });
          }

          chat.messages.push({ senderId: userId, text });
          await chat.save();

          io.to(roomId).emit("messageRecived", { firstName, text });
        } catch (err) {
          console.log("💥 Chat error:", err.message);
        }
      }
    );

    // ✅ Mark messages as seen
    socket.on("markAsSeen", async ({ userId, targetUserId }) => {
      const chat = await Chat.findOne({
        participents: { $all: [userId, targetUserId] },
      });

      if (chat) {
        let updated = false;
        chat.messages.forEach((msg) => {
          if (msg.senderId.toString() === targetUserId && !msg.isSeen) {
            msg.isSeen = true;
            updated = true;
          }
        });

        if (updated) {
          await chat.save();
          const roomId = [userId, targetUserId].sort().join("_");
          io.to(roomId).emit("messagesSeen", { by: userId });
        }
      }
    });

    // 📞 Send call notification (WhatsApp style)
    socket.on(
      "sendCallNotification",
      async ({ targetUserId, callerName, callType, callerId }) => {
        console.log(
          `📞 Sending ${callType} call notification from ${callerId} to user ${targetUserId}`
        );

        try {
          const allowedCall = await connectionRequestModel.findOne({
            $or: [
              {
                fromUserId: targetUserId,
                toUserId: callerId,
                status: "accepted",
              },
              {
                fromUserId: callerId,
                toUserId: targetUserId,
                status: "accepted",
              },
            ],
          });

          if (!allowedCall) {
            socket.emit("callNotificationFailed", {
              targetUserId,
              reason: "Not connected to this user",
            });
            return;
          }
        } catch (error) {
          socket.emit("callNotificationFailed", {
            targetUserId,
            reason: "Error checking connection",
          });
          return;
        }

        const roomId = [callerId, targetUserId].sort().join("_");
        const targetSocketIds = userSockets.get(targetUserId);

        if (targetSocketIds && targetSocketIds.size > 0) {
          targetSocketIds.forEach((socketId) => {
            const targetSocket = io.sockets.sockets.get(socketId);
            if (targetSocket) {
              targetSocket.emit("incomingCall", {
                callerName,
                callType,
                roomId,
                callerId,
              });
            }
          });

          socket.emit("callNotificationSent", { targetUserId, roomId });
        } else {
          socket.emit("callNotificationFailed", {
            targetUserId,
            reason: "User is offline",
          });
        }
      }
    );

    // 📞 Response to call
    socket.on("respondToCall", ({ callerId, response, roomId }) => {
      const callerSocketIds = userSockets.get(callerId);

      if (callerSocketIds && callerSocketIds.size > 0) {
        callerSocketIds.forEach((socketId) => {
          const callerSocket = io.sockets.sockets.get(socketId);
          if (callerSocket) {
            callerSocket.emit("callResponse", {
              response,
              roomId,
              responderId: socket.userId,
            });
          }
        });
      }
    });

    // 🎥 Join WebRTC Room
    socket.on("joinVideoRoom", ({ roomId, userId }) => {
      console.log(`🎥 ${socket.id} (${userId}) joining room: ${roomId}`);
      socket.join(roomId);
      socket.videoRoomId = roomId;
      socket.userId = userId;

      const room = io.sockets.adapter.rooms.get(roomId);
      const numClients = room ? room.size : 0;

      socket.to(roomId).emit("user-joined-video", {
        userId: socket.id,
        realUserId: userId,
      });

      if (numClients > 1) {
        socket.emit("other-user-in-room", { numUsers: numClients });
      }
    });

    // WebRTC: Offer
    socket.on("video-offer", (data) => {
      socket.to(data.roomId).emit("video-offer", {
        offer: data.offer,
        from: socket.id,
      });
    });

    // WebRTC: Answer
    socket.on("video-answer", (data) => {
      socket.to(data.roomId).emit("video-answer", {
        answer: data.answer,
        from: socket.id,
      });
    });

    // WebRTC: ICE Candidate
    socket.on("ice-candidate", (data) => {
      socket.to(data.roomId).emit("ice-candidate", {
        candidate: data.candidate,
        from: socket.id,
      });
    });

    // End call for all
    socket.on("endCallForAll", ({ roomId }) => {
      io.to(roomId).emit("callEndedByUser", {
        endedBy: socket.userId || socket.id,
        roomId,
      });

      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        room.forEach((socketId) => {
          const userSocket = io.sockets.sockets.get(socketId);
          if (userSocket) {
            userSocket.leave(roomId);
            userSocket.videoRoomId = null;
          }
        });
      }
    });

    // User leaves manually
    socket.on("leaveVideoRoom", ({ roomId }) => {
      socket.to(roomId).emit("user-left-video", {
        userId: socket.id,
        realUserId: socket.userId,
      });
      socket.leave(roomId);
      socket.videoRoomId = null;
    });

    // Disconnection logic
    socket.on("disconnect", () => {
      if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId);
        }
      }

      if (socket.videoRoomId) {
        socket.to(socket.videoRoomId).emit("user-left-video", {
          userId: socket.id,
          realUserId: socket.userId,
        });

        io.to(socket.videoRoomId).emit("callEndedByUser", {
          endedBy: socket.userId || socket.id,
          roomId: socket.videoRoomId,
        });

        socket.leave(socket.videoRoomId);
      }
    });
  });
};

module.exports = initializeSocket;
