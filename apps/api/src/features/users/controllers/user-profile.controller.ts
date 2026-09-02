import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as userProfileService from '../services/user-profile.service';
import {
  updateProfileSchema,
  addressSchema,
  updateAddressSchema,
  preferencesSchema,
  adminUpdateUserSchema,
  userStatusSchema,
  userQuerySchema,
} from '@x10think/validation';
import { AppError } from '../../../errors/AppError';

export async function getOwnProfile(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await userProfileService.getOwnProfile(request.user!.userId);
    sendSuccessResponse(response, {
      message: 'User profile retrieved successfully.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOwnProfile(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = updateProfileSchema.parse(request.body);
    const updated = await userProfileService.updateOwnProfile(
      request.user!.userId,
      body,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Profile updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadAvatar(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let buffer: Buffer;
    let mimeType = 'image/jpeg';

    if (
      request.body &&
      typeof request.body.data === 'string' &&
      typeof request.body.mimeType === 'string'
    ) {
      mimeType = request.body.mimeType;
      const base64Data = request.body.data.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(request.body)) {
      buffer = request.body;
      mimeType = request.get('content-type') ?? 'image/jpeg';
    } else {
      throw new AppError(
        'Invalid image upload payload. Provide base64 data and mimeType.',
        400,
        'INVALID_PAYLOAD',
      );
    }

    const avatar = await userProfileService.uploadAvatar(
      request.user!.userId,
      buffer,
      mimeType,
      request.user!,
    );
    sendSuccessResponse(response, {
      statusCode: 201,
      message: 'Avatar uploaded successfully.',
      data: avatar,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAvatar(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await userProfileService.deleteAvatar(request.user!.userId, request.user!);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getAddresses(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const addresses = await userProfileService.getAddresses(request.user!.userId);
    sendSuccessResponse(response, {
      message: 'Addresses retrieved successfully.',
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
}

export async function addAddress(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = addressSchema.parse(request.body);
    const newAddress = await userProfileService.addAddress(
      request.user!.userId,
      body,
      request.user!,
    );
    sendSuccessResponse(response, {
      statusCode: 201,
      message: 'Address added successfully.',
      data: newAddress,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAddress(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = updateAddressSchema.parse(request.body);
    const updated = await userProfileService.updateAddress(
      request.user!.userId,
      request.params.addressId as string,
      body,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Address updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAddress(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await userProfileService.deleteAddress(
      request.user!.userId,
      request.params.addressId as string,
      request.user!,
    );
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getPreferences(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const preferences = await userProfileService.getPreferences(request.user!.userId);
    sendSuccessResponse(response, {
      message: 'Preferences retrieved successfully.',
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePreferences(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = preferencesSchema.parse(request.body);
    const updated = await userProfileService.updatePreferences(
      request.user!.userId,
      body,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Preferences updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminListUsers(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = userQuerySchema.parse(request.query);
    const result = await userProfileService.adminListUsers(query, request.user!);
    sendSuccessResponse(response, {
      message: 'Users retrieved successfully.',
      data: result.users,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminGetUser(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userProfileService.adminGetUserById(
      request.params.userId as string,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'User detail retrieved successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateUser(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = adminUpdateUserSchema.parse(request.body);
    const updated = await userProfileService.adminUpdateUser(
      request.params.userId as string,
      body,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'User updated successfully by admin.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateUserStatus(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = userStatusSchema.parse(request.body);
    const updated = await userProfileService.adminUpdateUserStatus(
      request.params.userId as string,
      body.status,
      body.reason,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'User account status updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
