const express = require("express");
const router = express.Router();
const channelController = require("../controllers/channel.controller");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const requireWorkspace = require("../middleware/requireWorkspace");

// All channel routes require authentication + workspace context
router.use(auth);
router.use(requireWorkspace);

router.get("/", channelController.getAllChannels);
router.get("/:id", channelController.getChannelById);
router.get("/:id/messages", channelController.getChannelMessages);
router.post("/:id/read", channelController.markChannelRead);

// Admin-only routes
router.post("/", channelController.createChannel);
router.patch("/:id", channelController.updateChannel);
router.delete("/:id", requireRole("OWNER", "ADMIN"), channelController.deleteChannel);

// Member management
router.post("/:id/members", channelController.addMember);
router.delete("/:id/members/:userId", channelController.removeMember);

module.exports = router;
