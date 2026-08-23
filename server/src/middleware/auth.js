const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const { error } = require("../utils/response");

/**
 * JWT authentication middleware.
 * Expects header: Authorization: Bearer <token>
 * Optionally reads x-workspace-id header to attach workspace context.
 * 
 * Attaches:
 *   req.user         — core user fields (no password)
 *   req.user.workspaceId    — the active workspace id (if header present and valid)
 *   req.user.workspaceRole  — the user's role in that workspace
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, "Access denied. No token provided.", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB (password excluded)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        avatar: true,
        designation: true,
        emailVerified: true,
        isOnline: true,
        lastSeen: true,
        isSystemAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return error(res, "User not found. Token may be invalid.", 401);
    }

    // Attach core user
    req.user = { ...user };

    // Check for active workspace via header
    const workspaceId = req.headers["x-workspace-id"];
    if (workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId,
          },
        },
      });

      if (membership) {
        req.user.workspaceId = workspaceId;
        req.user.workspaceRole = membership.role;
      } else if (user.isSystemAdmin) {
        req.user.workspaceId = workspaceId;
        req.user.workspaceRole = "OWNER";
      }
      // If no membership and not system admin, we don't block here — some routes don't need workspace context.
      // Routes that require it should use the requireWorkspace middleware.
    }

    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return error(res, "Invalid token.", 401);
    }
    if (err.name === "TokenExpiredError") {
      return error(res, "Token expired.", 401);
    }
    return error(res, "Authentication failed.", 500);
  }
};

module.exports = auth;
