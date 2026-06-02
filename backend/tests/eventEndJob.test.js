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

test('autoCompleteEventCheckouts checks out active event checkins when event ends', async () => {
  const User = require('../models/User');
  const Event = require('../models/Event');
  const Invitation = require('../models/Invitation');
  const CheckIn = require('../models/CheckIn');
  const { autoCompleteEventCheckouts } = require('../utils/eventEndJob');

  const volunteer = new User({
    firstName: 'Test',
    lastName: 'Volunteer',
    email: 'volunteer@example.com',
    password: 'password',
    role: 'volunteer',
    status: 'approved',
    securityQuestion: 'q',
    securityAnswer: 'a',
  });
  await volunteer.save();

  const now = new Date();
  const eventStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const eventEnd = new Date(now.getTime() - 30 * 60 * 1000);
  const event = new Event({
    title: 'Ended Event',
    description: 'Past event',
    eventDate: eventStart,
    endDate: eventEnd,
    location: 'Test Venue',
    createdBy: volunteer._id,
    status: 'published',
    invitedVolunteers: [volunteer._id],
    acceptedVolunteers: [volunteer._id],
    max_volunteers: 10,
  });
  await event.save();

  await Invitation.create({
    volunteerId: volunteer._id,
    eventId: event._id,
    status: 'accepted',
  });

  const checkin = new CheckIn({
    volunteerId: volunteer._id,
    eventId: event._id,
    checkInTime: new Date(eventEnd.getTime() - 60 * 60 * 1000),
    checkInStatus: 'approved',
    checkOutStatus: 'pending',
  });
  await checkin.save();

  const result = await autoCompleteEventCheckouts();
  expect(result.processedEvents).toBeGreaterThanOrEqual(1);
  expect(result.processedCheckins).toBeGreaterThanOrEqual(1);

  const updatedCheckin = await CheckIn.findById(checkin._id);
  expect(updatedCheckin.checkOutStatus).toBe('completed');
  expect(updatedCheckin.checkOutTime).not.toBeNull();
  expect(updatedCheckin.hoursSpent).toBeGreaterThan(0);

  const refreshedVolunteer = await User.findById(volunteer._id);
  expect(refreshedVolunteer.totalVolunteeringHours).toBeGreaterThan(0);
});
