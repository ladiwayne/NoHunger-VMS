const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

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
        resetToken, // Only in development
        resetLink, // Only in development
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
