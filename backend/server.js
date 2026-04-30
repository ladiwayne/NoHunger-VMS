const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:4028,http://localhost:3000')
  .split(',')
  .map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin) and listed frontend origins
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
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
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
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
    if (existing) return; // already seeded

    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const firstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
    const lastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

    if (!email || !password) {
      console.warn('[seed] SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping super admin seed.');
      return;
    }

    const superAdmin = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'super_admin',
      status: 'approved',
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
    await seedSuperAdmin();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

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
