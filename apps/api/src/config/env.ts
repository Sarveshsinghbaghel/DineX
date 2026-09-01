import dotenv from 'dotenv';
import type { ZodIssue } from 'zod';

import { envSchema } from '../validators/env.schema';

dotenv.config({
  path: process.env.X10THINK_API_ENV_FILE ?? '.env',
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${parsed.error.issues
      .map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')}`,
  );
}

export const env = parsed.data;
