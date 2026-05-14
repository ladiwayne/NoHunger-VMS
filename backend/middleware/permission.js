const auth = require('./auth');
const User = require('../models/User');

const requirePermission = (permission) => async (req, res, next) => {
  auth(req, res, async () => {
    try {
      const user = await User.findById(req.user.id).select('role permissions status');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (user.role === 'super_admin') {
        return next();
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin privileges are required for this action' });
      }

      if (user.status !== 'approved') {
        return res.status(403).json({ message: 'Your admin access is not approved' });
      }

      if (!Array.isArray(user.permissions) || !user.permissions.includes(permission)) {
        return res.status(403).json({ message: 'You do not have permission to perform this action' });
      }

      req.user.permissions = user.permissions;
      next();
    } catch (error) {
      console.error('[permission] Error checking permissions:', error?.message || error);
      res.status(500).json({ message: 'Permission verification failed', error: error?.message || 'Unknown error' });
    }
  });
};

module.exports = requirePermission;
