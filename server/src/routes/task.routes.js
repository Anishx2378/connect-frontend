const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:issueKey', taskController.getTaskByIssueKey);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

module.exports = router;
