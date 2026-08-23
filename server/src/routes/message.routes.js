const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const requireWorkspace = require("../middleware/requireWorkspace");

// All message routes require authentication + workspace context
router.use(auth);
router.use(requireWorkspace);

router.post("/channel", messageController.sendChannelMessage);
router.post("/dm", messageController.sendDirectMessage);
router.post("/upload", upload.single("file"), messageController.uploadAttachment);
router.get("/:id/replies", messageController.getThreadReplies);

module.exports = router;
