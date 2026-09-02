import { createServer } from 'node:http';

import { app } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './config/logger';

import { initSocketServer, getSocketServer } from './lib/socket.service';

const server = createServer(app);

async function bootstrap() {
  await connectDatabase();
  initSocketServer(server);

  server.listen(env.PORT, () => {
    logger.info('API server listening', {
      port: env.PORT,
      apiPrefix: env.API_PREFIX,
      environment: env.NODE_ENV,
    });
  });
}

async function shutdown(signal: NodeJS.Signals) {
  logger.info('Received shutdown signal', { signal });

  const socketIo = getSocketServer();
  if (socketIo) {
    logger.info('Closing Socket.IO connections');
    socketIo.close();
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await disconnectDatabase();
  logger.info('API shutdown completed');
  process.exit(0);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    shutdown(signal).catch((error: unknown) => {
      logger.error('API shutdown failed', { error });
      process.exit(1);
    });
  });
}

bootstrap().catch((error: unknown) => {
  logger.error('Failed to bootstrap API server', { error });
  process.exit(1);
});
