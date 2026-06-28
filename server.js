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
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
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