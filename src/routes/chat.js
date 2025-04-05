const express = require("express");
const { Chat } = require("../models/chat");
const { userAuth } = require("../config/middleviers/auth");

const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;

  try {
    let chat = await Chat.findOne({
      participents: { $all: [userId, targetUserId] },
    }).populate({
        path:"messages.senderId",
        select:"firstName lastName"
    })

    if (!chat) {
      chat = new Chat({
        participents: [userId, targetUserId],
        messages: [],
      });
      await chat.save();
    }

    res.json({ chat, messages: chat.messages });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = chatRouter;
