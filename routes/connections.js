const express = require("express");
const router  = express.Router();
const pool    = require("../db");

router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const result = await pool.query(
      "SELECT platform, connected_at FROM connections WHERE user_id = $1",
      [userId]
    );
    res.json({ connections: result.rows });
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
    await pool.query(
      `INSERT INTO connections (user_id, platform)
       VALUES ($1, $2)
       ON CONFLICT (user_id, platform) DO UPDATE
       SET connected_at = CURRENT_TIMESTAMP`,
      [userId, platform]
    );
    if (accessToken) {
      await pool.query(
        `INSERT INTO oauth_tokens (user_id, platform, access_token)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, platform) DO UPDATE
         SET access_token = $3`,
        [userId, platform, accessToken]
      );
    }
    res.json({
      success: true,
      message: `${platform} connected successfully!`
    });
  } catch (err) {
    console.error("POST /connections error:", err.message);
    res.status(500).json({ error: "Failed to save connection" });
  }
});

router.delete("/:platform", async (req, res) => {
  try {
    const { platform } = req.params;
    const { userId }   = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    await pool.query(
      "DELETE FROM connections WHERE user_id = $1 AND platform = $2",
      [userId, platform]
    );
    await pool.query(
      "DELETE FROM oauth_tokens WHERE user_id = $1 AND platform = $2",
      [userId, platform]
    );
    res.json({
      success: true,
      message: `${platform} disconnected!`
    });
  } catch (err) {
    console.error("DELETE /connections error:", err.message);
    res.status(500).json({ error: "Failed to disconnect platform" });
  }
});

module.exports = router;