const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePermission = require('../middleware/permission');
const AuditLog = require('../models/AuditLog');

// List logs for the currently authenticated user
router.get('/me', auth, async (req, res) => {
  try {
    const logs = await AuditLog.find({ actorId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(200);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your audit logs', error: error.message });
  }
});

// List logs for admins and super admins
router.get('/admin', requirePermission('view_audit_logs'), async (req, res) => {
  try {
    const query = {};
    if (req.query.actorId) query.actorId = req.query.actorId;
    if (req.query.targetUserId) query.targetUserId = req.query.targetUserId;
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(500);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
  }
});

// List logs for a specific volunteer
router.get('/volunteer/:id', requirePermission('view_audit_logs'), async (req, res) => {
  try {
    const logs = await AuditLog.find({ targetUserId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(500);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteer audit logs', error: error.message });
  }
});

module.exports = router;
