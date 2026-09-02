import { tableCreateSchema, qrTokenStatusSchema, qrCheckoutSchema } from '@x10think/validation';

export function runFrontendPhase20Tests() {
  // 1. Table Create schema validation
  const validTableCreate = tableCreateSchema.safeParse({
    branchId: '6a9668c4b2e062da23aec3f5',
    tableNumber: 'T-12',
    capacity: 6,
    section: 'Patio VIP',
  });
  if (!validTableCreate.success) {
    throw new Error('Expected validTableCreate.success to be true');
  }

  // 2. QR Token Status schema validation
  const validStatus = qrTokenStatusSchema.safeParse({
    status: 'inactive',
  });
  if (!validStatus.success) {
    throw new Error('Expected validStatus.success to be true');
  }

  // 3. QR Checkout schema validation
  const validCheckout = qrCheckoutSchema.safeParse({
    token: 'qr_tok_1234567890abcdef',
    guestName: 'Karan Mehra',
    items: [{ menuItemId: 'ITEM-101', quantity: 2, specialInstructions: 'No onions' }],
  });
  if (!validCheckout.success) {
    throw new Error('Expected validCheckout.success to be true');
  }

  return true;
}

runFrontendPhase20Tests();
