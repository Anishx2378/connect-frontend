const userService = require("../services/user.service");
const uploadService = require("../services/upload.service");
const { success, error } = require("../utils/response");

/**
 * GET /api/users
 * Get all users in the active workspace.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers(req.user.workspaceId, req.query.search);
    return success(res, "Users retrieved.", users);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return success(res, "User retrieved.", user);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/dashboard
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await userService.getDashboardStats(req.user.id, req.user.workspaceId);
    return success(res, "Dashboard stats retrieved.", stats);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id — Admin removes a user from the workspace
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return error(res, "You cannot remove yourself from the workspace.", 400);
    }

    const result = await userService.removeUserFromWorkspace(req.params.id, req.user.workspaceId);
    return success(res, "User removed from workspace.", result);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/role — Admin changes a user's workspace role
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role) {
      return error(res, "Role is required.", 400);
    }

    const user = await userService.updateUserRole(req.params.id, req.user.workspaceId, role);
    return success(res, "User role updated.", user);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/invite — Admin invites a new user to the workspace
 */
const inviteUser = async (req, res, next) => {
  try {
    const { firstName, lastName, fullName, email, role } = req.body;

    if (!email) {
      return error(res, "Email is required.", 400);
    }

    const result = await userService.inviteUser({
      firstName,
      lastName,
      fullName,
      email,
      role: role || "MEMBER",
      workspaceId: req.user.workspaceId,
      invitedById: req.user.id,
    });
    return success(res, "User invited successfully.", result, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id — User updates their own profile
 */
const updateProfile = async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id && !["OWNER", "ADMIN"].includes(req.user.workspaceRole)) {
      return error(res, "You are not allowed to update this profile.", 403);
    }

    const { name, email, designation, firstName, lastName } = req.body;
    let avatarUrl = undefined;

    if (req.file) {
      const result = await uploadService.uploadFile(req.file);
      avatarUrl = result.secure_url;
    }

    if (!name && !email && !avatarUrl && designation === undefined && !firstName && !lastName) {
      return error(res, "Provide at least one field to update.", 400);
    }

    const user = await userService.updateProfile(req.params.id, { name, email, designation, avatar: avatarUrl, firstName, lastName });
    return success(res, "Profile updated.", user);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, getDashboardStats, deleteUser, updateUserRole, inviteUser, updateProfile };
