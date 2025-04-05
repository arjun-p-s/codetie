const Socket = require("socket.io");
const { findOne } = require("../../models/user");
const { Chat } = require("../../models/chat");
const connectionRequestModel = require("../../models/connectionRequest");

const initializeSocket = (server) => {
  const io = Socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = [userId, targetUserId].sort().join("_");
      console.log(
        `User ${firstName} joined room ${roomId} with userId: ${userId}, targetUserId: ${targetUserId}`
      );
      socket.join(roomId);
      socket.roomId = roomId;
    });

    socket.on(
      "sendMessage",
      async ({ firstName, targetUserId, userId, text }) => {
        const roomId = [userId, targetUserId].sort().join("_");
        console.log(`${firstName}: ${text}`);

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
            console.log("Unauthorized chat attempt");
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

          chat.messages.push({
            senderId: userId,
            text,
          });
          await chat.save();
        } catch (err) {
          console.log(err);
        }
        io.to(roomId).emit("messageRecived", { firstName, text });
      }
    );

    socket.on("disconnect", () => {
      if (socket.roomId) {
        console.log("User disconnected from room", socket.roomId);
        socket.leave(socket.roomId);
      }
    });
  });
};

module.exports = initializeSocket;
