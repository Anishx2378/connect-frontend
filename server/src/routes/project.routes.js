const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const auth = require('../middleware/auth');

// Apply protection middleware to all project routes
router.use(auth);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', projectController.getProjectById);
router.put('/:projectId', projectController.updateProject);

module.exports = router;
