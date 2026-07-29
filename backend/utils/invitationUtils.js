const Invitation = require('../models/Invitation');
const Event = require('../models/Event');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const createInvitationPayloads = ({ volunteerIds = [], eventId, activityId, title, message }) => {
  const uniqueVolunteerIds = Array.from(new Set((volunteerIds || []).filter(Boolean)));

  if (uniqueVolunteerIds.length === 0) {
    return { invitationRows: [], notificationRows: [] };
  }

  const invitationRows = uniqueVolunteerIds.map((volunteerId) => ({
    volunteerId,
    ...(eventId ? { eventId } : {}),
    ...(activityId ? { activityId } : {}),
    message: message || `You are invited to ${title}`,
    status: 'pending',
  }));

  const notificationRows = uniqueVolunteerIds.map((volunteerId) => ({
    userId: volunteerId,
    type: 'invitation',
    title: `New Invitation: ${title}`,
    message: message || `You have been invited to "${title}". Check your invitations to respond.`,
    read: false,
    relatedId: eventId || activityId || null,
  }));

  return { invitationRows, notificationRows };
};

const autoRejectStaleInvitations = async () => {
  const cutoff = new Date(Date.now() + 60 * 60 * 1000);

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

const insertInvitationRows = async ({ volunteerIds = [], eventId, activityId, title, message }) => {
  const { invitationRows, notificationRows } = createInvitationPayloads({
    volunteerIds,
    eventId,
    activityId,
    title,
    message,
  });

  if (invitationRows.length === 0) {
    return { invitations: [], notifications: [] };
  }

  const [invitations, notifications] = await Promise.all([
    Invitation.insertMany(invitationRows, { ordered: false }),
    Notification.insertMany(notificationRows, { ordered: false }),
  ]);

  return { invitations, notifications };
};

module.exports = {
  autoRejectStaleInvitations,
  createInvitationPayloads,
  insertInvitationRows,
};
