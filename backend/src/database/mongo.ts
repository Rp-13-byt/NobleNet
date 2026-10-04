import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../core/utils/logger';

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('✅ MongoDB Connected successfully');
  } catch (error) {
    logger.error(
      { err: error },
      `❌ Could not connect to MongoDB at ${env.MONGO_URI}.\nPlease ensure MongoDB is running (e.g., via Docker 'docker start noblenet-mongo', or 'npm run db:start').`
    );
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('🛑 MongoDB Disconnected');
  } catch (error) {
    logger.error({ err: error }, '❌ MongoDB disconnection error');
  }
};
