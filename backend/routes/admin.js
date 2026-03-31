const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Event = require('../models/Event');
const CheckIn = require('../models/CheckIn');
const Notification = require('../models/Notification');

// Dashboard stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const pendingApprovals = await User.countDocuments({ role: 'volunteer', status: 'pending' });
    const approvedVolunteers = await User.countDocuments({ role: 'volunteer', status: 'approved' });
    const totalActivities = await Activity.countDocuments();
    const completedActivities = await Activity.countDocuments({ status: 'completed' });
    const totalEvents = await Event.countDocuments();
    const pendingCheckins = await CheckIn.countDocuments({ checkInStatus: 'pending' });
    const totalCheckins = await CheckIn.countDocuments({ checkOutStatus: 'completed' });
    const totalHours = await CheckIn.aggregate([
      { $match: { checkOutStatus: 'completed' } },
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
router.post('/broadcasts', adminAuth, async (req, res) => {
  try {
    const { message, subject, recipientType = 'all', recipientIds = [], type = 'broadcast' } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message is required' });
    }

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

module.exports = router;
