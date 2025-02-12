const express = require("express");
const { userAuth } = require("../config/middleviers/auth");
const connectionRequestModel = require("../models/connectionRequest");
const User = require("../models/user");
const { set } = require("mongoose");
const user = require("../models/user");

const userRouter = express.Router();

userRouter.get("/user/request/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequest = await connectionRequestModel
      .find({
        toUserId: loggedInUser._id,
        status: "interested",
      })
      .populate("fromUserId", "firstName  lastName  about skills");
    if (connectionRequest.length === 0) {
      return res.json({ message: "no requests recieved" });
    }
    res.json({ connectionRequest });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const USER_SAFE_DATA =
      "firstName lastName age gender photourl about skills";
    const connectionRequest = await connectionRequestModel
      .find({
        status: "accepted",
        $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
      })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);
    if (connectionRequest.length === 0) {
      return res.json({ message: "No connections are present" });
    }
    const data = connectionRequest.map((req) =>
      req.fromUserId._id.toString() === loggedInUser._id.toString()
        ? req.toUserId
        : req.fromUserId
    );
    if (data.length === 0) {
      return res.json({ message: "No connections are present" });
    }
    res.json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const USER_SAFE_DATA =
      "firstName lastName age gender photourl about skills";
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connections = await connectionRequestModel
      .find({
        $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
      })
      .select("fromUserId toUserId status")
      .skip(skip)
      .limit(limit);

    let hideUsersFromFeed = new Set();
    connections.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });
    hideUsersFromFeed.add(loggedInUser._id.toString());
    console.log(hideUsersFromFeed);

    const user = await User.find({
      _id: { $nin: Array.from(hideUsersFromFeed) },
    }).select(USER_SAFE_DATA);
    res.json({ user });
  } catch (err) {
    res.json({ error: err.message });
  }
});

module.exports = userRouter;
