import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as recommendationsService from '../services/recommendations.service';
import {
  recommendationQuerySchema,
  cartRecommendationSchema,
  recommendationEventSchema,
} from '@x10think/validation';

export async function getRecommendations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = recommendationQuerySchema.parse(req.query);
    const result = await recommendationsService.getRecommendations(query, req.user);
    sendSuccessResponse(res, { message: 'Menu recommendations retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getCartRecommendations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = cartRecommendationSchema.parse({ ...req.query, ...req.body });
    const result = await recommendationsService.getCartRecommendations(body, req.user);
    sendSuccessResponse(res, { message: 'Cart add-on recommendations retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getStaffInsights(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const branchId = typeof req.query.branchId === 'string' ? req.query.branchId : undefined;
    const result = await recommendationsService.getStaffInsights(req.user!, branchId);
    sendSuccessResponse(res, { message: 'Staff recommendation insights retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function trackRecommendationEvent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = recommendationEventSchema.parse(req.body);
    const result = await recommendationsService.trackRecommendationEvent(body, req.user);
    sendSuccessResponse(res, {
      statusCode: 201,
      message: 'Recommendation event recorded.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
