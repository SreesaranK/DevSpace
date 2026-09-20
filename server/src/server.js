const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const activityRoutes = require("./routes/activityRoutes");
const messageRoutes = require("./routes/messageRoutes");

const dns = require("dns");

dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);

const express = require("express");
const cors = require("cors");

require("dotenv").config();

const connectDB = require("./config/database");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/messages", messageRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "DevSpace API is running 🚀",
  });
});

// Start accepting requests only after MongoDB is ready. This prevents API
// requests from hanging in Mongoose's query buffer when Atlas is unavailable.
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `DevSpace server running on http://localhost:${PORT}`
    );
  });
};

startServer();