const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePermission = require('../middleware/permission');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

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
router.put('/:id/approve-checkin', requirePermission('manage_checkins'), async (req, res) => {
  try {
    const checkin = await CheckIn.findById(req.params.id);
    if (!checkin) {
      return res.status(404).json({ message: 'Check-in record not found' });
    }

    checkin.checkInStatus = 'approved';
    checkin.approvedBy = req.user.id;

    await checkin.save();
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'approve_checkin',
      entityType: 'CheckIn',
      entityId: checkin._id,
      targetUserId: checkin.volunteerId,
      details: { activityId: checkin.activityId },
    });

    res.status(200).json({
      message: 'Check-in approved',
      checkin,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving check-in', error: error.message });
  }
});

// Approve check-out
router.put('/:id/approve-checkout', requirePermission('manage_checkins'), async (req, res) => {
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

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'approve_checkout',
      entityType: 'CheckIn',
      entityId: checkin._id,
      targetUserId: checkin.volunteerId,
      details: { hoursAdded: checkin.hoursSpent },
    });

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
    const query = {};
    if (req.query.status) query.checkInStatus = req.query.status;
    if (req.query.activityId) query.activityId = req.query.activityId;

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
    const skip  = (page - 1) * limit;

    const [total, checkins] = await Promise.all([
      CheckIn.countDocuments(query),
      CheckIn.find(query)
        .populate('volunteerId', 'firstName lastName email')
        .populate('activityId', 'title')
        .populate('eventId', 'title')
        .populate('approvedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      data: checkins,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
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
router.put('/:id/reject', requirePermission('manage_checkins'), async (req, res) => {
  try {
    const checkin = await CheckIn.findById(req.params.id);
    if (!checkin) {
      return res.status(404).json({ message: 'Check-in record not found' });
    }
    checkin.checkInStatus = 'rejected';
    checkin.approvedBy = req.user.id;
    await checkin.save();

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'reject_checkin',
      entityType: 'CheckIn',
      entityId: checkin._id,
      targetUserId: checkin.volunteerId,
      details: { reason: 'rejected_by_admin' },
    });

    res.status(200).json({ message: 'Check-in rejected', checkin });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting check-in', error: error.message });
  }
});

module.exports = router;
