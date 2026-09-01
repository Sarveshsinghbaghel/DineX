import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as rolesService from '../services/roles.service';
import { createRoleSchema, updateRoleSchema, assignPermissionsSchema } from '@x10think/validation';

export async function listRoles(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const roles = await rolesService.listRoles(request.user?.tenantId);
    sendSuccessResponse(response, {
      message: 'Roles retrieved successfully.',
      data: roles,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRole(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const role = await rolesService.getRoleById(request.params.roleId as string);
    sendSuccessResponse(response, {
      message: 'Role retrieved successfully.',
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

export async function createRole(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const body = createRoleSchema.parse(request.body);
    const role = await rolesService.createRole(body, request.user!);
    sendSuccessResponse(response, {
      statusCode: 201,
      message: 'Role created successfully.',
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRole(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const body = updateRoleSchema.parse(request.body);
    const role = await rolesService.updateRole(request.params.roleId as string, body, request.user!);
    sendSuccessResponse(response, {
      message: 'Role updated successfully.',
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRole(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    await rolesService.deleteRole(request.params.roleId as string, request.user!);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function assignPermissions(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const { permissionIds } = assignPermissionsSchema.parse(request.body);
    const role = await rolesService.assignPermissionsToRole(
      request.params.roleId as string,
      permissionIds,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Permissions assigned to role successfully.',
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

export async function removePermission(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const role = await rolesService.removePermissionFromRole(
      request.params.roleId as string,
      request.params.permissionId as string,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Permission removed from role successfully.',
      data: role,
    });
  } catch (error) {
    next(error);
  }
}
