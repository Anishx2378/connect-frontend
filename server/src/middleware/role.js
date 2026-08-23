const { error } = require("../utils/response");

/**
 * Role-based access control middleware for workspace roles.
 * Usage: requireRole("ADMIN") or requireRole("OWNER", "ADMIN")
 * Must be used AFTER the auth middleware (req.user must exist).
 * Checks req.user.workspaceRole (set by auth middleware from WorkspaceMember).
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, "Authentication required.", 401);
    }

    if (!req.user.workspaceRole) {
      return error(res, "Workspace context required.", 400);
    }

    if (!roles.includes(req.user.workspaceRole)) {
      return error(res, "Access denied. Insufficient permissions.", 403);
    }

    next();
  };
};

module.exports = requireRole;
