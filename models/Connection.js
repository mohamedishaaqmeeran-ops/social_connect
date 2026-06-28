const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
    },
    platform: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

connectionSchema.index({ userId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model("Connection", connectionSchema);