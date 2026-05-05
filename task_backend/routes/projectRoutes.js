const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Include task routes for nested routing
const taskRouter = require('./taskRoutes');

const router = express.Router();

// Re-route into task router
router.use('/:projectId/tasks', taskRouter);

router.get('/', protect, getProjects);

router.post(
  '/',
  protect,
  [
    body('name').trim().isLength({ min: 3 }).withMessage('Project name must be at least 3 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  ],
  validate,
  createProject
);

router.get('/:id', protect, getProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

router.post(
  '/:id/members',
  protect,
  [body('userId').notEmpty().withMessage('User ID is required')],
  validate,
  addMember
);

router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;