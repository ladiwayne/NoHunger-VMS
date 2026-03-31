const auth = require('./auth');

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can access this resource' });
    }
    next();
  });
};

module.exports = adminAuth;
