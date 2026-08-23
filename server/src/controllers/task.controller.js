const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { success, error } = require('../utils/response');

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, type, projectId, assignees, labels, dueDate } = req.body;

    if (!title || !projectId) {
      return error(res, 'Title and projectId are required', 400);
    }

    const task = await prisma.$transaction(async (tx) => {
      // Atomically increment project nextIssueNumber
      const project = await tx.project.update({
        where: { id: projectId },
        data: { nextIssueNumber: { increment: 1 } },
        select: { key: true, nextIssueNumber: true }
      });

      const issueNumber = project.nextIssueNumber - 1;
      const issueKey = `${project.key}-${issueNumber}`;

      const data = {
        title,
        description,
        status: status || 'To Do',
        priority: priority || 'Medium',
        type: type || 'Task',
        issueNumber,
        issueKey,
        projectId,
        reporterId: req.user?.id || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      };
      
      if (labels && Array.isArray(labels)) {
         data.labels = labels;
      }

      const newTask = await tx.task.create({
        data,
      });

      if (assignees && assignees.length > 0) {
        await tx.taskAssignee.createMany({
          data: assignees.map(userId => ({
            userId,
            taskId: newTask.id
          }))
        });
      }

      return tx.task.findUnique({
        where: { id: newTask.id },
        include: {
          assignees: {
            include: {
              user: { select: { id: true, name: true, avatar: true } }
            }
          },
          reporter: { select: { id: true, name: true, avatar: true } }
        }
      });
    });

    res.status(201).json({
      success: true,
      data: formatTask(task)
    });
  } catch (err) {
    next(err);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const { projectId, assignedToMe } = req.query;
    
    let where = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (assignedToMe === 'true') {
      where.assignees = {
        some: { userId: req.user.id }
      };
    }

    if (!projectId && !assignedToMe) {
      return error(res, 'Either projectId or assignedToMe is required', 400);
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignees: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        },
        reporter: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, key: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: tasks.map(formatTask)
    });
  } catch (err) {
    next(err);
  }
};

exports.getTaskByIssueKey = async (req, res, next) => {
  try {
    const { issueKey } = req.params;
    const task = await prisma.task.findUnique({
      where: { issueKey: issueKey.toUpperCase() },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        },
        reporter: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, key: true } }
      }
    });

    if (!task) return error(res, 'Task not found', 404);

    res.status(200).json({
      success: true,
      data: formatTask(task)
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { assignees, ...data } = req.body;

    if (assignees) {
      await prisma.taskAssignee.deleteMany({ where: { taskId } });
      if (assignees.length > 0) {
        await prisma.taskAssignee.createMany({
          data: assignees.map(userId => ({ userId, taskId }))
        });
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignees: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: formatTask(task)
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    await prisma.task.delete({ where: { id: taskId } });
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

function formatTask(t) {
  return {
    ...t,
    assignees: t.assignees ? t.assignees.map(a => ({
      id: a.user.id,
      name: a.user.name,
      avatar: a.user.avatar,
    })) : [],
    checklist: [] // Mocking checklist since we haven't added it to schema
  };
}
