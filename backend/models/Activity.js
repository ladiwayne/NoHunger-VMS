const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['outreach', 'event', 'project', 'training'],
      default: 'outreach',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    coordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    volunteersNeeded: {
      type: Number,
      default: 10,
    },
    volunteersApplied: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    volunteersApproved: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    checkInCode: {
      type: String,
      unique: true,
    },
    checkInLink: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'ongoing', 'completed'],
      default: 'draft',
    },
    image: {
      type: String,
    },
    requirements: [String],
    skills: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
