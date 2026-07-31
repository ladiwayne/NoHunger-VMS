const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('./config/database');
const { autoRejectStaleInvitations } = require('./utils/invitationUtils');
const { repairCompletedCheckinsAndVolunteerHours } = require('./utils/checkinDataRepair');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:4028,http://localhost:3000')
  .split(',')
  .map((s) => s.trim());
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy does not allow access from this origin'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add caching middleware for GET requests (2-minute cache)
const cacheMiddleware = require('./middleware/cache');
app.use(cacheMiddleware(120000));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/events', require('./routes/events'));
app.use('/api/checkins', require('./routes/checkins'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Root health check for Docker
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Request timing middleware for performance monitoring
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 500) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

/** Creates the super admin account on first startup if none exists yet. */
const seedSuperAdmin = async () => {
  try {
    const User = require('./models/User');
    const existing = await User.findOne({ role: 'super_admin' });
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const firstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
    const lastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

    if (!email || !password) {
      console.warn('[seed] SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping super admin seed.');
      return;
    }

    if (existing) {
      let shouldSave = false;
      if (firstName && existing.firstName !== firstName) {
        existing.firstName = firstName;
        shouldSave = true;
      }
      if (lastName && existing.lastName !== lastName) {
        existing.lastName = lastName;
        shouldSave = true;
      }
      if (shouldSave) {
        await existing.save();
        console.log(`[seed] Updated existing super admin name to: ${firstName} ${lastName}`);
      }
      return;
    }

    const superAdmin = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'super_admin',
      status: 'approved',
      securityQuestion: 'What is your favorite color?',
      securityAnswer: 'Blue',
    });

    await superAdmin.save();
    console.log(`[seed] Super admin account created: ${email}`);
  } catch (err) {
    console.error('[seed] Failed to seed super admin:', err.message);
  }
};

const startServer = async () => {
  try {
    await connectDB();

    try {
      const repairResult = await repairCompletedCheckinsAndVolunteerHours();
      if (repairResult.fixedCheckins > 0) {
        console.log(
          `[checkin-repair] Fixed ${repairResult.fixedCheckins} check-in(s) and recalculated ${repairResult.volunteersRecomputed} volunteer total(s)`
        );
      }
    } catch (repairError) {
      console.error('[checkin-repair] Startup repair failed:', repairError?.message || repairError);
    }

    await seedSuperAdmin();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Automatically reject invitations that remain pending within 48 hours of an event or activity start.
    const rejectStaleInvitations = async () => {
      const rejectedCount = await autoRejectStaleInvitations();
      if (rejectedCount > 0) {
        console.log(`[invitation] Automatically rejected ${rejectedCount} stale pending invitation(s)`);
      }
    };

    await rejectStaleInvitations();
    setInterval(rejectStaleInvitations, 60 * 60 * 1000); // Run hourly

    // Send reminders for events/activities starting ~24 hours from now
    const { sendStartReminders } = require('./utils/reminderJob');
    const { autoCompleteEventCheckouts } = require('./utils/eventEndJob');

    // Run once at startup and then hourly
    try {
      const created = await sendStartReminders();
      if (created > 0) console.log(`[reminder] Created ${created} start reminder(s)`);
    } catch (err) {
      console.error('[reminder] Failed to create start reminders:', err?.message || err);
    }
    setInterval(async () => {
      try {
        const created = await sendStartReminders();
        if (created > 0) console.log(`[reminder] Created ${created} start reminder(s)`);
      } catch (err) {
        console.error('[reminder] Failed to create start reminders:', err?.message || err);
      }
    }, 60 * 60 * 1000);

    // Automatically complete check-outs for events that have ended
    try {
      const result = await autoCompleteEventCheckouts();
      if (result.processedCheckins > 0) {
        console.log(`[event-end] Completed ${result.processedCheckins} active check-in(s) for ${result.processedEvents} ended event(s)`);
      }
    } catch (err) {
      console.error('[event-end] Failed to complete event-end checkouts:', err?.message || err);
    }
    setInterval(async () => {
      try {
        const result = await autoCompleteEventCheckouts();
        if (result.processedCheckins > 0) {
          console.log(`[event-end] Completed ${result.processedCheckins} active check-in(s) for ${result.processedEvents} ended event(s)`);
        }
      } catch (err) {
        console.error('[event-end] Failed to complete event-end checkouts:', err?.message || err);
      }
    }, 60 * 60 * 1000);

    const shutdown = async () => {
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
