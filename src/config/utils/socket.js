const Socket = require("socket.io");

const initializeSocket = (server) => {
  const io = Socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (Socket) => {});
};

module.exports = initializeSocket;
