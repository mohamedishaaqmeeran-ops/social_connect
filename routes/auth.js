const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
require("dotenv").config();

const Connection = require("../models/Connection");

const REDIRECT_BASE =
  process.env.REDIRECT_BASE || "https://social-connect-om87.onrender.com";

const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://twinn.live";

const USER_ID = 1;

const successHtml = (platform) => `
<html>
  <body>
    <p>✅ ${platform} connected! Redirecting...</p>
    <script>
      if (window.opener) {
        window.opener.postMessage(
          { type: "OAUTH_SUCCESS", platform: "${platform}" },
          "${FRONTEND_URL}"
        );
        setTimeout(() => window.close(), 500);
      } else {
        window.location.href = "${FRONTEND_URL}/app/connect?connected=${platform}";
      }
    </script>
  </body>
</html>
`;

const errorHtml = (platform, message = "Connection failed") => `
<html>
  <body>
    <script>
      if (window.opener) {
        window.opener.postMessage(
          { type: "OAUTH_ERROR", platform: "${platform}" },
          "${FRONTEND_URL}"
        );
        window.close();
      } else {
        window.location.href = "${FRONTEND_URL}/app/connect?error=${platform}";
      }
    </script>
    <p>${message}</p>
  </body>
</html>
`;

const getOAuthURL = (platform) => {
  switch (platform) {
    case "facebook":
     return `https://www.facebook.com/v23.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${REDIRECT_BASE}/auth/callback/facebook&scope=public_profile&response_type=code`;

    case "instagram":
      return `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${REDIRECT_BASE}/auth/callback/instagram&scope=instagram_business_basic&response_type=code`;

    case "youtube":
      return `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.YOUTUBE_CLIENT_ID}&redirect_uri=${REDIRECT_BASE}/auth/callback/youtube&scope=https://www.googleapis.com/auth/youtube&response_type=code&access_type=offline&prompt=consent`;

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
    return res.send(errorHtml(platform, "Error: No code received"));
  }

  try {
    let accessToken = code;
    let username = null;
    let extraData = {};

    if (platform === "instagram") {
      const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.INSTAGRAM_CLIENT_ID,
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
          grant_type: "authorization_code",
          redirect_uri: `${REDIRECT_BASE}/auth/callback/instagram`,
          code,
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        console.log("Instagram token error:", tokenData);
        throw new Error(tokenData.error_message || "Instagram token exchange failed");
      }

      accessToken = tokenData.access_token;

      const profileRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,name&access_token=${accessToken}`
      );

      const profileData = await profileRes.json();

      if (!profileData.error) {
        username = profileData.username;
        extraData.instagramUserId = profileData.id;
      }
    }

    if (platform === "facebook") {
      const tokenUrl =
        `https://graph.facebook.com/v23.0/oauth/access_token` +
        `?client_id=${process.env.FACEBOOK_APP_ID}` +
        `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
        `&redirect_uri=${REDIRECT_BASE}/auth/callback/facebook` +
        `&code=${code}`;

      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        console.log("Facebook token error:", tokenData);
        throw new Error(tokenData.error?.message || "Facebook token exchange failed");
      }

      accessToken = tokenData.access_token;

      const pagesRes = await fetch(
        `https://graph.facebook.com/v23.0/me/accounts?access_token=${accessToken}`
      );

      const pagesData = await pagesRes.json();

      extraData.facebookPages = pagesData.data || [];
    }

    await Connection.findOneAndUpdate(
      { userId: USER_ID, platform },
      {
        userId: USER_ID,
        platform,
        accessToken,
        username,
        extraData,
        connectedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.send(successHtml(platform));
  } catch (err) {
    console.error(`Failed to save ${platform}:`, err.message);
    res.send(errorHtml(platform, "Error saving connection"));
  }
});

router.post("/deauthorize", (req, res) => {
  res.sendStatus(200);
});

router.post("/delete", (req, res) => {
  res.json({
    url: `${FRONTEND_URL}/delete-status`,
    confirmation_code: "twinn-delete-confirmed",
  });
});

module.exports = router;