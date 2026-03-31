const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Activity = require('../models/Activity');
const CheckIn = require('../models/CheckIn');
const Invitation = require('../models/Invitation');

// Get all volunteers
router.get('/', async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer' })
      .select('-password')
      .populate('appliedActivities')
      .populate('approvedBy', 'firstName lastName email');

    const volunteerIds = volunteers.map((v) => v._id);
    const invitationStats = await Invitation.aggregate([
      { $match: { volunteerId: { $in: volunteerIds } } },
      {
        $group: {
          _id: '$volunteerId',
          total: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        },
      },
    ]);

    const statsByVolunteerId = new Map(invitationStats.map((row) => [row._id.toString(), row]));

    const enriched = volunteers.map((volunteer) => {
      const v = volunteer.toObject();
      const stats = statsByVolunteerId.get(v._id.toString()) || {
        total: 0,
        accepted: 0,
        pending: 0,
        rejected: 0,
      };

      let eventConfirmationStatus = 'no_invitations';
      if (stats.total > 0) {
        if (stats.accepted > 0 && stats.pending === 0 && stats.rejected === 0) {
          eventConfirmationStatus = 'confirmed';
        } else if (stats.pending > 0 && stats.accepted === 0 && stats.rejected === 0) {
          eventConfirmationStatus = 'pending_response';
        } else if (stats.rejected === stats.total) {
          eventConfirmationStatus = 'declined';
        } else {
          eventConfirmationStatus = 'mixed';
        }
      }

      return {
        ...v,
        invitationStats: {
          total: stats.total,
          accepted: stats.accepted,
          pending: stats.pending,
          rejected: stats.rejected,
        },
        eventConfirmationStatus,
      };
    });

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteers', error: error.message });
  }
});

// Get volunteer profile
router.get('/:id', auth, async (req, res) => {
  try {
    const volunteer = await User.findById(req.params.id)
      .select('-password')
      .populate('appliedActivities')
      .populate('approvedBy', 'firstName lastName email');
    
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.status(200).json(volunteer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteer', error: error.message });
  }
});

// Public volunteer profile summary (no auth)
router.get('/public-profile/:id', async (req, res) => {
  try {
    const volunteer = await User.findById(req.params.id)
      .select('-password')
      .populate('appliedActivities');

    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const checkins = await CheckIn.find({
      volunteerId: req.params.id,
      checkOutStatus: 'completed',
    })
      .populate('activityId', 'title startDate location')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ volunteer, checkins });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteer public profile', error: error.message });
  }
});

// Update volunteer profile
router.put('/:id', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, bio, skills, profilePicture, region, gender, availability, onboardingCompleted } = req.body;

    let volunteer = await User.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    if (firstName) volunteer.firstName = firstName;
    if (lastName) volunteer.lastName = lastName;
    if (phone) volunteer.phone = phone;
    if (gender !== undefined) volunteer.gender = gender;
    if (bio) volunteer.bio = bio;
    if (skills) volunteer.skills = skills;
    if (profilePicture) volunteer.profilePicture = profilePicture;
    if (region !== undefined) volunteer.region = region;
    if (availability !== undefined) volunteer.availability = availability;
    if (onboardingCompleted !== undefined) volunteer.onboardingCompleted = onboardingCompleted;

    await volunteer.save();

    res.status(200).json({
      message: 'Volunteer profile updated',
      volunteer,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating volunteer', error: error.message });
  }
});

// Apply for activity
router.post('/:id/apply-activity', auth, async (req, res) => {
  try {
    const { activityId } = req.body;

    const volunteer = await User.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (volunteer.appliedActivities.includes(activityId)) {
      return res.status(400).json({ message: 'Volunteer already applied for this activity' });
    }

    volunteer.appliedActivities.push(activityId);
    activity.volunteersApplied.push(req.params.id);

    await volunteer.save();
    await activity.save();

    res.status(200).json({
      message: 'Successfully applied for activity',
      volunteer,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error applying for activity', error: error.message });
  }
});

// Get volunteer's activities
router.get('/:id/activities', auth, async (req, res) => {
  try {
    const volunteer = await User.findById(req.params.id).populate('appliedActivities');
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.status(200).json(volunteer.appliedActivities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
});

module.exports = router;
