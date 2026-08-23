const { error } = require("../utils/response");

/**
 * Middleware that requires a valid workspace context.
 * Must be used AFTER the auth middleware.
 * Checks that the user has selected a workspace and is a member.
 */
const requireWorkspace = (req, res, next) => {
  if (!req.user.workspaceId) {
    return error(res, "Workspace context required. Please set the x-workspace-id header.", 400);
  }
  next();
};

module.exports = requireWorkspace;
