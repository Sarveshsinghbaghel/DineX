import { z } from 'zod';

export const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');
export const portSchema = z.coerce.number().int().min(1).max(65535);
export const urlSchema = z.string().url();
export const mongoConnectionStringSchema = z.string().min(1);

export * from './rbac.schema';
export * from './user-profile.schema';
export * from './restaurant-branch.schema';
export * from './inventory.schema';
export * from './employee.schema';
export * from './notification.schema';
export * from './engagement.schema';
export * from './analytics-reports.schema';
export * from './recommendations.schema';
export * from './qr-ordering.schema';
export * from './delivery.schema';

