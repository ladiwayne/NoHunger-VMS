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
  body('skills').optional().isArray().withMessage('Skills must be an array of strings'),
  body('skills.*').optional().trim().isString().withMessage('Each skill must be a string'),
  body('securityQuestion').notEmpty().withMessage('Security question is required'),
  body('securityAnswer').notEmpty().withMessage('Security answer is required'),
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
    const { firstName, lastName, email, password, phone, gender, country, region, skills = [], securityQuestion, securityAnswer } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills.map((skill) => String(skill).trim()).filter(Boolean)
      : [];

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
      skills: normalizedSkills,
      region: region || country || '',
      securityQuestion,
      securityAnswer: securityAnswer.toLowerCase().trim(), // Normalize answer
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

// Change password for authenticated user
router.put('/change-password', require('../middleware/auth'), [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter'),
  body('confirmPassword').custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

// ============ PASSWORD RESET ENDPOINTS ============

// Store reset tokens in memory (for production, use Redis)
const resetTokens = new Map();

// Clean up expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expiresAt < now) {
      resetTokens.delete(token);
    }
  }
}, 10 * 60 * 1000);

/**
 * POST /api/auth/forgot-password
 * Request password reset token
 */
router.post(
  '/forgot-password',
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { email } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        // Security: Don't reveal if email exists
        return res.status(200).json({
          message: 'If that email address is in our system, you will receive a password reset link.',
        });
      }

      // Generate reset token (1 hour expiry)
      const resetToken = jwt.sign(
        {
          id: user._id,
          email: user.email,
          purpose: 'password-reset',
        },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '1h' }
      );

      // Store token metadata (for revocation/tracking)
      resetTokens.set(resetToken, {
        userId: user._id,
        email: user.email,
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
        used: false,
      });

      // Build reset link
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:4028'}/reset-password?token=${resetToken}`;

      // TODO: In production, send email with reset link
      // For now, log it and return to user (in dev/staging)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n📧 PASSWORD RESET LINK (Development Only):\n${resetLink}\n`);
      }

      // Return success (don't expose token in production)
      if (process.env.NODE_ENV === 'production') {
        return res.status(200).json({
          message: 'If that email address is in our system, you will receive a password reset link.',
        });
      }

      // In development, return the token for testing
      return res.status(200).json({
        message: 'Password reset link generated',
        resetToken,
        resetLink,
        expiresIn: '1 hour',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Error processing password reset request' });
    }
  }
);

/**
 * POST /api/auth/verify-reset-token
 * Verify that a reset token is valid
 */
router.post(
  '/verify-reset-token',
  body('token').notEmpty().withMessage('Reset token is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { token } = req.body;

      // Check if token exists in our store
      const tokenData = resetTokens.get(token);
      if (!tokenData) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      if (tokenData.used) {
        return res.status(400).json({ message: 'This reset link has already been used' });
      }

      // Verify JWT signature
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');

      if (decoded.purpose !== 'password-reset') {
        return res.status(400).json({ message: 'Invalid token purpose' });
      }

      res.status(200).json({
        message: 'Token is valid',
        userId: decoded.id,
        email: decoded.email,
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ message: 'Invalid reset token' });
      }
      console.error('Token verification error:', error);
      res.status(500).json({ message: 'Error verifying reset token' });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password using valid token
 */
router.post(
  '/reset-password',
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { token, password } = req.body;

      // Check if token exists and hasn't been used
      const tokenData = resetTokens.get(token);
      if (!tokenData) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      if (tokenData.used) {
        return res.status(400).json({ message: 'This reset link has already been used' });
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');

      if (decoded.purpose !== 'password-reset') {
        return res.status(400).json({ message: 'Invalid token purpose' });
      }

      // Get user and update password
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      // Update password (User model pre-save hook will hash it)
      user.password = password;
      await user.save();

      // Mark token as used
      tokenData.used = true;
      resetTokens.set(token, tokenData);

      res.status(200).json({
        message: 'Password has been successfully reset. Please sign in with your new password.',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ message: 'Invalid reset token' });
      }
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Error resetting password' });
    }
  }
);

module.exports = router;
