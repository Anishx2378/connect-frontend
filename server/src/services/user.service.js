const prisma = require("../config/db");
const jwt = require("jsonwebtoken");
const { sendInviteEmail } = require("../utils/mailer");

// Fields to return for user queries (never include password)
const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  name: true,
  email: true,
  avatar: true,
  designation: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
};

/**
 * Get all users in the active workspace.
 */
const getAllUsers = async (workspaceId, search) => {
  // Get all user IDs that are members of this workspace
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true, role: true },
  });

  const memberIds = members.map((m) => m.userId);
  const roleMap = {};
  members.forEach((m) => { roleMap[m.userId] = m.role; });

  const users = await prisma.user.findMany({
    where: {
      id: { in: memberIds },
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    select: USER_SELECT,
    orderBy: { name: "asc" },
  });

  // Attach workspace role to each user
  return users.map((u) => ({ ...u, role: roleMap[u.id] }));
};

/**
 * Get dashboard stats for the current user in the active workspace.
 */
const getDashboardStats = async (userId, workspaceId) => {
  const [channelsCount, usersCount, dmsCount, recentActivity] = await Promise.all([
    prisma.channel.count({ where: { workspaceId, members: { some: { userId } } } }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.directConversation.count({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    }),
    prisma.message.findMany({
      where: {
        channelId: { not: null },
        channel: { workspaceId, members: { some: { userId } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        channel: { select: { name: true } },
      },
    }),
  ]);

  return { channelsCount, usersCount, dmsCount, recentActivity };
};

/**
 * Get a single user by ID.
 */
const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });
  if (!user) {
    throw Object.assign(new Error("User not found."), { statusCode: 404 });
  }
  return user;
};

/**
 * Delete a user by ID (removes from workspace, not the user account).
 * In a multi-tenant system, this removes the WorkspaceMember record.
 */
const removeUserFromWorkspace = async (userId, workspaceId) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) {
    throw Object.assign(new Error("User is not a member of this workspace."), { statusCode: 404 });
  }
  await prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  return { id: userId };
};

/**
 * Update a user's role within the active workspace.
 */
const updateUserRole = async (userId, workspaceId, role) => {
  const validRoles = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "GUEST"];
  if (!validRoles.includes(role)) {
    throw Object.assign(new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`), { statusCode: 400 });
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) {
    throw Object.assign(new Error("User is not a member of this workspace."), { statusCode: 404 });
  }

  const updated = await prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId, workspaceId } },
    data: { role },
    include: {
      user: { select: USER_SELECT },
    },
  });

  return { ...updated.user, role: updated.role };
};

/**
 * Invite a user to the active workspace via email.
 * Handles both new and existing users.
 */
const inviteUser = async ({ firstName, lastName, fullName, email, role, workspaceId, invitedById }) => {
  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: existingUser.id, workspaceId } },
    });
    if (existingMembership) {
      throw Object.assign(new Error("This user is already a member of this workspace."), { statusCode: 409 });
    }
  }

  // Check for existing pending invite
  const existingInvite = await prisma.workspaceInvite.findFirst({
    where: { email, workspaceId, status: "PENDING" },
  });
  if (existingInvite) {
    throw Object.assign(new Error("An invitation has already been sent to this email."), { statusCode: 409 });
  }

  // Get workspace name for the email
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  // Generate invite token
  const token = jwt.sign(
    { email, workspaceId, role: role || "MEMBER" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Create invite record
  await prisma.workspaceInvite.create({
    data: {
      email,
      workspaceId,
      role: role || "MEMBER",
      token,
      invitedById,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Send email
  const isExistingUser = !!existingUser;
  await sendInviteEmail(email, token, firstName || "there", workspace.name, isExistingUser);

  return { message: "Invite email sent successfully" };
};

/**
 * Update a user's own profile (name, email, avatar, designation).
 */
const updateProfile = async (id, { name, email, avatar, designation, firstName, lastName }) => {
  const data = {};
  if (firstName) data.firstName = firstName;
  if (lastName) data.lastName = lastName;
  if (name) data.name = name;
  if (firstName && lastName) data.name = `${firstName} ${lastName}`;
  if (email) data.email = email;
  if (avatar) data.avatar = avatar;
  if (designation !== undefined) data.designation = designation;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });
  return user;
};

module.exports = { getAllUsers, getUserById, getDashboardStats, removeUserFromWorkspace, updateUserRole, inviteUser, updateProfile };
