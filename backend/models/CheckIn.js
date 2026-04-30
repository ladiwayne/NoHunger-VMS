const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    checkOutTime: {
      type: Date,
    },
    hoursSpent: {
      type: Number,
      default: 0,
    },
    checkInStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    checkOutStatus: {
      type: String,
      enum: ['pending', 'approved', 'completed'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  },
  { timestamps: true }
);

// Calculate hours spent when check-out time is added
checkinSchema.pre('save', function (next) {
  if (this.checkOutTime && this.checkInTime) {
    const diffMs = this.checkOutTime - this.checkInTime;
    this.hoursSpent = diffMs / (1000 * 60 * 60); // Convert to hours
  }
  next();
});

// Add indexes for faster queries
checkinSchema.index({ volunteerId: 1 }); // Fast lookups by volunteer
checkinSchema.index({ volunteerId: 1, checkInStatus: 1 }); // Volunteer + status
checkinSchema.index({ checkInTime: -1 }); // Fast sorting by date
checkinSchema.index({ activityId: 1 }); // Fast lookups by activity

module.exports = mongoose.model('CheckIn', checkinSchema);
