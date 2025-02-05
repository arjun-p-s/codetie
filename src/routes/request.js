const express = require("express");
const { userAuth } = require("../config/middleviers/auth");
const connectionRequestModel = require("../models/connectionRequest");

const authRequest = express.Router();

authRequest.post(
  "/request/send/:status/:touserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.touserId;
      const status = req.params.status;

      const toUser = await connectionRequestModel.findById(toUserId);

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
module.exports = authRequest;
