const express = require("express");
const router = express.Router();

const Connection = require("../models/Connection");

router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const connections = await Connection.find({ userId: Number(userId) })
      .select("platform connectedAt -_id")
      .sort({ connectedAt: -1 });

    res.json({ connections });
  } catch (err) {
    console.error("GET /connections error:", err.message);
    res.status(500).json({ error: "Failed to get connections" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, platform, accessToken } = req.body;

    if (!userId || !platform) {
      return res.status(400).json({ error: "userId and platform are required" });
    }

    await Connection.findOneAndUpdate(
      { userId: Number(userId), platform },
      {
        userId: Number(userId),
        platform,
        accessToken,
        connectedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.json({
      success: true,
      message: `${platform} connected successfully!`,
    });
  } catch (err) {
    console.error("POST /connections error:", err.message);
    res.status(500).json({ error: "Failed to save connection" });
  }
});

router.delete("/:platform", async (req, res) => {
  try {
    const { platform } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    await Connection.deleteOne({
      userId: Number(userId),
      platform,
    });

    res.json({
      success: true,
      message: `${platform} disconnected!`,
    });
  } catch (err) {
    console.error("DELETE /connections error:", err.message);
    res.status(500).json({ error: "Failed to disconnect platform" });
  }
});

module.exports = router;