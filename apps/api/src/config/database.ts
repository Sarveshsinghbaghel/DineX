import mongoose from 'mongoose';

import { env } from './env';
import { logger } from './logger';

let isConnectionAttempted = false;

export async function connectDatabase() {
  if (isConnectionAttempted || mongoose.connection.readyState === 1) {
    return;
  }

  isConnectionAttempted = true;

  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
    });
    logger.info('MongoDB connection established');
  } catch (error: unknown) {
    logger.error('MongoDB connection failed during startup', {
      error,
      strictStartup: env.DATABASE_STRICT_STARTUP,
    });

    if (env.DATABASE_STRICT_STARTUP) {
      throw error;
    }
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  logger.info('MongoDB connection closed');
}

export function getDatabaseStatus() {
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  } as const;

  return statusMap[mongoose.connection.readyState as keyof typeof statusMap] ?? 'disconnected';
}
