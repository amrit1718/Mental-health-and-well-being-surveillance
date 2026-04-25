const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const childRoutes = require("./routes/childRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const publicPath = path.join(__dirname, "..", "public");

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath));

app.get("/api/health", async (req, res) => {
  let dbError = null;
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {
      dbError = e.message;
    }
  }
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  res.json({ 
    message: "API is running.",
    database: dbStatus,
    readyState: mongoose.connection.readyState,
    hasUri: !!process.env.MONGO_URI,
    error: dbError
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/children", childRoutes);
app.use("/api/assessments", assessmentRoutes);

const pages = [
  { route: "/", file: "index.html" },
  { route: "/about", file: "about.html" },
  { route: "/features", file: "features.html" },
  { route: "/assessment", file: "assessment.html" },
  { route: "/dashboard", file: "dashboard.html" },
  { route: "/contact", file: "contact.html" },
  { route: "/auth", file: "auth.html" }
];

pages.forEach((page) => {
  app.get(page.route, (req, res) => {
    res.sendFile(path.join(publicPath, page.file));
  });
});

app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error.message);
  res.status(500).json({ message: "Internal server error." });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;