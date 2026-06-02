const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// List current user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, read: false });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
});

// Simple Server-Sent Events stream for live notifications
router.get('/stream', auth, async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // send initial payload
  const sendUpdates = async () => {
    try {
      const latest = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10);
      const unread = await Notification.countDocuments({ userId: req.user.id, read: false });
      const payload = {
        unread,
        latest: latest.map((n) => ({
          id: n._id,
          title: n.title,
          message: n.message,
          read: n.read,
          notification_type: n.type,
          related_id: n.relatedId || null,
          created_at: n.createdAt,
        })),
      };
      res.write(`event: notifications\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      // ignore transient errors
    }
  };

  // initial send and periodic polling
  await sendUpdates();
  const timer = setInterval(sendUpdates, 15 * 1000);

  req.on('close', () => {
    clearInterval(timer);
    try { res.end(); } catch (e) {}
  });
});

// Mark one read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
});

// Mark all read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications as read', error: error.message });
  }
});

module.exports = router;
