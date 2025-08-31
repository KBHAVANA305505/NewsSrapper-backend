import mongoose from 'mongoose';
import { redisClient } from '../src/index';
import { logger } from '../src/utils/logger';

// Test database setup
beforeAll(async () => {
  // Connect to test database
  const testMongoUri = process.env.MONGO_URI?.replace('/newshub', '/newshub-test') || 'mongodb://localhost:27017/newshub-test';
  
  await mongoose.connect(testMongoUri);
  logger.info('Connected to test database');
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Close connections after all tests
afterAll(async () => {
  await mongoose.connection.close();
  if (redisClient.status === 'ready') {
    await redisClient.quit();
  }
  logger.info('Test database connections closed');
});