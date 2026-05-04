const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    alternatePhone: {
      type: String,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say', ''],
      default: '',
    },
    region: {
      type: String,
      default: '',
    },
    streetAddress: {
      type: String,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
    },
    stateProvRegion: {
      type: String,
    },
    postalZip: {
      type: String,
    },
    birthday: {
      type: Date,
    },
    occupation: {
      type: String,
    },
    organization: {
      type: String,
    },
    instagramHandle: {
      type: String,
    },
    twitterHandle: {
      type: String,
    },
    shirtSize: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', ''],
      default: '',
    },
    whyVolunteer: {
      type: String,
    },
    role: {
      type: String,
      enum: ['volunteer', 'admin', 'super_admin'],
      default: 'volunteer',
    },
    adminRequestReason: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    profilePicture: {
      type: String,
    },
    bio: {
      type: String,
    },
    skills: [String],
    availability: [String],
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    totalVolunteeringHours: {
      type: Number,
      default: 0,
    },
    securityQuestion: {
      type: String,
      required: true,
    },
    securityAnswer: {
      type: String,
      required: true,
    },
    appliedActivities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
      },
    ],
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add indexes for faster queries
userSchema.index({ email: 1 });  // Fast lookups by email for login
userSchema.index({ role: 1 });   // Fast volunteer/admin filtering
userSchema.index({ status: 1 }); // Fast approval status queries
userSchema.index({ createdAt: -1 }); // Fast sorting by date

module.exports = mongoose.model('User', userSchema);
