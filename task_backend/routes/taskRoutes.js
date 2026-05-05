const express = require('express');
const { body } = require('express-validator');
const {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  getAllTasks,
  updateTaskStatus,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router({ mergeParams: true });

// GET /api/tasks (all tasks dashboard)
router.get('/', protect, (req, res, next) => {
  if (req.params.projectId) {
    return getProjectTasks(req, res, next);
  }
  return getAllTasks(req, res, next);
});

router.post(
  '/',
  protect,
  [body('title').trim().isLength({ min: 3 }).withMessage('Task title must be at least 3 characters')],
  validate,
  createTask
);

router.get('/:id', protect, getTask);

router.put('/:id', protect, updateTask);

router.delete('/:id', protect, deleteTask);

router.patch(
  '/:id/status',
  protect,
  [
    body('status')
      .isIn(['todo', 'in-progress', 'review', 'done'])
      .withMessage('Invalid status value'),
  ],
  validate,
  updateTaskStatus
);

router.post(
  '/:id/comments',
  protect,
  [body('text').trim().isLength({ min: 1 }).withMessage('Comment cannot be empty')],
  validate,
  addComment
);

module.exports = router;