const Event = require('../models/Event');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const { logAudit } = require('./auditLogger');

async function autoCompleteEventCheckouts() {
  const now = new Date();
  const events = await Event.find({
    endDate: { $lte: now },
    status: { $in: ['published', 'ongoing'] },
  });

  let processedEvents = 0;
  let processedCheckins = 0;

  for (const event of events) {
    const checkins = await CheckIn.find({
      eventId: event._id,
      checkOutStatus: { $ne: 'completed' },
    });

    for (const checkin of checkins) {
      if (!checkin.checkOutTime) {
        checkin.checkOutTime = event.endDate || now;
      }
      checkin.checkOutStatus = 'completed';
      if (checkin.checkInStatus !== 'approved') {
        checkin.checkInStatus = 'approved';
      }

      await checkin.save();

      if (checkin.hoursSpent > 0) {
        const volunteer = await User.findById(checkin.volunteerId);
        if (volunteer) {
          volunteer.totalVolunteeringHours += checkin.hoursSpent;
          await volunteer.save();
        }
      }

      const auditEntry = {
        action: 'auto_checkout_event_end',
        entityType: 'CheckIn',
        entityId: checkin._id,
        targetUserId: checkin.volunteerId,
        details: {
          eventId: event._id,
          endDate: event.endDate,
          hoursSpent: checkin.hoursSpent,
        },
      };

      if (event.createdBy) {
        auditEntry.actorId = event.createdBy;
        auditEntry.actorRole = 'admin';
      } else {
        auditEntry.actorId = checkin.volunteerId;
        auditEntry.actorRole = 'volunteer';
      }

      await logAudit(auditEntry);

      processedCheckins += 1;
    }

    if (event.status !== 'completed') {
      event.status = 'completed';
      await event.save();
    }

    if (checkins.length > 0 || event.status === 'completed') {
      processedEvents += 1;
    }
  }

  return { processedEvents, processedCheckins };
}

module.exports = {
  autoCompleteEventCheckouts,
};
