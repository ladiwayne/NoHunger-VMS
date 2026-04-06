const auth = require('./auth');

const superAdminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admins can access this resource' });
    }
    next();
  });
};

module.exports = superAdminAuth;
