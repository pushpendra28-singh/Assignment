const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role (admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'User role updated.', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate/activate user
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'}.`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Dashboard stats
// @route   GET /api/users/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    let projectQuery = {};
    let taskProjectIds;

    if (req.user.role !== 'admin') {
      projectQuery = { 'members.user': req.user._id };
    }

    const projects = await Project.find(projectQuery).select('_id status');
    taskProjectIds = projects.map((p) => p._id);

    const taskQuery = { project: { $in: taskProjectIds } };
    const myTaskQuery =
      req.user.role !== 'admin'
        ? { ...taskQuery, assignedTo: req.user._id }
        : taskQuery;

    const [
      totalProjects,
      activeProjects,
      totalTasks,
      tasksByStatus,
      overdueTasks,
      myTasks,
      recentTasks,
    ] = await Promise.all([
      Project.countDocuments(projectQuery),
      Project.countDocuments({ ...projectQuery, status: 'active' }),
      Task.countDocuments(taskQuery),
      Task.aggregate([
        { $match: { project: { $in: taskProjectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        project: { $in: taskProjectIds },
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
      }),
      Task.countDocuments(myTaskQuery),
      Task.find(taskQuery)
        .populate('project', 'name color')
        .populate('assignedTo', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const statusStats = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    tasksByStatus.forEach((s) => {
      statusStats[s._id] = s.count;
    });

    res.json({
      success: true,
      stats: {
        totalProjects,
        activeProjects,
        totalTasks,
        overdueTasks,
        myTasks,
        tasksByStatus: statusStats,
        recentTasks,
        completionRate:
          totalTasks > 0
            ? Math.round((statusStats.done / totalTasks) * 100)
            : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUserRole,
  updateUserStatus,
  getDashboardStats,
};