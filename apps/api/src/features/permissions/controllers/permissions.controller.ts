import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as permissionsService from '../services/permissions.service';
import { createPermissionSchema, updatePermissionSchema } from '@x10think/validation';

export async function listPermissions(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { module, scope, status } = request.query;
    const permissions = await permissionsService.listPermissions({
      module: module as string,
      scope: scope as string,
      status: status as string,
    });
    sendSuccessResponse(response, {
      message: 'Permissions retrieved successfully.',
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPermission(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const permission = await permissionsService.getPermissionById(
      request.params.permissionId as string,
    );
    sendSuccessResponse(response, {
      message: 'Permission retrieved successfully.',
      data: permission,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRolePermissions(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const permissions = await permissionsService.getRolePermissions(
      request.params.roleId as string,
    );
    sendSuccessResponse(response, {
      message: 'Role permissions retrieved successfully.',
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPermission(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = createPermissionSchema.parse(request.body);
    const permission = await permissionsService.createPermission(body, request.user!);
    sendSuccessResponse(response, {
      statusCode: 201,
      message: 'Permission created successfully.',
      data: permission,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePermission(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = updatePermissionSchema.parse(request.body);
    const permission = await permissionsService.updatePermission(
      request.params.permissionId as string,
      body,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Permission updated successfully.',
      data: permission,
    });
  } catch (error) {
    next(error);
  }
}
