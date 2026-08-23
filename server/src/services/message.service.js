const prisma = require("../config/db");

/**
 * Send a message to a channel.
 * Returns the saved message with sender info and attachments.
 */
const sendChannelMessage = async ({ content, senderId, channelId }) => {
  // Verify channel exists
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) {
    throw Object.assign(new Error("Channel not found."), { statusCode: 404 });
  }

  // Check if channel is admin-only (e.g. announcements)
  if (channel.isAdminOnly) {
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (sender.role !== "ADMIN") {
      throw Object.assign(new Error("Only admins can post in this channel."), { statusCode: 403 });
    }
  }

  const message = await prisma.message.create({
    data: { content, senderId, channelId },
    include: {
      sender: {
        select: { id: true, name: true, avatar: true },
      },
      attachments: true,
    },
  });

  return message;
};

/**
 * Send a direct message in a conversation.
 */
const sendDirectMessage = async ({ content, senderId, conversationId }) => {
  // Verify conversation exists
  const conversation = await prisma.directConversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) {
    throw Object.assign(new Error("Conversation not found."), { statusCode: 404 });
  }

  const message = await prisma.message.create({
    data: { content, senderId, conversationId },
    include: {
      sender: {
        select: { id: true, name: true, avatar: true },
      },
      attachments: true,
    },
  });

  return message;
};

const getThreadReplies = async (messageId) => {
  return await prisma.message.findMany({
    where: { parentId: messageId },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      attachments: true,
      linkPreviews: true,
      reactions: { include: { user: { select: { id: true, name: true } } } },
      pinnedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
};

module.exports = { sendChannelMessage, sendDirectMessage, getThreadReplies };
