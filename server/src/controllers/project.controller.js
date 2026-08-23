const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { success, error } = require('../utils/response');

// Create a project
exports.createProject = async (req, res, next) => {
  try {
    const { 
      name, key, description, client, category, priority, status, 
      startDate, deadline, color, workspaceId 
    } = req.body;

    if (!name || !workspaceId) {
      return error(res, 'Name and workspaceId are required', 400);
    }

    let projectKey = key;
    if (!projectKey) {
      projectKey = name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 5);
      if (projectKey.length < 2) projectKey += projectKey || 'PR';
    }

    const project = await prisma.project.create({
      data: {
        name,
        key: projectKey,
        description,
        client,
        category,
        priority: priority || 'Medium',
        status: status || 'Active',
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        color: color || '#8b5cf6',
        workspaceId,
        managerId: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: "Project Manager"
          }
        }
      },
      include: {
        manager: {
          select: { id: true, name: true, avatar: true, designation: true }
        },
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true, designation: true } }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: formatProject(project)
    });
  } catch (err) {
    next(err);
  }
};

// Get projects
exports.getProjects = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return error(res, 'Workspace ID is required', 400);
    }

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        manager: {
          select: { id: true, name: true, avatar: true, designation: true }
        },
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true, designation: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: projects.map(formatProject)
    });
  } catch (err) {
    next(err);
  }
};

// Get single project
exports.getProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findFirst({
      where: { 
        OR: [
          { id: projectId },
          { key: projectId.toUpperCase() }
        ]
      },
      include: {
        manager: {
          select: { id: true, name: true, avatar: true, designation: true }
        },
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true, designation: true } }
          }
        }
      }
    });

    if (!project) {
      return error(res, 'Project not found', 404);
    }

    res.status(200).json({
      success: true,
      data: formatProject(project)
    });
  } catch (err) {
    next(err);
  }
};

// Update project
exports.updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { members, ...data } = req.body;

    // We skip updating members directly via this endpoint for simplicity unless needed,
    // usually we have separate add/remove member endpoints, or we handle it here if requested.
    // For now we'll just handle basic data updates.
    
    if (members) {
      // Very basic sync: just delete existing and re-create.
      await prisma.projectMember.deleteMany({ where: { projectId } });
      if (members.length > 0) {
        await prisma.projectMember.createMany({
          data: members.map(m => ({
            projectId,
            userId: m.id,
            role: m.role || 'Member',
            department: m.department || 'General'
          }))
        })
      }
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        manager: {
          select: { id: true, name: true, avatar: true, designation: true }
        },
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true, designation: true } }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: formatProject(project)
    });
  } catch (err) {
    next(err);
  }
};

// Helper to format project for the frontend store structure
function formatProject(p) {
  return {
    ...p,
    manager: p.manager ? {
      id: p.manager.id,
      name: p.manager.name,
      avatar: p.manager.avatar,
      role: 'Project Manager',
      department: 'Management'
    } : null,
    members: p.members ? p.members.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar,
      role: m.role,
      department: m.department
    })) : []
  }
}
