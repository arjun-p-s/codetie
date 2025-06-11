const handleVideoSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("joinVideoRoom", ({ roomId }) => {
      socket.join(roomId);
    });

    socket.on("video-offer", (data) => {
      socket.to(data.roomId).emit("video-offer", data);
    });

    socket.on("video-answer", (data) => {
      socket.to(data.roomId).emit("video-answer", data);
    });

    socket.on("ice-candidate", (data) => {
      socket.to(data.roomId).emit("ice-candidate", data);
    });
  });
};

module.exports = handleVideoSocket;
