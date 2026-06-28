const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./db");
const authRoutes = require("./routes/auth");
const connectionRoutes = require("./routes/connections");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://twinn.live",
  "https://www.twinn.live",
  "https://social-connect-om87.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/connections", connectionRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Twin backend is running with MongoDB! ✅" });
});

app.listen(PORT, () => {
  console.log(`✅ Twin backend running on http://localhost:${PORT}`);
});