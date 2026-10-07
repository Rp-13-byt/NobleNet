import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet: MongoMemoryReplSet | null = null;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890123456';
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_jwt_access_secret_1234567890123456';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_1234567890123456';
  process.env.PAYMENT_PROVIDER = 'mock';

  if (mongoose.connection.readyState === 0) {
    try {
      replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      const uri = replSet.getUri();
      await mongoose.connect(uri);
    } catch (err) {
      console.error('Failed to start MongoMemoryReplSet, falling back to localhost', err);
      await mongoose.connect('mongodb://localhost:27017/noblenet_test');
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (replSet) {
    await replSet.stop();
  }
});


