import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as userRolesService from '../services/user-roles.service';
import { assignUserRolesSchema } from '@x10think/validation';

export async function assignUserRoles(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = assignUserRolesSchema.parse(request.body);
    const updatedUser = await userRolesService.assignRolesToUser(
      request.params.userId as string,
      body,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'User roles assigned successfully.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeUserRole(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const updatedUser = await userRolesService.removeRoleFromUser(
      request.params.userId as string,
      request.params.roleId as string,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'User role removed successfully.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}
