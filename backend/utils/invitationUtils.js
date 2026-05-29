const Invitation = require('../models/Invitation');
const Event = require('../models/Event');
const Activity = require('../models/Activity');

const autoRejectStaleInvitations = async () => {
  const cutoff = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const staleEventIds = (await Event.find({ eventDate: { $lte: cutoff } }).select('_id')).map((event) => event._id);
  const staleActivityIds = (await Activity.find({ startDate: { $lte: cutoff } }).select('_id')).map((activity) => activity._id);

  const staleQuery = {
    status: 'pending',
    $or: [],
  };

  if (staleEventIds.length > 0) staleQuery.$or.push({ eventId: { $in: staleEventIds } });
  if (staleActivityIds.length > 0) staleQuery.$or.push({ activityId: { $in: staleActivityIds } });

  if (staleQuery.$or.length === 0) {
    return 0;
  }

  const result = await Invitation.updateMany(
    staleQuery,
    { status: 'rejected', respondedAt: new Date() }
  );

  return result.modifiedCount || 0;
};

module.exports = {
  autoRejectStaleInvitations,
};
