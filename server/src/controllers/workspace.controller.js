const prisma = require("../config/db");
const { success, error: sendError } = require("../utils/response");
const uploadService = require("../services/upload.service");

/**
 * GET /api/workspaces
 * Get all workspaces the authenticated user belongs to.
 */
const getWorkspaces = async (req, res, next) => {
  try {
    if (req.user.isSystemAdmin) {
      const allWorkspaces = await prisma.workspace.findMany({
        include: {
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      const workspaces = allWorkspaces.map((w) => ({
        ...w,
        role: "OWNER",
        joinedAt: w.createdAt,
      }));

      return success(res, "Workspaces retrieved.", workspaces);
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            createdAt: true,
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    const workspaces = memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return success(res, "Workspaces retrieved.", workspaces);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/workspaces/current
 * Get the currently active workspace (from x-workspace-id header).
 */
const getCurrentWorkspace = async (req, res, next) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.user.workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
      },
    });

    if (!workspace) {
      return sendError(res, "Workspace not found.", 404);
    }

    return success(res, "Workspace retrieved.", workspace);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/workspaces
 * Create a new workspace. The creator becomes OWNER.
 * Also creates a default #general channel.
 */
const createWorkspace = async (req, res, next) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return sendError(res, "Workspace name and slug are required.", 400);
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return sendError(res, "Slug must be lowercase letters, numbers, and hyphens only.", 400);
    }

    // Check slug uniqueness
    const existingSlug = await prisma.workspace.findUnique({ where: { slug } });
    if (existingSlug) {
      return sendError(res, "This workspace URL is already taken.", 409);
    }

    let logoUrl = undefined;
    if (req.file) {
      const result = await uploadService.uploadFile(req.file);
      logoUrl = result.secure_url;
    }

    // Create workspace + owner membership + general channel in a transaction
    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name,
          slug,
          logo: logoUrl,
          createdById: req.user.id,
        },
      });

      // Creator becomes OWNER
      await tx.workspaceMember.create({
        data: {
          userId: req.user.id,
          workspaceId: ws.id,
          role: "OWNER",
        },
      });

      // Create default #general channel
      const channel = await tx.channel.create({
        data: {
          name: "general",
          description: "General discussion for the team",
          workspaceId: ws.id,
        },
      });

      // Auto-join the creator to #general
      await tx.channelMember.create({
        data: {
          userId: req.user.id,
          channelId: channel.id,
        },
      });

      return ws;
    });

    return success(res, "Workspace created successfully.", workspace, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/workspaces/current
 * Update the current workspace's name and/or logo.
 */
const updateWorkspace = async (req, res, next) => {
  try {
    const { name } = req.body;
    let logoUrl = undefined;

    if (req.file) {
      const result = await uploadService.uploadFile(req.file);
      logoUrl = result.secure_url;
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (logoUrl) updateData.logo = logoUrl;

    const workspace = await prisma.workspace.update({
      where: { id: req.user.workspaceId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
      },
    });

    return success(res, "Workspace updated successfully.", workspace);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWorkspaces,
  getCurrentWorkspace,
  createWorkspace,
  updateWorkspace,
};
