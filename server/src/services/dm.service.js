const prisma = require("../config/db");

/**
 * Get all DM conversations for a user.
 */
const getConversations = async (userId) => {
  const conversations = await prisma.directConversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: {
        select: { id: true, name: true, avatar: true, isOnline: true, designation: true },
      },
      user2: {
        select: { id: true, name: true, avatar: true, isOnline: true, designation: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // Include latest message preview
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  for (const conv of conversations) {
    const isUser1 = conv.user1Id === userId;
    const lastReadAt = isUser1 ? conv.user1LastReadAt : conv.user2LastReadAt;

    conv.unreadCount = await prisma.message.count({
      where: {
        conversationId: conv.id,
        senderId: { not: userId },
        createdAt: { gt: lastReadAt }
      }
    });
    
    // remove unneeded fields
    delete conv.user1LastReadAt;
    delete conv.user2LastReadAt;
  }

  return conversations;
};

/**
 * Get or create a DM conversation between the current user and another user.
 * Always stores the smaller UUID as user1Id for consistent unique constraint.
 */
const getOrCreateConversation = async (currentUserId, otherUserId) => {
  if (currentUserId === otherUserId) {
    throw Object.assign(new Error("Cannot create a conversation with yourself."), { statusCode: 400 });
  }

  // Verify other user exists
  const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!otherUser) {
    throw Object.assign(new Error("User not found."), { statusCode: 404 });
  }

  // Consistent ordering for the unique constraint
  const [u1, u2] = [currentUserId, otherUserId].sort();

  // Try to find existing conversation
  let conversation = await prisma.directConversation.findUnique({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    include: {
      user1: {
        select: { id: true, name: true, avatar: true, isOnline: true, designation: true },
      },
      user2: {
        select: { id: true, name: true, avatar: true, isOnline: true, designation: true },
      },
    },
  });

  // Create if it doesn't exist
  if (!conversation) {
    conversation = await prisma.directConversation.create({
      data: { user1Id: u1, user2Id: u2 },
      include: {
        user1: {
          select: { id: true, name: true, avatar: true, isOnline: true, designation: true },
        },
        user2: {
          select: { id: true, name: true, avatar: true, isOnline: true, designation: true },
        },
      },
    });
  }

  return conversation;
};

/**
 * Get paginated messages for a DM conversation.
 */
const getConversationMessages = async (conversationId, { page = 1, limit = 50 }) => {
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId, parentId: null },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
        attachments: true,
        linkPreviews: true,
        reactions: {
          include: { user: { select: { id: true, name: true } } },
        },
        _count: { select: { replies: true } },
        pinnedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return {
    messages: messages.reverse(), // Return in chronological order
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Mark a DM conversation as read for the current user.
 */
const markDmRead = async (conversationId, userId) => {
  const conversation = await prisma.directConversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) return { success: false };

  const isUser1 = conversation.user1Id === userId;
  
  await prisma.directConversation.update({
    where: { id: conversationId },
    data: isUser1 ? { user1LastReadAt: new Date() } : { user2LastReadAt: new Date() }
  });

  return { success: true };
};

module.exports = { getConversations, getOrCreateConversation, getConversationMessages, markDmRead };
