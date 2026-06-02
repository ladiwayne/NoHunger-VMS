const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePermission = require('../middleware/permission');
const { body, validationResult } = require('express-validator');
const Activity = require('../models/Activity');
const { generateCheckInCode, generateCheckInLink } = require('../utils/helpers');
const Invitation = require('../models/Invitation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

const sanitizeActivity = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required (max 2000 chars)'),
  body('location').trim().isLength({ min: 1, max: 300 }).withMessage('Location is required (max 300 chars)'),
  body('startDate').notEmpty().withMessage('Start date is required').bail().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate').notEmpty().withMessage('End date is required').bail().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
  body('category').optional().trim(),
];

// Create activity
router.post('/', requirePermission('manage_activities'), sanitizeActivity, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  try {
    const { title, description, category, startDate, endDate, location, volunteersNeeded, requirements, skills, invitedVolunteers } = req.body;

    const checkInCode = generateCheckInCode();
    const checkInLink = generateCheckInLink(checkInCode);

    const activity = new Activity({
      title,
      description,
      category,
      startDate,
      endDate,
      location,
      coordinatorId: req.user.id,
      volunteersNeeded,
      requirements,
      skills,
      invitedVolunteers,
      checkInCode,
      checkInLink,
    });

    await activity.save();

    if (Array.isArray(invitedVolunteers) && invitedVolunteers.length > 0) {
      const invitations = invitedVolunteers.map((volunteerId) => ({
        volunteerId,
        activityId: activity._id,
      }));
      await Invitation.insertMany(invitations, { ordered: false });
    }

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'create_activity',
      entityType: 'Activity',
      entityId: activity._id,
      details: { title: activity.title, category: activity.category },
    });

    res.status(201).json({
      message: 'Activity created successfully',
      activity,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid activity data', error: error.message });
    }
    res.status(500).json({ message: 'Error creating activity', error: error.message });
  }
});

// Get all activities
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.startDate) {
      const sd = new Date(req.query.startDate);
      if (!isNaN(sd.getTime())) query.startDate = { ...(query.startDate || {}), $gte: sd };
    }
    if (req.query.endDate) {
      const ed = new Date(req.query.endDate);
      if (!isNaN(ed.getTime())) query.endDate = { ...(query.endDate || {}), $lte: ed };
    }
    if (req.query.location) {
      query.location = { $regex: req.query.location, $options: 'i' };
    }
    if (req.query.search) {
      const s = req.query.search;
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { location: { $regex: s, $options: 'i' } },
      ];
    }
    if (req.query.skill) {
      query.skills = { $in: [req.query.skill] };
    }

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
    const skip  = (page - 1) * limit;

    const [total, activities] = await Promise.all([
      Activity.countDocuments(query),
      Activity.find(query)
        .populate('coordinatorId', 'firstName lastName email')
        .populate('invitedVolunteers', 'firstName lastName email')
        .populate('volunteersApplied', 'firstName lastName email')
        .populate('volunteersApproved', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      data: activities,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
});

// Get activity by ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('coordinatorId', 'firstName lastName email')
      .populate('invitedVolunteers', 'firstName lastName email')
      .populate('volunteersApplied', 'firstName lastName email')
      .populate('volunteersApproved', 'firstName lastName email');
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.status(200).json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity', error: error.message });
  }
});

// Get activity by check-in code
router.get('/code/:code', async (req, res) => {
  try {
    const activity = await Activity.findOne({ checkInCode: req.params.code.toUpperCase() })
      .populate('coordinatorId', 'firstName lastName email')
      .populate('invitedVolunteers', 'firstName lastName email')
      .populate('volunteersApplied', 'firstName lastName email')
      .populate('volunteersApproved', 'firstName lastName email');

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found for this code' });
    }
    res.status(200).json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity by code', error: error.message });
  }
});

// Update activity
router.put('/:id', requirePermission('manage_activities'), sanitizeActivity, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  try {
    const { title, description, category, startDate, endDate, location, volunteersNeeded, requirements, skills, status, invitedVolunteers } = req.body;

    let activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (title) activity.title = title;
    if (description) activity.description = description;
    if (category) activity.category = category;
    if (startDate) activity.startDate = startDate;
    if (endDate) activity.endDate = endDate;
    if (location) activity.location = location;
    if (volunteersNeeded) activity.volunteersNeeded = volunteersNeeded;
    if (requirements) activity.requirements = requirements;
    if (skills) activity.skills = skills;
    if (status) activity.status = status;
    if (Array.isArray(invitedVolunteers) && invitedVolunteers.length > 0) {
      const existingIds = activity.invitedVolunteers.map((id) => id.toString());
      const uniqueNewIds = invitedVolunteers
        .filter((id) => id && !existingIds.includes(id.toString()));
      if (uniqueNewIds.length > 0) {
        activity.invitedVolunteers.push(...uniqueNewIds);
        const invitations = uniqueNewIds.map((volunteerId) => ({
          volunteerId,
          activityId: activity._id,
        }));
        await Invitation.insertMany(invitations, { ordered: false });
      }
    }

    await activity.save();
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'update_activity',
      entityType: 'Activity',
      entityId: activity._id,
      details: { title: activity.title, status: activity.status },
    });

    res.status(200).json({
      message: 'Activity updated successfully',
      activity,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid activity data', error: error.message });
    }
    res.status(500).json({ message: 'Error updating activity', error: error.message });
  }
});

// Reset check-in code
router.put('/:id/reset-checkin-code', requirePermission('manage_activities'), async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    const newCode = generateCheckInCode();
    const newLink = generateCheckInLink(newCode);
    activity.checkInCode = newCode;
    activity.checkInLink = newLink;
    await activity.save();
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'reset_checkin_code',
      entityType: 'Activity',
      entityId: activity._id,
      details: { checkInCode: newCode },
    });
    res.status(200).json({ message: 'Check-in code reset successfully', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting check-in code', error: error.message });
  }
});

// Approve volunteer for activity
router.post('/:id/approve-volunteer', requirePermission('manage_activities'), async (req, res) => {
  try {
    const { volunteerId } = req.body;

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (!activity.volunteersApplied.includes(volunteerId)) {
      return res.status(400).json({ message: 'Volunteer has not applied for this activity' });
    }

    if (activity.volunteersApproved.includes(volunteerId)) {
      return res.status(400).json({ message: 'Volunteer already approved' });
    }

    activity.volunteersApproved.push(volunteerId);
    activity.volunteersApplied = activity.volunteersApplied.filter((v) => v.toString() !== volunteerId);

    await activity.save();
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'approve_activity_volunteer',
      entityType: 'Activity',
      entityId: activity._id,
      targetUserId: volunteerId,
      details: { activityTitle: activity.title },
    });

    res.status(200).json({
      message: 'Volunteer approved for activity',
      activity,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving volunteer', error: error.message });
  }
});

// Send invitations to approved volunteers for an activity
router.post('/:id/send-invites', requirePermission('manage_activities'), async (req, res) => {
  try {
    const { volunteerIds = [], inviteAll = false } = req.body;
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    let targetVolunteerIds = Array.isArray(volunteerIds) ? volunteerIds.filter(Boolean) : [];
    if (inviteAll) {
      const approvedVolunteers = await User.find({ role: 'volunteer', status: 'approved' }).select('_id');
      targetVolunteerIds = approvedVolunteers.map((v) => v._id.toString());
    }

    const existingIds = activity.invitedVolunteers.map((id) => id.toString());
    const uniqueNewIds = Array.from(new Set(targetVolunteerIds)).filter((id) => !existingIds.includes(id));

    if (uniqueNewIds.length === 0) {
      return res.status(200).json({ message: 'No new volunteers to invite', activity });
    }

    const invitationRows = uniqueNewIds.map((volunteerId) => ({
      volunteerId,
      activityId: activity._id,
      message: `You are invited to ${activity.title}`,
      status: 'pending',
    }));

    const notificationRows = uniqueNewIds.map((volunteerId) => ({
      userId: volunteerId,
      type: 'invitation',
      title: `New Invitation: ${activity.title}`,
      message: `You have been invited to participate in "${activity.title}". Check your invitations to respond.`,
      read: false,
    }));

    await Promise.all([
      Invitation.insertMany(invitationRows, { ordered: false }),
      Notification.insertMany(notificationRows, { ordered: false }),
    ]);

    activity.invitedVolunteers.push(...uniqueNewIds);
    await activity.save();

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'send_activity_invites',
      entityType: 'Activity',
      entityId: activity._id,
      details: { count: invitationRows.length },
    });

    const refreshed = await Activity.findById(req.params.id)
      .populate('coordinatorId', 'firstName lastName email')
      .populate('invitedVolunteers', 'firstName lastName email')
      .populate('volunteersApplied', 'firstName lastName email')
      .populate('volunteersApproved', 'firstName lastName email');

    res.status(201).json({ message: 'Invitations sent', count: invitationRows.length, activity: refreshed });
  } catch (error) {
    res.status(500).json({ message: 'Error sending invitations', error: error.message });
  }
});

// Delete activity
router.delete('/:id', requirePermission('manage_activities'), async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'delete_activity',
      entityType: 'Activity',
      entityId: activity._id,
      details: { title: activity.title },
    });
    res.status(200).json({ message: 'Activity deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting activity', error: error.message });
  }
});

module.exports = router;
