const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Create project
// @route   POST /api/projects
// @access  Private (Admin)
const createProject = async (req, res) => {
  try {
    const { name, description, status, priority, dueDate, tags, color } = req.body;

    const project = await Project.create({
      name,
      description,
      status,
      priority,
      dueDate,
      tags,
      color,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    await project.populate('members.user', 'name email avatar role');

    res.status(201).json({ success: true, message: 'Project created.', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all projects (admin sees all, member sees their own)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== 'admin') {
      query = { 'members.user': req.user._id };
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role')
      .sort({ createdAt: -1 });

    // Attach task stats for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const taskStats = await Task.aggregate([
          { $match: { project: p._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const stats = { todo: 0, 'in-progress': 0, review: 0, done: 0, total: 0 };
        taskStats.forEach((s) => {
          stats[s._id] = s.count;
          stats.total += s.count;
        });
        const overdue = await Task.countDocuments({
          project: p._id,
          dueDate: { $lt: new Date() },
          status: { $ne: 'done' },
        });
        return { ...p.toObject(), taskStats: stats, overdueCount: overdue };
      })
    );

    res.json({ success: true, count: projects.length, projects: projectsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check access
    if (req.user.role !== 'admin') {
      const isMember = project.members.some(
        (m) => m.user && m.user._id.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin or project admin)
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Only owner or global admin can update
    if (
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    res.json({ success: true, message: 'Project updated.', project: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Delete all tasks in the project
    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project and all its tasks deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Project Admin)
const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const alreadyMember = project.members.some(
      (m) => m.user && m.user.toString() === userId
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member.' });
    }

    project.members.push({ user: userId, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email avatar role');

    res.json({ success: true, message: 'Member added.', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Project Admin)
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove project owner.' });
    }

    project.members = project.members.filter(
      (m) => m.user && m.user.toString() !== req.params.userId
    );

    await project.save();
    await project.populate('members.user', 'name email avatar role');

    res.json({ success: true, message: 'Member removed.', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};