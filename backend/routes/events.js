const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const Event = require('../models/Event');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const { generateCheckInCode, generateCheckInLink } = require('../utils/helpers');

// Create event
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, eventDate, endDate, location, invitedVolunteers, status, max_volunteers } = req.body;

    const start = new Date(eventDate);
    const end = new Date(endDate);
    if (!eventDate || Number.isNaN(start.getTime())) {
      return res.status(400).json({ message: 'A valid event start date/time is required' });
    }
    if (!endDate || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'A valid event end date/time is required' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'Event end date/time must be after event start date/time' });
    }

    const checkInCode = generateCheckInCode();
    const checkInLink = generateCheckInLink(checkInCode);

    const event = new Event({
      title,
      description,
      eventDate: start,
      endDate: end,
      location,
      status: status || 'draft',
      max_volunteers: max_volunteers || 0,
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

// Get event by check-in code
router.get('/code/:code', async (req, res) => {
  try {
    const event = await Event.findOne({ checkInCode: req.params.code.toUpperCase() })
      .populate('createdBy', 'firstName lastName email')
      .populate('invitedVolunteers', 'firstName lastName email')
      .populate('acceptedVolunteers', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found for this code' });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event by code', error: error.message });
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

// Update event
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, eventDate, endDate, location, status, max_volunteers } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const currentStart = event.eventDate;
    const currentEnd = event.endDate;
    const parsedStart = eventDate ? new Date(eventDate) : currentStart;
    const parsedEnd = endDate ? new Date(endDate) : currentEnd;

    if (eventDate && Number.isNaN(parsedStart.getTime())) {
      return res.status(400).json({ message: 'Invalid event start date/time' });
    }
    if (endDate && Number.isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ message: 'Invalid event end date/time' });
    }
    if (parsedStart && parsedEnd && parsedEnd <= parsedStart) {
      return res.status(400).json({ message: 'Event end date/time must be after start date/time' });
    }

    event.title = title ?? event.title;
    event.description = description ?? event.description;
    event.eventDate = parsedStart;
    event.endDate = parsedEnd;
    event.location = location ?? event.location;
    event.status = status ?? event.status;
    event.max_volunteers = typeof max_volunteers === 'number' ? max_volunteers : event.max_volunteers;

    await event.save();

    const refreshed = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('invitedVolunteers', 'firstName lastName email')
      .populate('acceptedVolunteers', 'firstName lastName email');

    res.status(200).json({ message: 'Event updated successfully', event: refreshed });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid event data', error: error.message });
    }
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
});

// Send event invitations
router.post('/:id/send-invitations', adminAuth, async (req, res) => {
  try {
    const { volunteerIds = [], inviteAll = false } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let targetVolunteerIds = Array.isArray(volunteerIds) ? volunteerIds.filter(Boolean) : [];

    if (inviteAll) {
      const approvedVolunteers = await User.find({ role: 'volunteer', status: 'approved' }).select('_id');
      targetVolunteerIds = approvedVolunteers.map((v) => v._id.toString());
    }

    const existingIds = event.invitedVolunteers.map((id) => id.toString());
    const uniqueNewIds = Array.from(new Set(targetVolunteerIds)).filter((id) => !existingIds.includes(id));

    if (uniqueNewIds.length === 0) {
      return res.status(200).json({ message: 'No new volunteers to invite', event });
    }

    const invitations = uniqueNewIds.map((volunteerId) => ({
      volunteerId,
      eventId: event._id,
    }));

    await Invitation.insertMany(invitations);
    event.invitedVolunteers.push(...uniqueNewIds);
    await event.save();

    const refreshed = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('invitedVolunteers', 'firstName lastName email')
      .populate('acceptedVolunteers', 'firstName lastName email');

    res.status(200).json({
      message: 'Invitations sent successfully',
      event: refreshed,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending invitations', error: error.message });
  }
});

module.exports = router;
