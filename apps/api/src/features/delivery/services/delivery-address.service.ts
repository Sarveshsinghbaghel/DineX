import type { UserAuthContext } from '../../../middlewares/authorization.middleware';
import * as userProfileService from '../../users/services/user-profile.service';
import type { DeliveryAddressCreateInput } from '@x10think/validation';

export async function addCustomerDeliveryAddress(
  actor: UserAuthContext,
  input: DeliveryAddressCreateInput,
) {
  return userProfileService.addAddress(
    actor.userId,
    {
      label: input.label,
      recipientName: input.recipientName,
      phone: input.phone,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      landmark: input.landmark,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: 'India',
      latitude: input.latitude,
      longitude: input.longitude,
      isDefault: input.isDefault,
    },
    actor,
  );
}

export async function listCustomerDeliveryAddresses(actor: UserAuthContext) {
  return userProfileService.getAddresses(actor.userId);
}

export async function deleteCustomerDeliveryAddress(actor: UserAuthContext, addressId: string) {
  return userProfileService.deleteAddress(actor.userId, addressId, actor);
}
