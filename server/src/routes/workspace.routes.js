const express = require("express");
const router = express.Router();
const workspaceController = require("../controllers/workspace.controller");
const auth = require("../middleware/auth");
const requireWorkspace = require("../middleware/requireWorkspace");
const upload = require("../middleware/upload");

// All routes require authentication
router.use(auth);

// List all workspaces the user belongs to
router.get("/", workspaceController.getWorkspaces);

// Create a new workspace
router.post("/", upload.single("logo"), workspaceController.createWorkspace);

// Routes that require an active workspace context
router.get("/current", requireWorkspace, workspaceController.getCurrentWorkspace);
router.patch("/current", requireWorkspace, upload.single("logo"), workspaceController.updateWorkspace);

module.exports = router;
