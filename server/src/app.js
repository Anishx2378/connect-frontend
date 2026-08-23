const express = require("express");
const cors = require("cors");

// Route imports
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const channelRoutes = require("./routes/channel.routes");
const messageRoutes = require("./routes/message.routes");
const dmRoutes = require("./routes/dm.routes");
const adminRoutes = require("./routes/admin.routes");
const teamRoutes = require("./routes/team.routes");

// Middleware imports
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ─── Global Middleware ─────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ──────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Coderaxo Connect API is running." });
});

const workspaceRoutes = require("./routes/workspace.routes");
const projectRoutes = require("./routes/project.routes");
const taskRoutes = require("./routes/task.routes");
const knowledgeRoutes = require("./routes/knowledge.routes");

// ─── API Routes ────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dms", dmRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/knowledge", knowledgeRoutes);

// ─── 404 Handler ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found.`,
    data: null,
  });
});

// ─── Global Error Handler ──────────────────────────────
app.use(errorHandler);

module.exports = app;
