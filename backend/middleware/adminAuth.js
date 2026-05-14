const auth = require('./auth');
const User = require('../models/User');

const adminAuth = (req, res, next) => {
  auth(req, res, async () => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only admins can access this resource' });
    }

    if (req.user.role === 'admin') {
      const user = await User.findById(req.user.id).select('status');
      if (!user || user.status !== 'approved') {
        return res.status(403).json({ message: 'Admin access is not approved' });
      }
    }

    next();
  });
};

module.exports = adminAuth;
