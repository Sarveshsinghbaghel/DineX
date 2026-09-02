import { z } from 'zod';
import { addressSchema } from './user-profile.schema';

export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm 24-hour format (e.g. 09:00, 23:30)');

export const businessHoursIntervalSchema = z
  .object({
    open: timeStringSchema,
    close: timeStringSchema,
    isClosed: z.boolean().optional(),
  })
  .strict();

export const dayOfWeekSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export const dayBusinessHoursSchema = z
  .object({
    day: dayOfWeekSchema,
    isClosed: z.boolean().default(false),
    intervals: z.array(businessHoursIntervalSchema).default([]),
  })
  .strict();

export const weeklyBusinessHoursSchema = z.array(dayBusinessHoursSchema);

export const taxConfigSchema = z
  .object({
    gstNumber: z.string().max(30).trim().optional(),
    panNumber: z.string().max(20).trim().optional(),
    taxRate: z.number().min(0).max(100).optional(),
  })
  .strict();

export const createRestaurantSchema = z
  .object({
    name: z.string().min(2, 'Restaurant name is required').max(100).trim(),
    legalName: z.string().min(2, 'Legal name is required').max(150).trim(),
    description: z.string().max(500).trim().optional(),
    email: z.string().email('Valid contact email is required').trim(),
    phone: z.string().min(5, 'Valid phone number is required').max(20).trim(),
    website: z.string().url('Website must be a valid URL').optional().or(z.literal('')),
    address: addressSchema,
    cuisineTypes: z.array(z.string().max(50)).default(['Multi-Cuisine']),
    taxConfig: taxConfigSchema.optional(),
    currency: z.string().length(3, 'Currency must be 3-letter ISO code e.g. INR').default('INR'),
    timezone: z.string().min(2).max(50).default('Asia/Kolkata'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ONBOARDING']).default('ACTIVE'),
    businessHours: weeklyBusinessHoursSchema.optional(),
  })
  .strict();

export const updateRestaurantSchema = createRestaurantSchema.partial().strict();

export const restaurantStatusSchema = z
  .object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ONBOARDING']),
    reason: z.string().max(500).optional(),
  })
  .strict();

export const branchCoordinatesSchema = z
  .object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .strict();

export const createBranchSchema = z
  .object({
    restaurantId: z.string().min(1, 'Parent restaurant ID is required'),
    name: z.string().min(2, 'Branch name is required').max(100).trim(),
    code: z
      .string()
      .min(2, 'Branch code is required')
      .max(20)
      .trim()
      .transform((val) => val.toUpperCase()),
    address: addressSchema,
    phone: z.string().min(5, 'Valid phone number is required').max(20).trim(),
    email: z.string().email().optional().or(z.literal('')),
    managerId: z.string().optional(),
    businessHours: weeklyBusinessHoursSchema.optional(),
    timezone: z.string().min(2).max(50).default('Asia/Kolkata'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TEMPORARILY_CLOSED']).default('ACTIVE'),
    capacity: z.number().int().positive().optional(),
    coordinates: branchCoordinatesSchema.optional(),
    serviceModes: z
      .array(z.enum(['dine_in', 'takeaway', 'delivery']))
      .default(['dine_in', 'takeaway']),
  })
  .strict();

export const updateBranchSchema = createBranchSchema
  .partial()
  .omit({ restaurantId: true })
  .strict();

export const branchStatusSchema = z
  .object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TEMPORARILY_CLOSED']),
    reason: z.string().max(500).optional(),
  })
  .strict();

export const settingSchema = z
  .object({
    key: z.string().min(2).max(100).trim(),
    value: z.unknown(),
    scope: z.enum(['tenant', 'branch']).default('tenant'),
    branchId: z.string().optional(),
  })
  .strict();

export const restaurantQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ONBOARDING']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const branchQuerySchema = z.object({
  restaurantId: z.string().optional(),
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TEMPORARILY_CLOSED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type RestaurantStatusInput = z.infer<typeof restaurantStatusSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type BranchStatusInput = z.infer<typeof branchStatusSchema>;
export type SettingInput = z.infer<typeof settingSchema>;
export type RestaurantQueryInput = z.infer<typeof restaurantQuerySchema>;
export type BranchQueryInput = z.infer<typeof branchQuerySchema>;
