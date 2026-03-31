const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const Activity = require('../models/Activity');
const { generateCheckInCode, generateCheckInLink } = require('../utils/helpers');
const Invitation = require('../models/Invitation');
const User = require('../models/User');

// Create activity
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, category, startDate, endDate, location, volunteersNeeded, requirements, skills } = req.body;

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
      checkInCode,
      checkInLink,
    });

    await activity.save();

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
    const activities = await Activity.find()
      .populate('coordinatorId', 'firstName lastName email')
      .populate('volunteersApplied', 'firstName lastName email')
      .populate('volunteersApproved', 'firstName lastName email');
    
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
});

// Get activity by ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('coordinatorId', 'firstName lastName email')
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
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, category, startDate, endDate, location, volunteersNeeded, requirements, skills, status } = req.body;

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

    await activity.save();

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

// Approve volunteer for activity
router.post('/:id/approve-volunteer', adminAuth, async (req, res) => {
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
    activity.volunteersApplied = activity.volunteersApplied.filter(v => v.toString() !== volunteerId);

    await activity.save();

    res.status(200).json({
      message: 'Volunteer approved for activity',
      activity,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving volunteer', error: error.message });
  }
});

// Send invitations to approved volunteers for an activity
router.post('/:id/send-invites', adminAuth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const approvedVolunteers = await User.find({
      role: 'volunteer',
      status: 'approved',
    }).select('_id');

    const rows = approvedVolunteers.map((v) => ({
      volunteerId: v._id,
      activityId: activity._id,
      message: `You are invited to ${activity.title}`,
      status: 'pending',
    }));

    if (rows.length > 0) {
      await Invitation.insertMany(rows);
    }

    res.status(201).json({ message: 'Invitations sent', count: rows.length });
  } catch (error) {
    res.status(500).json({ message: 'Error sending invitations', error: error.message });
  }
});

// Delete activity
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.status(200).json({ message: 'Activity deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting activity', error: error.message });
  }
});

module.exports = router;
