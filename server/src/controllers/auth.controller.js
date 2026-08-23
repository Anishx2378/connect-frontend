const authService = require("../services/auth.service");
const { success, error } = require("../utils/response");

/**
 * POST /api/auth/signup
 * Self-registration for new users.
 */
const signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return error(res, "First name, last name, email, and password are required.", 400);
    }

    if (password.length < 6) {
      return error(res, "Password must be at least 6 characters.", 400);
    }

    const result = await authService.signupUser({ firstName, lastName, email, password });
    return success(res, "Account created. Please check your email to verify.", result, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return error(res, "Verification token is required.", 400);
    }

    const result = await authService.verifyEmail({ token });
    return success(res, result.message, null);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, "Email and password are required.", 400);
    }

    const result = await authService.loginUser({ email, password });
    return success(res, "Login successful.", result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  const prisma = require("../config/db");

  if (req.user.isSystemAdmin) {
    const allWorkspaces = await prisma.workspace.findMany({
      select: { id: true, name: true, slug: true, logo: true },
      orderBy: { createdAt: "asc" },
    });
    
    const workspaces = allWorkspaces.map((w) => ({
      ...w,
      role: "OWNER",
    }));

    return success(res, "User retrieved.", { ...req.user, workspaces });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: req.user.id },
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

  return success(res, "User retrieved.", { ...req.user, workspaces });
};

/**
 * POST /api/auth/complete-invite
 * For NEW users invited via email — creates account and joins workspace.
 */
const completeInvite = async (req, res, next) => {
  try {
    const { token, password, firstName, lastName } = req.body;

    if (!token || !password) {
      return error(res, "Token and password are required.", 400);
    }

    if (password.length < 6) {
      return error(res, "Password must be at least 6 characters.", 400);
    }

    const result = await authService.completeInvite({ token, password, firstName, lastName });
    return success(res, "Signup successful.", result, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/accept-invite
 * For EXISTING authenticated users — joins workspace via invite token.
 */
const acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return error(res, "Invite token is required.", 400);
    }

    const result = await authService.acceptInviteForExistingUser({ token, userId: req.user.id });
    return success(res, "Successfully joined workspace.", result);
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, verifyEmail, login, getMe, completeInvite, acceptInvite };
