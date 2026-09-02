import { z } from 'zod';

export const tableCreateSchema = z.object({
  branchId: z.string().min(1),
  tableNumber: z.string().min(1).max(20),
  capacity: z.coerce.number().int().min(1).max(50).default(4),
  section: z.string().default('Main Dining'),
});

export type TableCreateInput = z.infer<typeof tableCreateSchema>;

export const tableUpdateSchema = z.object({
  tableNumber: z.string().min(1).max(20).optional(),
  capacity: z.coerce.number().int().min(1).max(50).optional(),
  section: z.string().optional(),
  status: z.enum(['available', 'occupied', 'reserved', 'cleaning', 'maintenance']).optional(),
});

export type TableUpdateInput = z.infer<typeof tableUpdateSchema>;

export const qrTokenStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

export type QRTokenStatusInput = z.infer<typeof qrTokenStatusSchema>;

export const qrCheckoutSchema = z.object({
  token: z.string().min(1),
  guestName: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
        variant: z.string().optional(),
        selectedAddOns: z
          .array(
            z.object({
              name: z.string().min(1),
              price: z.number().min(0),
            }),
          )
          .optional(),
        specialInstructions: z.string().max(200).optional(),
      }),
    )
    .min(1, 'Cart cannot be empty'),
});

export type QRCheckoutInput = z.infer<typeof qrCheckoutSchema>;
