const messageService = require("../services/message.service");
const uploadService = require("../services/upload.service");
const { success, error } = require("../utils/response");

/**
 * POST /api/messages/channel
 * Send a message to a channel.
 */
const sendChannelMessage = async (req, res, next) => {
  try {
    const { content = "", channelId } = req.body;

    if (!channelId) {
      return error(res, "channelId is required.", 400);
    }

    const message = await messageService.sendChannelMessage({
      content,
      senderId: req.user.id,
      channelId,
    });

    return success(res, "Message sent.", message, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/messages/dm
 * Send a direct message.
 */
const sendDirectMessage = async (req, res, next) => {
  try {
    const { content = "", conversationId } = req.body;

    if (!conversationId) {
      return error(res, "conversationId is required.", 400);
    }

    const message = await messageService.sendDirectMessage({
      content,
      senderId: req.user.id,
      conversationId,
    });

    return success(res, "Message sent.", message, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/messages/upload
 * Upload a file and attach it to a message.
 * Expects: multipart form with "file" field and "messageId" in body.
 */
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, "No file uploaded.", 400);
    }

    const { messageId } = req.body;
    if (!messageId) {
      return error(res, "messageId is required.", 400);
    }

    const attachment = await uploadService.uploadAndSaveAttachment(req.file, messageId);
    return success(res, "File uploaded.", attachment, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/messages/:id/replies
 * Fetch replies for a specific message thread.
 */
const getThreadReplies = async (req, res, next) => {
  try {
    const { id } = req.params;
    const replies = await messageService.getThreadReplies(id);
    return success(res, "Replies fetched.", replies);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendChannelMessage,
  sendDirectMessage,
  uploadAttachment,
  getThreadReplies,
};
