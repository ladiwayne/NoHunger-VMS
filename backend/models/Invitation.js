const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: false,
    },
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: Date,
    message: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invitation', invitationSchema);
