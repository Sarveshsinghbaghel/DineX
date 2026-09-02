import dotenv from 'dotenv';
import { DEFAULT_PORTS } from '@x10think/constants';
import { nodeEnvSchema, portSchema } from '@x10think/validation';
import { z } from 'zod';

dotenv.config({
  path: process.env.X10THINK_WORKER_ENV_FILE ?? '.env',
});

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  APP_NAME: z.string().default('DineX Worker'),
  APP_VERSION: z.string().default('0.1.0'),
  WORKER_PORT: portSchema.default(DEFAULT_PORTS.worker),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(30000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid worker environment: ${parsed.error.message}`);
}

export const env = parsed.data;
