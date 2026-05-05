const express = require('express');
const {
  getUsers,
  getUser,
  updateUserRole,
  updateUserStatus,
  getDashboardStats,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard/stats', protect, getDashboardStats);
router.get('/', protect, adminOnly, getUsers);
router.get('/:id', protect, adminOnly, getUser);
router.put('/:id/role', protect, adminOnly, updateUserRole);
router.put('/:id/status', protect, adminOnly, updateUserStatus);

module.exports = router;