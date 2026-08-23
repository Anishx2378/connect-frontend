const prisma = require("../config/db");

/**
 * Get all channels the user has access to.
 * Returns all public channels in the workspace + private channels the user is a member of.
 */
const getAllChannels = async (userId, workspaceId) => {
  if (!workspaceId) {
    throw Object.assign(new Error("Workspace ID is required."), { statusCode: 400 });
  }

  const channels = await prisma.channel.findMany({
    where: {
      workspaceId: workspaceId,
      OR: [
        { isPrivate: false },                        // All public channels in workspace
        { members: { some: { userId } } },           // Private channels user is a member of
      ],
    },
    include: {
      members: { where: { userId }, select: { lastReadAt: true } },
      _count: { select: { members: true, messages: true } },
    },
    orderBy: { name: "asc" },
  });

  for (const channel of channels) {
    if (channel.members && channel.members.length > 0) {
      const lastReadAt = channel.members[0].lastReadAt;
      channel.unreadCount = await prisma.message.count({
        where: {
          channelId: channel.id,
          createdAt: { gt: lastReadAt },
          senderId: { not: userId }
        }
      });
    } else {
      channel.unreadCount = 0;
    }
    delete channel.members;
  }

  return channels;
};

/**
 * Get a single channel by ID, including its members.
 */
const getChannelById = async (id) => {
  const channel = await prisma.channel.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              designation: true,
              isOnline: true,
            },
          },
        },
      },
      _count: { select: { messages: true } },
    },
  });
  if (!channel) {
    throw Object.assign(new Error("Channel not found."), { statusCode: 404 });
  }
  return channel;
};

/**
 * Create a new channel. Admin only in MVP.
 */
const createChannel = async ({ name, description, isPrivate = false, isAdminOnly = false, workspaceId, creatorId }) => {
  const channel = await prisma.channel.create({
    data: { 
      name, 
      description, 
      isPrivate, 
      isAdminOnly, 
      workspaceId,
      members: creatorId ? {
        create: {
          userId: creatorId
        }
      } : undefined
    },
  });
  return channel;
};

/**
 * Delete a channel by ID.
 */
const deleteChannel = async (id) => {
  const channel = await prisma.channel.findUnique({ where: { id } });
  if (!channel) {
    throw Object.assign(new Error("Channel not found."), { statusCode: 404 });
  }
  await prisma.channel.delete({ where: { id } });
  return { id };
};

/**
 * Add a user to a channel.
 */
const addMember = async (channelId, userId) => {
  // Check if already a member
  const existing = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId, channelId } },
  });
  if (existing) {
    throw Object.assign(new Error("User is already a member of this channel."), { statusCode: 409 });
  }

  const member = await prisma.channelMember.create({
    data: { userId, channelId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true, designation: true },
      },
    },
  });
  return member;
};

/**
 * Remove a user from a channel.
 */
const removeMember = async (channelId, userId) => {
  const existing = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId, channelId } },
  });
  if (!existing) {
    throw Object.assign(new Error("User is not a member of this channel."), { statusCode: 404 });
  }

  await prisma.channelMember.delete({
    where: { userId_channelId: { userId, channelId } },
  });
  return { userId, channelId };
};

/**
 * Get paginated messages for a channel.
 */
const getChannelMessages = async (channelId, { page = 1, limit = 50 }) => {
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { channelId, parentId: null },
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
    prisma.message.count({ where: { channelId } }),
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
 * Update channel settings (name, description, isPrivate).
 */
const updateChannel = async (id, { name, description, isPrivate }) => {
  const channel = await prisma.channel.findUnique({ where: { id } });
  if (!channel) {
    throw Object.assign(new Error("Channel not found."), { statusCode: 404 });
  }

  const updated = await prisma.channel.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.toLowerCase().replace(/\s+/g, "-") }),
      ...(description !== undefined && { description }),
      ...(isPrivate !== undefined && { isPrivate }),
    },
  });
  return updated;
};

/**
 * Mark channel as read for a user.
 */
const markChannelRead = async (channelId, userId) => {
  // Only update if they are a member
  const member = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId, channelId } }
  });
  if (member) {
    await prisma.channelMember.update({
      where: { userId_channelId: { userId, channelId } },
      data: { lastReadAt: new Date() }
    });
  }
  return { success: true };
};

module.exports = {
  getAllChannels,
  getChannelById,
  createChannel,
  deleteChannel,
  addMember,
  removeMember,
  getChannelMessages,
  updateChannel,
  markChannelRead,
};
