const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const superAdminAuth = require('../middleware/superAdminAuth');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Event = require('../models/Event');
const CheckIn = require('../models/CheckIn');
const Notification = require('../models/Notification');

// Dashboard stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const fromDate = req.query.from ? new Date(req.query.from) : null;
    const toDate = req.query.to ? new Date(req.query.to) : null;

    const periodFilter = {};
    if (fromDate && !Number.isNaN(fromDate.getTime())) periodFilter.$gte = fromDate;
    if (toDate && !Number.isNaN(toDate.getTime())) periodFilter.$lte = toDate;
    const hasPeriod = Object.keys(periodFilter).length > 0;

    const checkinPeriodMatch = hasPeriod
      ? { checkOutStatus: 'completed', createdAt: periodFilter }
      : { checkOutStatus: 'completed' };

    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const pendingApprovals = await User.countDocuments({ role: 'volunteer', status: 'pending' });
    const approvedVolunteers = await User.countDocuments({ role: 'volunteer', status: 'approved' });
    const totalActivities = await Activity.countDocuments();
    const completedActivities = await Activity.countDocuments({ status: 'completed' });
    const totalEvents = await Event.countDocuments();
    const pendingCheckins = await CheckIn.countDocuments({ checkInStatus: 'pending' });
    const totalCheckins = await CheckIn.countDocuments(checkinPeriodMatch);
    const totalHours = await CheckIn.aggregate([
      { $match: checkinPeriodMatch },
      { $group: { _id: null, totalHours: { $sum: '$hoursSpent' } } },
    ]);

    res.status(200).json({
      totalVolunteers,
      pendingApprovals,
      approvedVolunteers,
      totalActivities,
      completedActivities,
      totalEvents,
      pendingCheckins,
      totalCheckins,
      totalHours: totalHours.length > 0 ? totalHours[0].totalHours : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Approve volunteer
router.put('/volunteers/:id/approve', adminAuth, async (req, res) => {
  try {
    const volunteer = await User.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    volunteer.status = 'approved';
    volunteer.approvedBy = req.user.id;

    await volunteer.save();

    res.status(200).json({
      message: 'Volunteer approved',
      volunteer,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving volunteer', error: error.message });
  }
});

// Reject volunteer
router.put('/volunteers/:id/reject', adminAuth, async (req, res) => {
  try {
    const volunteer = await User.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    volunteer.status = 'rejected';
    volunteer.approvedBy = req.user.id;

    await volunteer.save();

    res.status(200).json({
      message: 'Volunteer rejected',
      volunteer,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting volunteer', error: error.message });
  }
});

// Get volunteer hours
router.get('/volunteers/:id/hours', adminAuth, async (req, res) => {
  try {
    const checkins = await CheckIn.find({
      volunteerId: req.params.id,
      checkOutStatus: 'completed',
    });

    const totalHours = checkins.reduce((acc, curr) => acc + curr.hoursSpent, 0);

    res.status(200).json({
      volunteerId: req.params.id,
      totalHours,
      checkins,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteer hours', error: error.message });
  }
});

// Top volunteers
router.get('/top-volunteers', adminAuth, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 5, 50));
    const volunteers = await User.find({ role: 'volunteer' })
      .select('-password')
      .sort({ totalVolunteeringHours: -1 })
      .limit(limit);
    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching top volunteers', error: error.message });
  }
});

// Create broadcast/direct message
router.post('/broadcasts', adminAuth, [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message is required (max 2000 chars)'),
  body('subject').optional().trim().isLength({ max: 200 }),
  body('recipientType').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  try {
    const { message, subject, recipientType = 'all', recipientIds = [], type = 'broadcast' } = req.body;

    let users = [];
    if (Array.isArray(recipientIds) && recipientIds.length > 0) {
      users = await User.find({ _id: { $in: recipientIds } }).select('_id');
    } else if (recipientType === 'approved') {
      users = await User.find({ role: 'volunteer', status: 'approved' }).select('_id');
    } else if (recipientType === 'pending') {
      users = await User.find({ role: 'volunteer', status: 'pending' }).select('_id');
    } else {
      users = await User.find({ role: 'volunteer' }).select('_id');
    }

    const rows = users.map((u) => ({
      userId: u._id,
      type,
      title: subject || 'Admin Broadcast',
      message,
      read: false,
    }));

    if (rows.length > 0) {
      await Notification.insertMany(rows);
    }

    res.status(201).json({ message: 'Broadcast sent', recipients: rows.length });
  } catch (error) {
    res.status(500).json({ message: 'Error sending broadcast', error: error.message });
  }
});

// List recent broadcasts
router.get('/broadcasts', adminAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ type: { $in: ['broadcast', 'direct'] } })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('userId', 'firstName lastName email');
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching broadcasts', error: error.message });
  }
});

// ─── Super Admin: Admin Account Management ───────────────────────────────────

// Get all pending admin access requests
router.get('/pending-admins', superAdminAuth, async (req, res) => {
  try {
    const pendingAdmins = await User.find({ role: 'admin', status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.status(200).json(pendingAdmins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending admins', error: error.message });
  }
});

// Get all admins (admin + super_admin)
router.get('/all-admins', superAdminAuth, async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins', error: error.message });
  }
});

// Approve an admin access request
router.put('/approve-admin/:id', superAdminAuth, async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin request not found' });
    }
    admin.status = 'approved';
    admin.approvedBy = req.user.id;
    await admin.save();
    res.status(200).json({
      message: 'Admin approved',
      admin: {
        id: admin._id, firstName: admin.firstName, lastName: admin.lastName,
        email: admin.email, status: admin.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving admin', error: error.message });
  }
});

// Reject an admin access request
router.put('/reject-admin/:id', superAdminAuth, async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin request not found' });
    }
    admin.status = 'rejected';
    admin.approvedBy = req.user.id;
    await admin.save();
    res.status(200).json({ message: 'Admin request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting admin', error: error.message });
  }
});

// Revoke admin access (demotes to volunteer)
router.delete('/revoke-admin/:id', superAdminAuth, async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    admin.role = 'volunteer';
    admin.status = 'approved';
    await admin.save();
    res.status(200).json({ message: 'Admin access revoked' });
  } catch (error) {
    res.status(500).json({ message: 'Error revoking admin access', error: error.message });
  }
});

// Promote a volunteer to admin
router.put('/promote-to-admin/:id', superAdminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'volunteer') {
      return res.status(400).json({ message: 'User is not a volunteer' });
    }
    user.role = 'admin';
    user.status = 'approved';
    user.approvedBy = req.user.id;
    await user.save();
    res.status(200).json({
      message: `${user.firstName} ${user.lastName} has been promoted to admin`,
      user: {
        id: user._id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, role: user.role, status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error promoting user to admin', error: error.message });
  }
});

// ─── Super Admin: Password Reset ───────────────────────────────────

// Reset volunteer password (auto-generate new password)
router.post('/reset-volunteer-password/:id', superAdminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow resetting volunteer passwords
    if (user.role !== 'volunteer') {
      return res.status(403).json({ message: 'Can only reset volunteer passwords' });
    }

    // Generate a secure random password
    const newPassword = generateSecurePassword();
    
    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      newPassword, // Return the plain password for sharing
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// Helper function to generate secure password
function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one uppercase, one lowercase, one number, one special char
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special
  
  // Fill remaining characters
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

module.exports = router;
