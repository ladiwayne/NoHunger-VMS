const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const Event = require('../models/Event');
const Invitation = require('../models/Invitation');
const { generateCheckInCode, generateCheckInLink } = require('../utils/helpers');

// Create event
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, eventDate, location, invitedVolunteers } = req.body;

    const checkInCode = generateCheckInCode();
    const checkInLink = generateCheckInLink(checkInCode);

    const event = new Event({
      title,
      description,
      eventDate,
      location,
      createdBy: req.user.id,
      invitedVolunteers,
      checkInCode,
      checkInLink,
    });

    await event.save();

    // Create invitations
    if (invitedVolunteers && invitedVolunteers.length > 0) {
      const invitations = invitedVolunteers.map(volunteerId => ({
        volunteerId,
        eventId: event._id,
      }));
      await Invitation.insertMany(invitations);
    }

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid event data', error: error.message });
    }
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'firstName lastName email')
      .populate('invitedVolunteers', 'firstName lastName email')
      .populate('acceptedVolunteers', 'firstName lastName email');
    
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('invitedVolunteers', 'firstName lastName email')
      .populate('acceptedVolunteers', 'firstName lastName email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
});

// Send event invitations
router.post('/:id/send-invitations', adminAuth, async (req, res) => {
  try {
    const { volunteerIds } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const invitations = volunteerIds.map(volunteerId => ({
      volunteerId,
      eventId: event._id,
    }));

    await Invitation.insertMany(invitations);
    event.invitedVolunteers.push(...volunteerIds);
    await event.save();

    res.status(200).json({
      message: 'Invitations sent successfully',
      event,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending invitations', error: error.message });
  }
});

module.exports = router;
