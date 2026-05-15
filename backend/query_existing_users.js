require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const users = await User.find({ role: { $in: ['admin', 'super_admin', 'volunteer'] } }).select(
      'email role firstName lastName volunteer_status status'
    );
    console.log(
      JSON.stringify(
        users.map((u) => ({
          email: u.email,
          role: u.role,
          name: [u.firstName, u.lastName].filter(Boolean).join(' '),
          status: u.volunteer_status || u.status,
        })),
        null,
        2
      )
    );
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });