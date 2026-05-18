const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
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
router.put('/:id', auth, [
  body('firstName').optional({ nullable: true, checkFalsy: true }).trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }),
  body('alternatePhone').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }),
  body('bio').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }),
  body('region').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  body('streetAddress').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  body('addressLine2').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  body('city').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }),
  body('country').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Country name must be 100 characters or less'),
  body('stateProvRegion').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }),
  body('postalZip').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }),
  body('birthday').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('occupation').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  body('organization').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  body('instagramHandle').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  body('twitterHandle').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  body('shirtSize').optional({ nullable: true, checkFalsy: true }).isIn(['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']),
  body('whyVolunteer').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }),
  body('skills').optional({ nullable: true, checkFalsy: true }).isArray().withMessage('Skills must be an array of strings'),
  body('skills.*').optional({ nullable: true, checkFalsy: true }).trim().isString().withMessage('Each skill must be a string'),
  body('availability').optional({ nullable: true, checkFalsy: true }).isArray().withMessage('Availability must be an array of strings'),
  body('availability.*').optional({ nullable: true, checkFalsy: true }).trim().isString().withMessage('Each availability item must be a string'),
  body('onboardingCompleted').optional({ nullable: true, checkFalsy: true }).isBoolean().withMessage('onboardingCompleted must be a boolean'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
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

    if (firstName) volunteer.firstName = firstName;
    if (lastName) volunteer.lastName = lastName;
    if (phone) volunteer.phone = phone;
    if (alternatePhone !== undefined) volunteer.alternatePhone = alternatePhone;
    if (gender !== undefined) volunteer.gender = gender;
    if (bio) volunteer.bio = bio;
    if (skills !== undefined) {
      volunteer.skills = Array.isArray(skills)
        ? skills.map((skill) => String(skill).trim()).filter(Boolean)
        : volunteer.skills;
    }
    if (profilePicture) volunteer.profilePicture = profilePicture;
    if (region !== undefined) volunteer.region = region;
    if (country !== undefined) volunteer.country = country;
    if (streetAddress !== undefined) volunteer.streetAddress = streetAddress;
    if (addressLine2 !== undefined) volunteer.addressLine2 = addressLine2;
    if (city !== undefined) volunteer.city = city;
    if (stateProvRegion !== undefined) volunteer.stateProvRegion = stateProvRegion;
    if (postalZip !== undefined) volunteer.postalZip = postalZip;
    if (birthday !== undefined) volunteer.birthday = birthday;
    if (occupation !== undefined) volunteer.occupation = occupation;
    if (organization !== undefined) volunteer.organization = organization;
    if (instagramHandle !== undefined) volunteer.instagramHandle = instagramHandle;
    if (twitterHandle !== undefined) volunteer.twitterHandle = twitterHandle;
    if (shirtSize !== undefined) volunteer.shirtSize = shirtSize;
    if (whyVolunteer !== undefined) volunteer.whyVolunteer = whyVolunteer;
    if (availability !== undefined) {
      volunteer.availability = Array.isArray(availability)
        ? availability.map((item) => String(item).trim()).filter(Boolean)
        : volunteer.availability;
    }
    if (onboardingCompleted !== undefined) volunteer.onboardingCompleted = onboardingCompleted;

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
