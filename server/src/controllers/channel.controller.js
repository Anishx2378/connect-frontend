const channelService = require("../services/channel.service");
const { success, error } = require("../utils/response");

/**
 * GET /api/channels
 */
const getAllChannels = async (req, res, next) => {
  try {
    const channels = await channelService.getAllChannels(req.user.id, req.user.workspaceId);
    return success(res, "Channels retrieved.", channels);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/channels/:id
 */
const getChannelById = async (req, res, next) => {
  try {
    const channel = await channelService.getChannelById(req.params.id);
    return success(res, "Channel retrieved.", channel);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/channels — Admin only
 */
const createChannel = async (req, res, next) => {
  try {
    const { name, description, isPrivate, isAdminOnly } = req.body;

    if (!name) {
      return error(res, "Channel name is required.", 400);
    }

    const channel = await channelService.createChannel({
      name: name.toLowerCase().replace(/\s+/g, "-"),
      description,
      isPrivate: isPrivate || false,
      isAdminOnly: isAdminOnly || false,
      workspaceId: req.user.workspaceId,
      creatorId: req.user.id,
    });

    return success(res, "Channel created.", channel, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/channels/:id — Update channel settings
 */
const updateChannel = async (req, res, next) => {
  try {
    const { name, description, isPrivate } = req.body;
    const channel = await channelService.updateChannel(req.params.id, {
      name,
      description,
      isPrivate,
    });
    return success(res, "Channel updated.", channel);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/channels/:id — Admin only
 */
const deleteChannel = async (req, res, next) => {
  try {
    const result = await channelService.deleteChannel(req.params.id);
    return success(res, "Channel deleted.", result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/channels/:id/members
 */
const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return error(res, "userId is required.", 400);
    }

    const member = await channelService.addMember(req.params.id, userId);
    return success(res, "Member added to channel.", member, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/channels/:id/members/:userId
 */
const removeMember = async (req, res, next) => {
  try {
    const result = await channelService.removeMember(req.params.id, req.params.userId);
    return success(res, "Member removed from channel.", result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/channels/:id/messages
 */
const getChannelMessages = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await channelService.getChannelMessages(req.params.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });
    return success(res, "Messages retrieved.", result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/channels/:id/read
 */
const markChannelRead = async (req, res, next) => {
  try {
    const result = await channelService.markChannelRead(req.params.id, req.user.id);
    return success(res, "Channel marked as read.", result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllChannels,
  getChannelById,
  createChannel,
  updateChannel,
  deleteChannel,
  addMember,
  removeMember,
  getChannelMessages,
  markChannelRead,
};
