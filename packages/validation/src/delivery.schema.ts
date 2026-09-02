import { z } from 'zod';

export const deliveryAddressCreateSchema = z.object({
  label: z.string().min(1).max(50).default('Home'),
  recipientName: z.string().min(1).max(100),
  phone: z.string().min(8).max(20),
  addressLine1: z.string().min(3).max(200),
  addressLine2: z.string().max(200).optional(),
  landmark: z.string().max(100).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(3).max(20),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().optional().default(false),
});

export type DeliveryAddressCreateInput = z.infer<typeof deliveryAddressCreateSchema>;

export const deliveryServiceabilitySchema = z.object({
  branchId: z.string().min(1),
  postalCode: z.string().min(1),
  orderAmount: z.number().min(0).optional().default(0),
});

export type DeliveryServiceabilityInput = z.infer<typeof deliveryServiceabilitySchema>;

export const deliveryCheckoutSchema = z.object({
  branchId: z.string().min(1),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  deliveryAddress: deliveryAddressCreateSchema,
  deliveryInstructions: z.string().max(300).optional(),
  paymentMethod: z.enum(['cod', 'online']).default('cod'),
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
    .min(1, 'Cart cannot be empty for delivery'),
});

export type DeliveryCheckoutInput = z.infer<typeof deliveryCheckoutSchema>;

export const deliveryAssignDriverSchema = z.object({
  employeeId: z.string().min(1),
});

export type DeliveryAssignDriverInput = z.infer<typeof deliveryAssignDriverSchema>;

export const deliveryStatusUpdateSchema = z.object({
  status: z.enum([
    'placed',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'assigned',
    'picked_up',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'failed',
    'rejected',
  ]),
  notes: z.string().max(300).optional(),
});

export type DeliveryStatusUpdateInput = z.infer<typeof deliveryStatusUpdateSchema>;
