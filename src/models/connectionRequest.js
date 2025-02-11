const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["accepted", "rejected", "interested", "ignored"],
        message: `{VALUE} is incorrect status type`,
      },
    },
  },
  { timestamps: true }
);
connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

const connectionRequestModel = mongoose.model(
  "connectionRequest",
  connectionRequestSchema
);

module.exports = connectionRequestModel;
