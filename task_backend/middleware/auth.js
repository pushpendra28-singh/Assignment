const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid. User not found.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Admin only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin privileges required.',
  });
};

// Project member check
const projectMember = (roles = ['admin', 'member']) => {
  return async (req, res, next) => {
    try {
      const Project = require('../models/Project');
      const projectId = req.params.projectId || req.params.id || req.body.project;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }

      // Global admin bypass
      if (req.user.role === 'admin') {
        req.project = project;
        return next();
      }

      const member = project.members.find(
        (m) => m.user && m.user.toString() === req.user._id.toString()
      );

      if (!member || !roles.includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this project.',
        });
      }

      req.project = project;
      req.memberRole = member.role;
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  };
};

module.exports = { protect, adminOnly, projectMember };