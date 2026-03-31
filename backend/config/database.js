const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const getMongoUri = () => process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nohunger-vms';
const isLocalMongoUri = (mongoUri) => /mongodb:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)/i.test(mongoUri);

const connectDB = async () => {
  const mongoUri = getMongoUri();

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (process.env.MONGODB_URI && !isLocalMongoUri(mongoUri)) {
      throw new Error(`Error connecting to MongoDB: ${error.message}`);
    }

    console.warn(`Local MongoDB unavailable: ${error.message}`);
    console.warn('Starting embedded MongoDB instance for local preview.');

    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'nohunger-vms',
        launchTimeout: 120000,
      },
    });

    const memoryUri = memoryServer.getUri();
    const conn = await mongoose.connect(memoryUri);

    console.log(`MongoDB connected: ${conn.connection.host} (embedded)`);
    return conn;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
