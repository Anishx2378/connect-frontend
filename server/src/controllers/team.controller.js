const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTeams = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    
    const teams = await prisma.team.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { members: true, projects: true }
        },
        lead: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getTeamDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req.user;

    const team = await prisma.team.findFirst({
      where: { id, workspaceId },
      include: {
        _count: {
          select: { members: true, projects: true }
        },
        lead: {
          select: { id: true, name: true, avatar: true, designation: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, designation: true, isOnline: true }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        projects: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    res.json({ success: true, data: team });
  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createTeam = async (req, res) => {
  try {
    const { name, handle, description, department, visibility, leadId, managerId, memberIds } = req.body;
    const { workspaceId, id: userId } = req.user;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }

    // Default lead is creator if not specified
    const teamLead = leadId || userId;
    
    let initialMembers = memberIds || [];
    if (!initialMembers.includes(teamLead)) {
      initialMembers.push(teamLead);
    }
    
    const membersData = initialMembers.map(mId => ({ userId: mId }));

    const team = await prisma.team.create({
      data: {
        name,
        handle,
        description,
        department,
        visibility,
        workspaceId,
        leadId: teamLead,
        managerId,
        members: {
          create: membersData
        }
      },
      include: {
        _count: {
          select: { members: true, projects: true }
        },
        lead: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('team_created', team);
    }

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error('Error creating team:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Team with this name already exists in the workspace' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addTeamMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body;
    const { workspaceId } = req.user;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Member IDs array is required' });
    }

    const team = await prisma.team.findFirst({
      where: { id, workspaceId },
      include: { members: true }
    });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const existingMemberIds = team.members.map(m => m.userId);
    const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id));
    
    if (newMemberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'All selected users are already in the team' });
    }

    const membersData = newMemberIds.map(mId => ({ userId: mId, teamId: id }));

    await prisma.teamMember.createMany({
      data: membersData
    });
    
    const newMembers = await prisma.teamMember.findMany({
      where: { teamId: id, userId: { in: newMemberIds } },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, designation: true, isOnline: true }
        }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('team_member_added', { teamId: id, newMembers });
    }

    res.json({ success: true, data: newMembers, message: 'Members added successfully' });
  } catch (error) {
    console.error('Error adding team members:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req.user;
    const { name, handle, description, department, visibility, colorTheme, avatar, coverImage, leadId, managerId } = req.body;

    const team = await prisma.team.findFirst({
      where: { id, workspaceId }
    });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name: name !== undefined ? name : team.name,
        handle: handle !== undefined ? handle : team.handle,
        description: description !== undefined ? description : team.description,
        department: department !== undefined ? department : team.department,
        visibility: visibility !== undefined ? visibility : team.visibility,
        colorTheme: colorTheme !== undefined ? colorTheme : team.colorTheme,
        avatar: avatar !== undefined ? avatar : team.avatar,
        coverImage: coverImage !== undefined ? coverImage : team.coverImage,
        leadId: leadId !== undefined ? leadId : team.leadId,
        managerId: managerId !== undefined ? managerId : team.managerId,
      },
      include: {
        _count: {
          select: { members: true, projects: true }
        },
        lead: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('team_updated', updatedTeam);
    }

    res.json({ success: true, data: updatedTeam });
  } catch (error) {
    console.error('Error updating team:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Team with this name or handle already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req.user;

    const team = await prisma.team.findFirst({
      where: { id, workspaceId }
    });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    await prisma.team.delete({
      where: { id }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('team_deleted', id);
    }

    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getTeams,
  getTeamDetails,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMembers
};
