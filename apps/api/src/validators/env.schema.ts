import { API_PREFIX, APP_NAME, DEFAULT_PORTS } from '@x10think/constants';
import {
  mongoConnectionStringSchema,
  nodeEnvSchema,
  portSchema,
  urlSchema,
} from '@x10think/validation';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  APP_NAME: z.string().default(APP_NAME),
  APP_VERSION: z.string().default('0.1.0'),
  PORT: portSchema.default(DEFAULT_PORTS.api),
  API_PREFIX: z.string().default(API_PREFIX),
  CLIENT_URL: urlSchema.default(`http://localhost:${DEFAULT_PORTS.web}`),
  MONGODB_URI: mongoConnectionStringSchema.default('mongodb://localhost:27017/dinex-dev'),
  MONGODB_DB_NAME: z.string().default('dinex-dev'),
  DATABASE_STRICT_STARTUP: z.coerce.boolean().default(false),
  REQUEST_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  JWT_ACCESS_SECRET: z.string().min(32).default('dinex_dev_access_secret_key_32chars_min'),
  JWT_REFRESH_SECRET: z.string().min(32).default('dinex_dev_refresh_secret_key_32chars_min'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().default('no-reply@dinex.local'),
});
