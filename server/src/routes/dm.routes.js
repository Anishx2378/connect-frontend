const express = require("express");
const router = express.Router();
const dmController = require("../controllers/dm.controller");
const auth = require("../middleware/auth");
const requireWorkspace = require("../middleware/requireWorkspace");

// All DM routes require authentication + workspace context
router.use(auth);
router.use(requireWorkspace);

router.get("/", dmController.getConversations);
router.get("/:userId", dmController.getOrCreateConversation);
router.get("/:conversationId/messages", dmController.getConversationMessages);
router.post("/:conversationId/read", dmController.markDmRead);

module.exports = router;
