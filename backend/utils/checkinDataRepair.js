const mongoose = require('mongoose');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');

/**
 * Repairs legacy check-ins that were marked completed without a checkout time,
 * then recomputes affected volunteers' total hours from completed check-ins.
 */
async function repairCompletedCheckinsAndVolunteerHours() {
  const affected = await CheckIn.find({
    checkOutStatus: 'completed',
    $or: [{ checkOutTime: { $exists: false } }, { checkOutTime: null }],
  });

  if (!affected.length) {
    return { fixedCheckins: 0, volunteersRecomputed: 0 };
  }

  const touchedVolunteerIds = new Set();
  for (const row of affected) {
    row.checkOutTime = row.updatedAt || new Date();
    await row.save();
    touchedVolunteerIds.add(String(row.volunteerId));
  }

  const volunteerIds = Array.from(touchedVolunteerIds);
  for (const volunteerId of volunteerIds) {
    const totalAgg = await CheckIn.aggregate([
      {
        $match: {
          volunteerId: new mongoose.Types.ObjectId(volunteerId),
          checkOutStatus: 'completed',
        },
      },
      { $group: { _id: null, total: { $sum: '$hoursSpent' } } },
    ]);

    const total = totalAgg[0]?.total || 0;
    await User.findByIdAndUpdate(volunteerId, { totalVolunteeringHours: total });
  }

  return {
    fixedCheckins: affected.length,
    volunteersRecomputed: volunteerIds.length,
  };
}

module.exports = {
  repairCompletedCheckinsAndVolunteerHours,
};
