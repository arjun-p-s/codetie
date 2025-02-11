const express = require("express");
const { userAuth } = require("../config/middleviers/auth");
const connectionRequestModel = require("../models/connectionRequest");
const User = require("../models/user");

const authRequest = express.Router();

authRequest.post(
  "/request/send/:status/:touserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.touserId;
      const status = req.params.status;

      const toUser = await User.findById(toUserId);

      if (fromUserId.equals(toUserId)) {
        throw new Error("canot send request to yourself");
      }

      if (!toUser) {
        throw new Error("User is not present");
      }

      const allowedStatus = ["interested", "ignored"];

      if (!allowedStatus.includes(status)) {
        throw new Error("invalid request");
      }
      const existingConnections = await connectionRequestModel.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingConnections) {
        throw new Error("connection request is alredy there");
      }
      const connectionRequest = new connectionRequestModel({
        fromUserId,
        toUserId,
        status,
      });
      const data = await connectionRequest.save();
      res.json({ message: "Connection request sended successfully", data });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

authRequest.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const { status, requestId } = req.params;
      const loggedInUser = req.user;
      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(401).json({
          error: "Invalid status",
        });
      }
      const connectionRequest = await connectionRequestModel.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });
      if (!connectionRequest) {
        return res.status(404).json({ error: "Connection request not found" });
      }

      connectionRequest.status = status;
      const data = await connectionRequest.save();
      res.json({ message: "connection request " + status });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
module.exports = authRequest;
