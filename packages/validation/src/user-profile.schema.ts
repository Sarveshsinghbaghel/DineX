import { z } from 'zod';

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid E.164 phone number format (e.g. +1234567890)')
  .optional()
  .or(z.literal(''));

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(60).trim().optional(),
    lastName: z.string().min(1, 'Last name is required').max(60).trim().optional(),
    phone: phoneSchema,
    locale: z.string().min(2).max(10).trim().optional(),
    timezone: z.string().min(2).max(50).trim().optional(),
  })
  .strict();

export const addressSchema = z
  .object({
    label: z.string().min(1, 'Label is required (e.g., Home, Work)').max(50).trim(),
    recipientName: z.string().min(1, 'Recipient name is required').max(100).trim(),
    phone: z.string().min(5, 'Valid phone number is required').max(20).trim(),
    addressLine1: z.string().min(3, 'Address line 1 is required').max(150).trim(),
    addressLine2: z.string().max(150).trim().optional(),
    landmark: z.string().max(100).trim().optional(),
    city: z.string().min(2, 'City is required').max(60).trim(),
    state: z.string().min(2, 'State is required').max(60).trim(),
    postalCode: z.string().min(3, 'Postal code is required').max(20).trim(),
    country: z.string().min(2, 'Country is required').max(60).trim().default('India'),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    isDefault: z.boolean().default(false),
  })
  .strict();

export const updateAddressSchema = addressSchema.partial().strict();

export const notificationChannelsSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  push: z.boolean().default(true),
});

export const preferencesSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    language: z.string().min(2).max(10).default('en'),
    marketingPreferences: notificationChannelsSchema.partial().optional(),
    orderNotifications: notificationChannelsSchema.partial().optional(),
    reservationNotifications: notificationChannelsSchema.partial().optional(),
    dietaryPreferences: z.array(z.string().max(50)).max(20).optional(),
  })
  .strict();

export const adminUpdateUserSchema = z
  .object({
    profile: z
      .object({
        firstName: z.string().min(1).max(60).trim().optional(),
        lastName: z.string().min(1).max(60).trim().optional(),
      })
      .optional(),
    phone: phoneSchema,
    locale: z.string().min(2).max(10).optional(),
    timezone: z.string().min(2).max(50).optional(),
    branchIds: z.array(z.string()).optional(),
  })
  .strict();

export const userStatusSchema = z
  .object({
    status: z.enum(['active', 'inactive', 'suspended', 'pending_verification', 'locked']),
    reason: z.string().max(500).optional(),
  })
  .strict();

export const userQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.string().trim().optional(),
  accountStatus: z
    .enum(['active', 'inactive', 'suspended', 'pending_verification', 'locked'])
    .optional(),
  emailVerified: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : val),
    z.boolean().optional(),
  ),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type UserStatusInput = z.infer<typeof userStatusSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
