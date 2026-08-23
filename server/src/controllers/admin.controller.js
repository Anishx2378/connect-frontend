const prisma = require("../config/db");
const { success } = require("../utils/response");

/**
 * GET /api/admin/stats
 * Dashboard statistics for the admin panel (scoped to active workspace).
 */
const getStats = async (req, res, next) => {
  try {
    const workspaceId = req.user.workspaceId;

    const [totalUsers, onlineUsers, totalChannels, totalMessages] = await Promise.all([
      prisma.workspaceMember.count({ where: { workspaceId } }),
      prisma.user.count({
        where: {
          isOnline: true,
          workspaceMemberships: { some: { workspaceId } },
        },
      }),
      prisma.channel.count({ where: { workspaceId } }),
      prisma.message.count({
        where: {
          channel: { workspaceId },
        },
      }),
    ]);

    return success(res, "Stats retrieved.", {
      totalUsers,
      onlineUsers,
      totalChannels,
      totalMessages,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users
 * Full user list with online status for admin management (scoped to workspace).
 */
const getUsers = async (req, res, next) => {
  try {
    const workspaceId = req.user.workspaceId;

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isOnline: true,
            lastSeen: true,
            createdAt: true,
            _count: {
              select: { messages: true, channelMemberships: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    const users = members.map((m) => ({
      ...m.user,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return success(res, "Users retrieved.", users);
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getUsers };
