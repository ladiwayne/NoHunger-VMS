const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'test' });
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('sendStartReminders creates notifications for upcoming events and activities', async () => {
  const User = require('../models/User');
  const Event = require('../models/Event');
  const Activity = require('../models/Activity');
  const Notification = require('../models/Notification');
  const { sendStartReminders } = require('../utils/reminderJob');

  // create a user
  const u = new User({ firstName: 'Test', lastName: 'User', email: 't@example.com', password: 'x', role: 'volunteer', status: 'approved' });
  await u.save();

  // event starting ~24h from now
  const now = new Date();
  const evDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 1000);
  const ev = new Event({ title: 'Tomorrow Event', eventDate: evDate, location: 'City', coordinatorId: u._id, status: 'published', acceptedVolunteers: [u._id] });
  await ev.save();

  // activity starting ~24h from now
  const actStart = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 2000);
  const actEnd = new Date(actStart.getTime() + 2 * 60 * 60 * 1000);
  const act = new Activity({ title: 'Tomorrow Activity', startDate: actStart, endDate: actEnd, location: 'Park', coordinatorId: u._id, status: 'published', volunteersApproved: [u._id] });
  await act.save();

  const created = await sendStartReminders();
  expect(created).toBeGreaterThanOrEqual(2);

  const notifs = await Notification.find({ userId: u._id });
  expect(notifs.length).toBeGreaterThanOrEqual(2);
});
