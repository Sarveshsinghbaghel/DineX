import { z } from 'zod';

export const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');
export const portSchema = z.coerce.number().int().min(1).max(65535);
export const urlSchema = z.string().url();
export const mongoConnectionStringSchema = z.string().min(1);

export * from './rbac.schema';

