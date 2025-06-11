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
    socket.on("sendMessage", async ({ firstName, targetUserId, userId, text }) => {
      const roomId = [userId, targetUserId].sort().join("_");

      try {
        const allowedChat = await connectionRequestModel.findOne({
          $or: [
            { fromUserId: targetUserId, toUserId: userId, status: "accepted" },
            { fromUserId: userId, toUserId: targetUserId, status: "accepted" },
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
          chat = new Chat({ participents: [userId, targetUserId], messages: [] });
        }

        chat.messages.push({ senderId: userId, text });
        await chat.save();

        io.to(roomId).emit("messageRecived", { firstName, text });
      } catch (err) {
        console.log("💥 Chat error:", err.message);
      }
    });

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

    // 📹 Video Call: Join video room
    socket.on("joinVideoRoom", ({ roomId }) => {
      console.log("🎥 Joining video room:", roomId);
      socket.join(roomId);
    });

    // 📹 WebRTC: Send offer
    socket.on("video-offer", (data) => {
      socket.to(data.roomId).emit("video-offer", data);
    });

    // 📹 WebRTC: Send answer
    socket.on("video-answer", (data) => {
      socket.to(data.roomId).emit("video-answer", data);
    });

    // 📡 WebRTC: Send ICE candidate
    socket.on("ice-candidate", (data) => {
      socket.to(data.roomId).emit("ice-candidate", data);
    });

    // ❌ Handle disconnect
    socket.on("disconnect", () => {
      if (socket.roomId) {
        console.log("🔌 User disconnected from room", socket.roomId);
        socket.leave(socket.roomId);
      }
    });
  });
};

module.exports = initializeSocket;
