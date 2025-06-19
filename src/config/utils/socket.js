const Socket = require("socket.io");
const { Chat } = require("../../models/chat");
const connectionRequestModel = require("../../models/connectionRequest");

const initializeSocket = (server) => {
  const io = Socket(server, {
    cors: {
      origin: "http://localhost:5173", // Add other allowed origins if needed
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔗 A user connected");

    // 🗨️ Join chat room
    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = [userId, targetUserId].sort().join("_");
      console.log(`💬 ${firstName} joined chat room: ${roomId}`);
      socket.join(roomId);
      socket.roomId = roomId;
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

    // 🎥 VIDEO CALLING - Join video room
    socket.on("joinVideoRoom", ({ roomId }) => {
      console.log(`🎥 User ${socket.id} joining video room: ${roomId}`);
      socket.join(roomId);
      socket.videoRoomId = roomId;

      const room = io.sockets.adapter.rooms.get(roomId);
      const numClients = room ? room.size : 0;
      
      console.log(`👥 Number of clients in room ${roomId}: ${numClients}`);

      // Notify existing users that someone joined
      socket.to(roomId).emit("user-joined-video", { userId: socket.id });

      // If there's already someone in the room, tell the new user
      if (numClients > 1) {
        socket.emit("other-user-in-room", { numUsers: numClients });
      }
    });

    // 📹 WebRTC: Handle video offer
    socket.on("video-offer", (data) => {
      console.log(`📡 Relaying offer from ${socket.id} to room ${data.roomId}`);
      socket.to(data.roomId).emit("video-offer", {
        offer: data.offer,
        from: socket.id
      });
    });

    // 📹 WebRTC: Handle video answer
    socket.on("video-answer", (data) => {
      console.log(`📡 Relaying answer from ${socket.id} to room ${data.roomId}`);
      socket.to(data.roomId).emit("video-answer", {
        answer: data.answer,
        from: socket.id
      });
    });

    // 📡 WebRTC: Handle ICE candidates
    socket.on("ice-candidate", (data) => {
      console.log(`📡 Relaying ICE candidate from ${socket.id} to room ${data.roomId}`);
      socket.to(data.roomId).emit("ice-candidate", {
        candidate: data.candidate,
        from: socket.id
      });
    });

    // 🔚 Leave video room
    socket.on("leaveVideoRoom", ({ roomId }) => {
      console.log(`🚪 User ${socket.id} leaving video room: ${roomId}`);
      socket.to(roomId).emit("user-left-video", { userId: socket.id });
      socket.leave(roomId);
      socket.videoRoomId = null;
    });

    // ❌ Handle disconnect
    socket.on("disconnect", () => {
      console.log(`🔌 User ${socket.id} disconnected`);
      
      if (socket.roomId) {
        console.log("🔌 User disconnected from chat room", socket.roomId);
        socket.leave(socket.roomId);
      }
      
      if (socket.videoRoomId) {
        console.log("🔌 User disconnected from video room", socket.videoRoomId);
        socket.to(socket.videoRoomId).emit("user-left-video", { userId: socket.id });
        socket.leave(socket.videoRoomId);
      }
    });
  });
};

module.exports = initializeSocket;