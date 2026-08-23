const dmService = require("../services/dm.service");
const { success, error } = require("../utils/response");

/**
 * GET /api/dms
 * Get all DM conversations for the current user.
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await dmService.getConversations(req.user.id);
    return success(res, "Conversations retrieved.", conversations);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dms/:userId
 * Get or create a DM conversation with another user.
 */
const getOrCreateConversation = async (req, res, next) => {
  try {
    const conversation = await dmService.getOrCreateConversation(
      req.user.id,
      req.params.userId
    );
    return success(res, "Conversation retrieved.", conversation);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dms/:conversationId/messages
 * Get paginated messages for a DM conversation.
 */
const getConversationMessages = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await dmService.getConversationMessages(
      req.params.conversationId,
      {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
      }
    );
    return success(res, "Messages retrieved.", result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/dms/:conversationId/read
 * Mark a DM conversation as read.
 */
const markDmRead = async (req, res, next) => {
  try {
    const result = await dmService.markDmRead(req.params.conversationId, req.user.id);
    return success(res, "DM marked as read.", result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getConversations, getOrCreateConversation, getConversationMessages, markDmRead };
