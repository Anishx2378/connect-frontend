const express = require('express');
const router = express.Router();
const { getTeams, getTeamDetails, createTeam, updateTeam, deleteTeam, addTeamMembers } = require('../controllers/team.controller');
const auth = require('../middleware/auth');
const requireWorkspace = require('../middleware/requireWorkspace');

// Protect all team routes
router.use(auth);
router.use(requireWorkspace);

router.get('/', getTeams);
router.post('/', createTeam);
router.get('/:id', getTeamDetails);
router.patch('/:id', updateTeam);
router.delete('/:id', deleteTeam);
router.post('/:id/members', addTeamMembers);

module.exports = router;
