import { z } from 'zod';

export const recommendationQuerySchema = z.object({
  context: z
    .enum(['personalized', 'popular', 'frequently_ordered', 'trending', 'similar', 'cart_addons'])
    .default('popular'),
  branchId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
  menuItemId: z.string().optional(),
});

export type RecommendationQueryInput = z.infer<typeof recommendationQuerySchema>;

export const cartRecommendationSchema = z.object({
  branchId: z.string().optional(),
  cartItemIds: z.array(z.string()).default([]),
  limit: z.coerce.number().int().min(1).max(10).default(4),
});

export type CartRecommendationInput = z.infer<typeof cartRecommendationSchema>;

export const recommendationEventSchema = z.object({
  recommendationId: z.string().optional(),
  context: z.enum([
    'personalized',
    'popular',
    'frequently_ordered',
    'trending',
    'similar',
    'cart_addons',
  ]),
  menuItemId: z.string().min(1),
  eventType: z.enum(['impression', 'click', 'add_to_cart', 'purchased', 'dismissed']),
  branchId: z.string().optional(),
});

export type RecommendationEventInput = z.infer<typeof recommendationEventSchema>;
