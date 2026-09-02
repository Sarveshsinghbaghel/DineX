import { z } from 'zod';

export const createReviewSchema = z
  .object({
    branchId: z.string().min(1, 'Branch ID is required'),
    orderId: z.string().min(1, 'Order ID is required'),
    title: z.string().max(100).optional(),
    content: z.string().min(10, 'Review content must be at least 10 characters').max(2000).trim(),
    rating: z.number().int().min(1).max(5).optional(),
  })
  .strict();

export const moderateReviewSchema = z
  .object({
    status: z.enum(['published', 'hidden', 'rejected']),
    reason: z.string().max(250).optional(),
  })
  .strict();

export const createRatingSchema = z
  .object({
    branchId: z.string().min(1, 'Branch ID is required'),
    orderId: z.string().min(1, 'Order ID is required'),
    overallScore: z.number().int().min(1).max(5),
    dimensions: z
      .object({
        food: z.number().int().min(1).max(5).optional(),
        service: z.number().int().min(1).max(5).optional(),
        ambience: z.number().int().min(1).max(5).optional(),
        delivery: z.number().int().min(1).max(5).optional(),
      })
      .optional(),
  })
  .strict();

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Coupon code is required')
      .max(20)
      .trim()
      .transform((val) => val.toUpperCase()),
    discountType: z.enum(['percentage', 'fixed_amount']),
    value: z.number().positive('Discount value must be positive'),
    startsAt: z.string(),
    endsAt: z.string(),
    minimumOrderAmount: z.number().nonnegative().optional(),
    maximumDiscountAmount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    perCustomerLimit: z.number().int().positive().default(1),
    branchIds: z.array(z.string()).optional(),
    status: z.enum(['draft', 'active', 'inactive', 'expired']).default('active'),
  })
  .strict();

export const validateCouponSchema = z
  .object({
    code: z.string().min(1, 'Coupon code is required').trim(),
    branchId: z.string().min(1, 'Branch ID is required'),
    orderAmount: z.number().positive('Order amount must be positive'),
  })
  .strict();

export const addFavoriteSchema = z
  .object({
    menuItemId: z.string().min(1, 'Menu Item ID is required'),
    branchId: z.string().optional(),
  })
  .strict();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
export type CreateRatingInput = z.infer<typeof createRatingSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
