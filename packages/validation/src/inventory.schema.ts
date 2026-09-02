import { z } from 'zod';

export const ingredientUnitSchema = z.enum(['g', 'kg', 'ml', 'l', 'unit', 'pack']);

export const createIngredientSchema = z
  .object({
    name: z.string().min(2, 'Ingredient name is required').max(100).trim(),
    sku: z
      .string()
      .min(2, 'SKU is required')
      .max(30)
      .trim()
      .transform((val) => val.toUpperCase()),
    baseUnit: ingredientUnitSchema,
    category: z.string().max(50).optional(),
    preferredSupplierId: z.string().optional(),
    reorderUnit: ingredientUnitSchema.optional(),
    allergenInfo: z.array(z.string().max(50)).optional(),
    yieldFactor: z.number().min(0.01).max(1.0).default(1.0),
    status: z.enum(['active', 'inactive', 'archived']).default('active'),
  })
  .strict();

export const updateIngredientSchema = createIngredientSchema.partial().strict();

export const stockMutationSchema = z
  .object({
    ingredientId: z.string().min(1, 'Ingredient ID is required'),
    branchId: z.string().min(1, 'Branch ID is required'),
    quantity: z.number().positive('Quantity must be greater than zero'),
    unitCost: z.number().nonnegative().optional(),
    reason: z.string().max(250).trim().optional(),
    sourceType: z.string().max(50).default('manual_adjustment'),
    sourceId: z.string().optional(),
  })
  .strict();

export const initInventorySchema = z
  .object({
    branchId: z.string().min(1, 'Branch ID is required'),
    ingredientId: z.string().min(1, 'Ingredient ID is required'),
    currentQuantity: z.number().nonnegative().default(0),
    reorderLevel: z.number().nonnegative().default(10),
    minQuantity: z.number().nonnegative().optional(),
    maxQuantity: z.number().positive().optional(),
    unit: ingredientUnitSchema,
    storageLocation: z.string().max(100).optional(),
  })
  .strict();

export const updateInventoryThresholdsSchema = z
  .object({
    reorderLevel: z.number().nonnegative().optional(),
    minQuantity: z.number().nonnegative().optional(),
    maxQuantity: z.number().positive().optional(),
    storageLocation: z.string().max(100).optional(),
  })
  .strict();

export const createSupplierSchema = z
  .object({
    name: z.string().min(2, 'Supplier name is required').max(100).trim(),
    supplierCode: z
      .string()
      .max(20)
      .optional()
      .transform((val) => (val ? val.toUpperCase() : val)),
    status: z.enum(['active', 'inactive', 'blocked']).default('active'),
    contacts: z
      .array(
        z.object({
          name: z.string().min(2).max(100),
          phone: z.string().min(5).max(20),
          email: z.string().email().optional().or(z.literal('')),
          isPrimary: z.boolean().default(false),
        }),
      )
      .min(1, 'At least one contact is required'),
    taxRegistration: z.string().max(30).optional(),
    paymentTermsDays: z.number().int().nonnegative().default(0),
    ingredientIds: z.array(z.string()).optional(),
    notes: z.string().max(500).optional(),
  })
  .strict();

export const updateSupplierSchema = createSupplierSchema.partial().strict();

export const createPurchaseOrderItemSchema = z
  .object({
    ingredientId: z.string().min(1, 'Ingredient ID is required'),
    orderedQuantity: z.number().positive('Ordered quantity must be positive'),
    unit: ingredientUnitSchema,
    unitCost: z.number().nonnegative('Unit cost must be non-negative'),
    taxRate: z.number().min(0).max(100).default(0),
  })
  .strict();

export const createPurchaseOrderSchema = z
  .object({
    branchId: z.string().min(1, 'Branch ID is required'),
    supplierId: z.string().min(1, 'Supplier ID is required'),
    expectedDeliveryAt: z.string().optional(),
    notes: z.string().max(500).optional(),
    items: z.array(createPurchaseOrderItemSchema).min(1, 'At least one item is required'),
  })
  .strict();

export const receivePurchaseOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          ingredientId: z.string().min(1),
          receivedQuantity: z.number().nonnegative(),
        }),
      )
      .min(1),
    notes: z.string().max(250).optional(),
  })
  .strict();

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
export type StockMutationInput = z.infer<typeof stockMutationSchema>;
export type InitInventoryInput = z.infer<typeof initInventorySchema>;
export type UpdateInventoryThresholdsInput = z.infer<typeof updateInventoryThresholdsSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;
