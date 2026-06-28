const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
require("dotenv").config();

const Connection = require("../models/Connection");

const REDIRECT_BASE = "https://social-connect-om87.onrender.com";
const FRONTEND_URL = "https://twinn.live";

const getOAuthURL = (platform) => {
  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/v23.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${REDIRECT_BASE}/auth/callback/facebook&scope=public_profile&response_type=code`;

    case "instagram":
      return `https://www.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${REDIRECT_BASE}/auth/callback/instagram&scope=instagram_business_basic&response_type=code`;

    case "youtube":
      return `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.YOUTUBE_CLIENT_ID}&redirect_uri=${REDIRECT_BASE}/auth/callback/youtube&scope=https://www.googleapis.com/auth/youtube&response_type=code`;

    case "tiktok":
      return `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${REDIRECT_BASE}/auth/callback/tiktok&scope=user.info.basic&response_type=code`;

    default:
      return null;
  }
};

router.get("/:platform", (req, res) => {
  const { platform } = req.params;
  const url = getOAuthURL(platform);

  if (!url) {
    return res.status(400).json({ error: "Unknown platform" });
  }

  res.json({ url });
});

router.get("/callback/:platform", async (req, res) => {
  const { platform } = req.params;
  const { code } = req.query;

  if (!code) {
    return res.send(`
      <script>
        window.opener.postMessage(
          { type: "OAUTH_ERROR", platform: "${platform}" },
          "${FRONTEND_URL}"
        );
        window.close();
      </script>
      <p>Error: No code received</p>
    `);
  }

  try {
    await Connection.findOneAndUpdate(
      { userId: 1, platform },
      {
        userId: 1,
        platform,
        accessToken: code,
        connectedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.send(`
      <html>
        <body>
          <p>✅ ${platform} connected! Closing...</p>

          <script>
            if (window.opener) {
              window.opener.postMessage(
                { type: "OAUTH_SUCCESS", platform: "${platform}" },
                "${FRONTEND_URL}"
              );
            }

            setTimeout(() => window.close(), 500);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(`Failed to save ${platform}:`, err.message);

    res.send(`
      <script>
        window.opener.postMessage(
          { type: "OAUTH_ERROR", platform: "${platform}" },
          "${FRONTEND_URL}"
        );
        window.close();
      </script>
      <p>Error saving connection</p>
    `);
  }
});

module.exports = router;