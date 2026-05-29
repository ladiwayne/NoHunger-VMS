const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const Invitation = require('../models/Invitation');
const { autoRejectStaleInvitations } = require('../utils/invitationUtils');

// Create invitation (admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { volunteerId, eventId, activityId, message } = req.body;
    if (!volunteerId || (!eventId && !activityId)) {
      return res.status(400).json({ message: 'volunteerId and eventId/activityId are required' });
    }

    const invitation = new Invitation({
      volunteerId,
      eventId: eventId || undefined,
      activityId: activityId || undefined,
      message: message || '',
      status: 'pending',
    });

    await invitation.save();
    res.status(201).json({ message: 'Invitation created', invitation });
  } catch (error) {
    res.status(500).json({ message: 'Error creating invitation', error: error.message });
  }
});

// Get volunteer invitations
router.get('/', auth, async (req, res) => {
  try {
    await autoRejectStaleInvitations();

    const invitations = await Invitation.find({ volunteerId: req.user.id })
      .populate('eventId', 'title description eventDate location')
      .populate('activityId', 'title description startDate endDate location');
    
    res.status(200).json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invitations', error: error.message });
  }
});

// Accept invitation
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    invitation.status = 'accepted';
    invitation.respondedAt = new Date();

    await invitation.save();

    res.status(200).json({
      message: 'Invitation accepted',
      invitation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting invitation', error: error.message });
  }
});

// Reject invitation
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    invitation.status = 'rejected';
    invitation.respondedAt = new Date();

    await invitation.save();

    res.status(200).json({
      message: 'Invitation rejected',
      invitation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting invitation', error: error.message });
  }
});

module.exports = router;
