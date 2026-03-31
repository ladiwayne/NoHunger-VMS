const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');

// Check in volunteer
router.post('/checkin', auth, async (req, res) => {
  try {
    const { activityId, eventId, checkInCode } = req.body;

    // Validate check-in code
    if (!checkInCode) {
      return res.status(400).json({ message: 'Check-in code is required' });
    }

    const checkin = new CheckIn({
      volunteerId: req.user.id,
      activityId,
      eventId,
      checkInTime: new Date(),
    });

    await checkin.save();

    res.status(201).json({
      message: 'Check-in successful',
      checkin,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking in', error: error.message });
  }
});

// Self-report completed hours - DISABLED
router.post('/self-report', auth, async (req, res) => {
  return res.status(403).json({ message: 'Self-reporting hours is disabled. Please check in to activities instead.' });
});

// Check out volunteer
router.put('/:id/checkout', auth, async (req, res) => {
  try {
    const checkin = await CheckIn.findById(req.params.id);
    if (!checkin) {
      return res.status(404).json({ message: 'Check-in record not found' });
    }

    checkin.checkOutTime = new Date();
    checkin.checkOutStatus = 'pending';

    await checkin.save();

    res.status(200).json({
      message: 'Check-out successful',
      checkin,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking out', error: error.message });
  }
});

// Approve check-in
router.put('/:id/approve-checkin', adminAuth, async (req, res) => {
  try {
    const checkin = await CheckIn.findById(req.params.id);
    if (!checkin) {
      return res.status(404).json({ message: 'Check-in record not found' });
    }

    checkin.checkInStatus = 'approved';
    checkin.approvedBy = req.user.id;

    await checkin.save();

    res.status(200).json({
      message: 'Check-in approved',
      checkin,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving check-in', error: error.message });
  }
});

// Approve check-out
router.put('/:id/approve-checkout', adminAuth, async (req, res) => {
  try {
    const checkin = await CheckIn.findById(req.params.id);
    if (!checkin) {
      return res.status(404).json({ message: 'Check-in record not found' });
    }

    checkin.checkOutStatus = 'completed';
    checkin.approvedBy = req.user.id;

    await checkin.save();

    // Update volunteer's total hours
    const volunteer = await User.findById(checkin.volunteerId);
    if (volunteer) {
      volunteer.totalVolunteeringHours += checkin.hoursSpent;
      await volunteer.save();
    }

    res.status(200).json({
      message: 'Check-out approved',
      checkin,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving check-out', error: error.message });
  }
});

// Get check-in records
router.get('/', async (req, res) => {
  try {
    const checkins = await CheckIn.find()
      .populate('volunteerId', 'firstName lastName email')
      .populate('activityId', 'title')
      .populate('eventId', 'title')
      .populate('approvedBy', 'firstName lastName email');
    
    res.status(200).json(checkins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching check-ins', error: error.message });
  }
});

// Get current volunteer check-ins
router.get('/my', auth, async (req, res) => {
  try {
    const checkins = await CheckIn.find({ volunteerId: req.user.id })
      .populate('activityId', 'title location startDate endDate')
      .populate('eventId', 'title eventDate location')
      .sort({ createdAt: -1 });
    res.status(200).json(checkins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your check-ins', error: error.message });
  }
});

// Reject check-in request
router.put('/:id/reject', adminAuth, async (req, res) => {
  try {
    const checkin = await CheckIn.findById(req.params.id);
    if (!checkin) {
      return res.status(404).json({ message: 'Check-in record not found' });
    }
    checkin.checkInStatus = 'rejected';
    checkin.approvedBy = req.user.id;
    await checkin.save();
    res.status(200).json({ message: 'Check-in rejected', checkin });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting check-in', error: error.message });
  }
});

module.exports = router;
