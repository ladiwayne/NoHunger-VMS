const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Activity = require('../models/Activity');
const CheckIn = require('../models/CheckIn');
const Invitation = require('../models/Invitation');
const { logAudit } = require('../utils/auditLogger');

// Get all volunteers
router.get('/', async (req, res) => {
  try {
    const query = { role: 'volunteer' };
    if (req.query.status) query.status = req.query.status;

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
    const skip  = (page - 1) * limit;

    const [total, volunteers] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .populate('appliedActivities')
        .populate('approvedBy', 'firstName lastName email'),
    ]);

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

    res.status(200).json({
      data: enriched,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteers', error: error.message });
  }
});

// Public volunteer profile summary (no auth) - MUST come before /:id to avoid param matching
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

// Update volunteer profile
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      phone, 
      alternatePhone,
      bio, 
      skills, 
      profilePicture, 
      region, 
      country, 
      streetAddress,
      addressLine2,
      city,
      stateProvRegion,
      postalZip,
      birthday,
      occupation,
      organization,
      instagramHandle,
      twitterHandle,
      shirtSize,
      whyVolunteer,
      gender, 
      availability, 
      onboardingCompleted 
    } = req.body;

    let volunteer = await User.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    if (firstName !== undefined) volunteer.firstName = firstName === null ? '' : String(firstName).trim();
    if (lastName !== undefined) volunteer.lastName = lastName === null ? '' : String(lastName).trim();
    if (phone !== undefined) volunteer.phone = phone === null ? '' : String(phone).trim();
    if (alternatePhone !== undefined) volunteer.alternatePhone = alternatePhone === null ? '' : String(alternatePhone).trim();
    if (gender !== undefined) volunteer.gender = gender === null ? '' : String(gender);
    if (bio !== undefined) volunteer.bio = bio === null ? '' : String(bio).trim();
    if (skills !== undefined) {
      volunteer.skills = Array.isArray(skills)
        ? skills.map((skill) => String(skill).trim()).filter(Boolean)
        : [];
    }
    if (profilePicture !== undefined) volunteer.profilePicture = profilePicture === null ? '' : String(profilePicture);
    if (region !== undefined) volunteer.region = region === null ? '' : String(region).trim();
    if (country !== undefined) volunteer.country = country === null ? '' : String(country).trim();
    if (streetAddress !== undefined) volunteer.streetAddress = streetAddress === null ? '' : String(streetAddress).trim();
    if (addressLine2 !== undefined) volunteer.addressLine2 = addressLine2 === null ? '' : String(addressLine2).trim();
    if (city !== undefined) volunteer.city = city === null ? '' : String(city).trim();
    if (stateProvRegion !== undefined) volunteer.stateProvRegion = stateProvRegion === null ? '' : String(stateProvRegion).trim();
    if (postalZip !== undefined) volunteer.postalZip = postalZip === null ? '' : String(postalZip).trim();
    if (birthday !== undefined) volunteer.birthday = birthday ? new Date(birthday) : null;
    if (occupation !== undefined) volunteer.occupation = occupation === null ? '' : String(occupation).trim();
    if (organization !== undefined) volunteer.organization = organization === null ? '' : String(organization).trim();
    if (instagramHandle !== undefined) volunteer.instagramHandle = instagramHandle === null ? '' : String(instagramHandle).trim();
    if (twitterHandle !== undefined) volunteer.twitterHandle = twitterHandle === null ? '' : String(twitterHandle).trim();
    if (shirtSize !== undefined) volunteer.shirtSize = shirtSize === null ? '' : String(shirtSize);
    if (whyVolunteer !== undefined) volunteer.whyVolunteer = whyVolunteer === null ? '' : String(whyVolunteer).trim();
    if (availability !== undefined) {
      volunteer.availability = Array.isArray(availability)
        ? availability.map((item) => String(item).trim()).filter(Boolean)
        : [];
    }
    if (onboardingCompleted !== undefined) volunteer.onboardingCompleted = Boolean(onboardingCompleted);

    await volunteer.save();
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'update_profile',
      entityType: 'User',
      entityId: volunteer._id,
      targetUserId: volunteer._id,
      targetUserName: `${volunteer.firstName} ${volunteer.lastName}`,
      details: { updatedFields: Object.keys(req.body) },
    });

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

    // Check for overlapping activities the volunteer has applied to or been approved for
    const existingActivities = await Activity.find({
      $or: [
        { _id: { $in: volunteer.appliedActivities || [] } },
        { volunteersApproved: req.params.id },
      ],
    });

    const { activitiesOverlap } = require('../utils/overlap');
    const overlaps = existingActivities.some((a) => activitiesOverlap(a, activity));

    if (overlaps) {
      return res.status(400).json({ message: 'This activity overlaps with another activity you have applied for or are approved on' });
    }

    if (volunteer.appliedActivities.includes(activityId)) {
      return res.status(400).json({ message: 'Volunteer already applied for this activity' });
    }

    volunteer.appliedActivities.push(activityId);
    activity.volunteersApplied.push(req.params.id);

    await volunteer.save();
    await activity.save();
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'apply_for_activity',
      entityType: 'Activity',
      entityId: activity._id,
      targetUserId: volunteer._id,
      targetUserName: `${volunteer.firstName} ${volunteer.lastName}`,
      details: { activityTitle: activity.title },
    });

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
