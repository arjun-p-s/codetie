const mongoose = require("mongoose");

const User = require("./user");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    isSeen: { type: Boolean, default: false },
  },

  { timestamps: true }
);

const chatSchema = new mongoose.Schema({
  participents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  messages: [messageSchema],
});

const Chat = mongoose.model("Chat", chatSchema);
module.exports = { Chat };
