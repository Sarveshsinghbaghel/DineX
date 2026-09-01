import { env } from './config/env';
import { logger } from './config/logger';

let heartbeat: NodeJS.Timeout | undefined;

async function bootstrap() {
  logger.info('Worker foundation started', {
    environment: env.NODE_ENV,
    pollIntervalMs: env.WORKER_POLL_INTERVAL_MS,
  });

  heartbeat = setInterval(() => {
    logger.debug('Worker heartbeat', {
      timestamp: new Date().toISOString(),
    });
  }, env.WORKER_POLL_INTERVAL_MS);
}

async function shutdown(signal: NodeJS.Signals) {
  logger.info('Worker shutdown received', { signal });

  if (heartbeat) {
    clearInterval(heartbeat);
  }

  logger.info('Worker shutdown completed');
  process.exit(0);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    shutdown(signal).catch((error: unknown) => {
      logger.error('Worker shutdown failed', { error });
      process.exit(1);
    });
  });
}

bootstrap().catch((error: unknown) => {
  logger.error('Worker bootstrap failed', { error });
  process.exit(1);
});
