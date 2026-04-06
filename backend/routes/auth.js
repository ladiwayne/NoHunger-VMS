const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

// Rate limiter: max 20 login attempts per 15 minutes per IP (failed attempts only)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: { message: 'Too many login attempts from this IP. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sanitization middleware for register
const sanitizeRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required (max 50 chars)'),
  body('lastName').optional().trim().isLength({ max: 50 }),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('country').optional().trim().isLength({ max: 100 }),
  body('region').optional().trim().isLength({ max: 100 }),
];

// Sanitization middleware for login
const sanitizeLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register (volunteer only — role cannot be set via public registration)
router.post('/register', sanitizeRegister, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  try {
    const { firstName, lastName, email, password, phone, gender, country, region, skills = [] } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      gender: gender || '',
      role: 'volunteer',
      status: 'approved',
      skills,
      region: region || country || '',
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Admin access request — DISABLED: super admins now promote volunteers directly
// router.post('/admin-register', ...) — removed

// One-time super admin setup (only works if no super_admin exists and setupKey matches env var)
router.post('/setup-super-admin', async (req, res) => {
  try {
    const { firstName, lastName, email, password, setupKey } = req.body;

    const expectedKey = process.env.SUPER_ADMIN_SETUP_KEY;
    if (!expectedKey || setupKey !== expectedKey) {
      return res.status(403).json({ message: 'Invalid setup key' });
    }

    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      return res.status(400).json({ message: 'A super admin already exists' });
    }

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, email, and password are required' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    user = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'super_admin',
      status: 'approved',
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'Super admin account created successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating super admin', error: error.message });
  }
});

// Login
router.post('/login', loginLimiter, sanitizeLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Block admin accounts awaiting approval
    if (user.role === 'admin' && user.status === 'pending') {
      return res.status(403).json({ message: 'Your admin account is awaiting approval from a super administrator.' });
    }
    if (user.role === 'admin' && user.status === 'rejected') {
      return res.status(403).json({ message: 'Your admin access request has been denied. Please contact the super administrator.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

module.exports = router;
