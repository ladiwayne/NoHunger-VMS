const Notification = require('../models/Notification');
const Event = require('../models/Event');
const Activity = require('../models/Activity');

async function sendStartReminders() {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // +23 hours
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // +25 hours
    let created = 0;

    const events = await Event.find({
      eventDate: { $gte: windowStart, $lte: windowEnd },
      status: { $in: ['published', 'ongoing'] },
    });
    for (const ev of events) {
      const recipients = (ev.acceptedVolunteers && ev.acceptedVolunteers.length > 0)
        ? ev.acceptedVolunteers
        : ev.invitedVolunteers || [];
      for (const uid of recipients) {
        const exists = await Notification.findOne({ userId: uid, relatedId: ev._id, type: 'event_reminder' });
        if (exists) continue;
        await Notification.create({
          userId: uid,
          type: 'event_reminder',
          title: `Reminder: ${ev.title}`,
          message: `${ev.title} starts tomorrow. Location: ${ev.location}`,
          relatedId: ev._id,
        });
        created++;
      }
    }

    const activities = await Activity.find({
      startDate: { $gte: windowStart, $lte: windowEnd },
      status: { $in: ['published', 'ongoing'] },
    });
    for (const act of activities) {
      const recipients = (act.volunteersApproved && act.volunteersApproved.length > 0)
        ? act.volunteersApproved
        : act.invitedVolunteers || [];
      for (const uid of recipients) {
        const exists = await Notification.findOne({ userId: uid, relatedId: act._id, type: 'activity_reminder' });
        if (exists) continue;
        await Notification.create({
          userId: uid,
          type: 'activity_reminder',
          title: `Reminder: ${act.title}`,
          message: `${act.title} starts tomorrow at ${act.location}`,
          relatedId: act._id,
        });
        created++;
      }
    }

    return created;
  } catch (err) {
    throw err;
  }
}

module.exports = { sendStartReminders };
