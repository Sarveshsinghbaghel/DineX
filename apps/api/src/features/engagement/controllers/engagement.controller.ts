import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as engagementService from '../services/engagement.service';
import {
  createReviewSchema,
  moderateReviewSchema,
  createRatingSchema,
  createCouponSchema,
  validateCouponSchema,
  addFavoriteSchema,
} from '@x10think/validation';

export async function createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createReviewSchema.parse(req.body);
    const result = await engagementService.createReview(body, req.user!);
    sendSuccessResponse(res, {
      statusCode: 201,
      message: 'Review submitted for moderation.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function moderateReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = moderateReviewSchema.parse(req.body);
    const result = await engagementService.moderateReview(
      req.params.reviewId as string,
      body,
      req.user!,
    );
    sendSuccessResponse(res, { message: 'Review moderated.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await engagementService.listReviews(
      req.query.branchId as string,
      (req.query.status as string) || 'published',
    );
    sendSuccessResponse(res, { message: 'Reviews retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function submitRating(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createRatingSchema.parse(req.body);
    const result = await engagementService.submitRating(body, req.user!);
    sendSuccessResponse(res, { statusCode: 201, message: 'Rating submitted.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getRatingSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await engagementService.calculateRatingSummary(req.query.branchId as string);
    sendSuccessResponse(res, { message: 'Rating summary calculated.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createCouponSchema.parse(req.body);
    const result = await engagementService.createCoupon(body, req.user!);
    sendSuccessResponse(res, {
      statusCode: 201,
      message: 'Coupon campaign created.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function validateCoupon(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validateCouponSchema.parse(req.body);
    const result = await engagementService.validateCoupon(body, req.user!);
    sendSuccessResponse(res, { message: 'Coupon validated.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await engagementService.listCoupons(req.user!);
    sendSuccessResponse(res, { message: 'Coupons listed.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getLoyaltyBalance(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await engagementService.getLoyaltyBalance(req.user!.userId, req.user!);
    sendSuccessResponse(res, { message: 'Loyalty balance retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function addFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = addFavoriteSchema.parse(req.body);
    const result = await engagementService.addFavorite(body, req.user!);
    sendSuccessResponse(res, {
      statusCode: 201,
      message: 'Item added to favorites.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function removeFavorite(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await engagementService.removeFavorite(
      req.params.menuItemId as string,
      req.user!,
    );
    sendSuccessResponse(res, { message: 'Item removed from favorites.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listFavorites(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await engagementService.listFavorites(req.user!);
    sendSuccessResponse(res, { message: 'Favorites listed.', data: result });
  } catch (err) {
    next(err);
  }
}
