import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'ORDER',
  'RESERVATION',
  'PAYMENT',
  'INVENTORY',
  'SYSTEM',
  'ACCOUNT',
  'EMPLOYEE',
  'SECURITY',
]);

export const broadcastNotificationSchema = z
  .object({
    type: notificationTypeSchema.default('SYSTEM'),
    title: z.string().min(2, 'Title is required').max(150).trim(),
    body: z.string().max(1000).trim().optional(),
    branchId: z.string().optional(),
    roleCode: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const notificationQuerySchema = z.object({
  type: notificationTypeSchema.optional(),
  status: z.enum(['queued', 'sent', 'delivered', 'read', 'failed', 'cancelled']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
