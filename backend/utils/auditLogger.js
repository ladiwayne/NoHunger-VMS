const AuditLog = require('../models/AuditLog');

async function logAudit(entry = {}) {
  try {
    await AuditLog.create(entry);
  } catch (error) {
    console.error('[audit] Failed to save audit log:', error?.message || error);
  }
}

module.exports = {
  logAudit,
};
