const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/db");
const { sendVerificationEmail } = require("../utils/mailer");

const SALT_ROUNDS = 10;

/**
 * Self-registration: create a new user account (unverified).
 * No workspace is assigned. User must verify email before logging in.
 */
const signupUser = async ({ firstName, lastName, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error("A user with this email already exists."), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const verificationToken = crypto.randomUUID();

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      emailVerified: false,
      verificationToken,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  // Send verification email
  await sendVerificationEmail(email, verificationToken, firstName);

  return { user };
};

/**
 * Verify a user's email address using the token from the verification link.
 */
const verifyEmail = async ({ token }) => {
  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  });

  if (!user) {
    throw Object.assign(new Error("Invalid or expired verification token."), { statusCode: 400 });
  }

  if (user.emailVerified) {
    throw Object.assign(new Error("Email is already verified."), { statusCode: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
    },
  });

  return { message: "Email verified successfully." };
};

/**
 * Login with email and password.
 * Returns user + JWT token + list of workspaces the user belongs to.
 */
const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(new Error("Invalid email or password."), { statusCode: 401 });
  }

  if (!user.emailVerified) {
    throw Object.assign(new Error("Please verify your email before logging in."), { statusCode: 403 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error("Invalid email or password."), { statusCode: 401 });
  }

  // Fetch workspaces the user belongs to
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true, logo: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const workspaces = memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }));

  const { password: _, verificationToken: __, ...userWithoutSensitive } = user;
  const token = generateToken(user.id);

  return { user: userWithoutSensitive, token, workspaces };
};

/**
 * Complete an invitation for a NEW user (creates account + joins workspace).
 */
const completeInvite = async ({ token, password, firstName, lastName }) => {
  // Decode the invite token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw Object.assign(new Error("Invalid or expired invite token."), { statusCode: 400 });
  }

  const { email, workspaceId, role } = decoded;

  // Check if invite record exists and is pending
  const invite = await prisma.workspaceInvite.findFirst({
    where: { email, workspaceId, status: "PENDING" },
    include: { workspace: { select: { name: true } } },
  });

  if (!invite) {
    throw Object.assign(new Error("Invitation not found or already used."), { statusCode: 400 });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    // Existing user — just add them to the workspace
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: existingUser.id, workspaceId } },
    });

    if (existingMembership) {
      throw Object.assign(new Error("You are already a member of this workspace."), { statusCode: 409 });
    }

    await prisma.workspaceMember.create({
      data: { userId: existingUser.id, workspaceId, role: role || "MEMBER" },
    });

    // Auto-join general channel
    await autoJoinGeneralChannel(existingUser.id, workspaceId);

    // Mark invite as accepted
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });

    const authToken = generateToken(existingUser.id);
    return { user: { id: existingUser.id, name: existingUser.name, email: existingUser.email }, token: authToken, workspaceId };
  }

  // New user — create account
  if (!firstName || !lastName) {
    throw Object.assign(new Error("First name and last name are required for new accounts."), { statusCode: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      emailVerified: true, // Trusted via admin invite
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Add to workspace
  await prisma.workspaceMember.create({
    data: { userId: user.id, workspaceId, role: role || "MEMBER" },
  });

  // Auto-join general channel
  await autoJoinGeneralChannel(user.id, workspaceId);

  // Mark invite as accepted
  await prisma.workspaceInvite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED" },
  });

  const authToken = generateToken(user.id);
  return { user, token: authToken, workspaceId };
};

/**
 * Accept an invite as an already-authenticated existing user.
 */
const acceptInviteForExistingUser = async ({ token, userId }) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw Object.assign(new Error("Invalid or expired invite token."), { statusCode: 400 });
  }

  const { workspaceId, role } = decoded;

  const invite = await prisma.workspaceInvite.findFirst({
    where: { token, status: "PENDING" },
  });

  if (!invite) {
    throw Object.assign(new Error("Invitation not found or already used."), { statusCode: 400 });
  }

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (existingMembership) {
    throw Object.assign(new Error("You are already a member of this workspace."), { statusCode: 409 });
  }

  await prisma.workspaceMember.create({
    data: { userId, workspaceId, role: role || "MEMBER" },
  });

  await autoJoinGeneralChannel(userId, workspaceId);

  await prisma.workspaceInvite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED" },
  });

  return { workspaceId };
};

/**
 * Helper: auto-join the #general channel in a workspace.
 */
const autoJoinGeneralChannel = async (userId, workspaceId) => {
  const generalChannel = await prisma.channel.findFirst({
    where: { name: "general", workspaceId },
  });
  if (generalChannel) {
    await prisma.channelMember.create({
      data: { userId, channelId: generalChannel.id },
    }).catch(() => {}); // ignore if already a member
  }
};

/**
 * Generate a JWT token for a user.
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = { signupUser, verifyEmail, loginUser, completeInvite, acceptInviteForExistingUser, generateToken };
