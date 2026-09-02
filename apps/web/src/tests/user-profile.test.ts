import {
  updateProfileSchema,
  addressSchema,
  preferencesSchema,
  userStatusSchema,
} from '@x10think/validation';

export function runFrontendUserProfileTests() {
  // 1. Validates updateProfileSchema
  const validProfile = updateProfileSchema.safeParse({
    firstName: 'Alice',
    lastName: 'Wong',
    phone: '+919876543210',
  });
  if (!validProfile.success) {
    throw new Error('Expected validProfile.success to be true');
  }

  const invalidPhone = updateProfileSchema.safeParse({
    phone: 'invalid-phone-string',
  });
  if (invalidPhone.success) {
    throw new Error('Expected invalidPhone.success to be false');
  }

  // 2. Validates addressSchema
  const validAddress = addressSchema.safeParse({
    label: 'Home',
    recipientName: 'Alice Wong',
    phone: '+919876543210',
    addressLine1: '123 Tech Park',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    isDefault: true,
  });
  if (!validAddress.success) {
    throw new Error('Expected validAddress.success to be true');
  }

  // 3. Validates preferencesSchema
  const validPrefs = preferencesSchema.safeParse({
    theme: 'dark',
    language: 'en',
    marketingPreferences: { email: false, sms: false, push: true },
    dietaryPreferences: ['Vegan', 'Gluten-Free'],
  });
  if (!validPrefs.success) {
    throw new Error('Expected validPrefs.success to be true');
  }

  // 4. Validates userStatusSchema
  const validStatus = userStatusSchema.safeParse({
    status: 'suspended',
    reason: 'Account under review',
  });
  if (!validStatus.success) {
    throw new Error('Expected validStatus.success to be true');
  }

  return true;
}

runFrontendUserProfileTests();
