import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as branchService from '../services/branch.service';
import { getEffectiveSettings } from '../../settings/services/settings.service';
import {
  createBranchSchema,
  updateBranchSchema,
  branchStatusSchema,
  branchQuerySchema,
} from '@x10think/validation';

export async function createBranch(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = createBranchSchema.parse(request.body);
    const branch = await branchService.createBranch(body, request.user!);
    sendSuccessResponse(response, {
      statusCode: 201,
      message: 'Branch created successfully.',
      data: branch,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBranch(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const branch = await branchService.getBranchById(
      request.params.branchId as string,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Branch retrieved successfully.',
      data: branch,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBranch(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = updateBranchSchema.parse(request.body);
    const updated = await branchService.updateBranch(
      request.params.branchId as string,
      body,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Branch updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBranchStatus(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = branchStatusSchema.parse(request.body);
    const updated = await branchService.updateBranchStatus(
      request.params.branchId as string,
      body.status,
      body.reason,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Branch status updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBranchSettings(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const branch = await branchService.getBranchById(
      request.params.branchId as string,
      request.user!,
    );
    const settings = await getEffectiveSettings(branch.tenantId, branch.id);
    sendSuccessResponse(response, {
      message: 'Branch effective settings retrieved successfully.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBranchSettings(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const settings = await branchService.updateBranchSettings(
      request.params.branchId as string,
      request.body,
      request.user!,
    );
    sendSuccessResponse(response, {
      message: 'Branch settings updated successfully.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function listBranches(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = branchQuerySchema.parse(request.query);
    const result = await branchService.listBranches(query, request.user!);
    sendSuccessResponse(response, {
      message: 'Branches listed successfully.',
      data: result.branches,
    });
  } catch (error) {
    next(error);
  }
}
