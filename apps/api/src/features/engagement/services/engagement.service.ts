import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Review } from '../models/review.model';
import { Rating } from '../models/rating.model';
import { Coupon } from '../models/coupon.model';
import { LoyaltyTransaction } from '../models/loyalty.model';
import { Favorite } from '../models/favorite.model';
import { User } from '../../auth/models/auth.models';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import type {
  CreateReviewInput,
  ModerateReviewInput,
  CreateRatingInput,
  CreateCouponInput,
  ValidateCouponInput,
  AddFavoriteInput,
} from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

// REVIEWS & RATINGS
export async function createReview(input: CreateReviewInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';
  if (
    !mongoose.Types.ObjectId.isValid(input.branchId) ||
    !mongoose.Types.ObjectId.isValid(input.orderId)
  ) {
    throw new AppError('Invalid branch or order ID format.', 400, 'INVALID_ID');
  }

  const existing = await Review.findOne({
    tenantId,
    customerId: new mongoose.Types.ObjectId(actor.userId),
    orderId: new mongoose.Types.ObjectId(input.orderId),
  });

  if (existing) {
    throw new AppError(
      'A review has already been submitted for this order.',
      409,
      'REVIEW_ALREADY_EXISTS',
    );
  }

  const review = await Review.create({
    tenantId,
    branchId: new mongoose.Types.ObjectId(input.branchId),
    customerId: new mongoose.Types.ObjectId(actor.userId),
    orderId: new mongoose.Types.ObjectId(input.orderId),
    title: input.title,
    content: input.content,
    rating: input.rating,
    status: 'pending',
    submittedAt: new Date(),
  });

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'REVIEW_CREATED',
    targetType: 'review',
    targetId: review.id,
  });

  return review;
}

export async function moderateReview(
  reviewId: string,
  input: ModerateReviewInput,
  actor: UserAuthContext,
) {
  if (!mongoose.Types.ObjectId.isValid(reviewId))
    throw new AppError('Invalid review ID format.', 400, 'INVALID_ID');

  const review = await Review.findById(reviewId);
  if (!review) throw new AppError('Review not found.', 404, 'REVIEW_NOT_FOUND');

  review.status = input.status;
  if (input.reason) review.moderationReason = input.reason;
  await review.save();

  await logAuditEvent({
    tenantId: review.tenantId,
    actorId: actor.userId,
    action: 'REVIEW_MODERATED',
    targetType: 'review',
    targetId: review.id,
    metadata: { status: input.status, reason: input.reason },
  });

  return review;
}

export async function listReviews(branchId?: string, status = 'published') {
  const filter: Record<string, unknown> = { status };
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    filter.branchId = new mongoose.Types.ObjectId(branchId);
  }

  return Review.find(filter).sort({ submittedAt: -1 });
}

export async function submitRating(input: CreateRatingInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';
  if (
    !mongoose.Types.ObjectId.isValid(input.branchId) ||
    !mongoose.Types.ObjectId.isValid(input.orderId)
  ) {
    throw new AppError('Invalid branch or order ID format.', 400, 'INVALID_ID');
  }

  const existing = await Rating.findOne({
    tenantId,
    customerId: new mongoose.Types.ObjectId(actor.userId),
    orderId: new mongoose.Types.ObjectId(input.orderId),
  });

  if (existing) {
    throw new AppError('Rating already submitted for this order.', 409, 'RATING_ALREADY_EXISTS');
  }

  const rating = await Rating.create({
    tenantId,
    branchId: new mongoose.Types.ObjectId(input.branchId),
    customerId: new mongoose.Types.ObjectId(actor.userId),
    orderId: new mongoose.Types.ObjectId(input.orderId),
    overallScore: input.overallScore,
    dimensions: input.dimensions,
    status: 'active',
    submittedAt: new Date(),
  });

  return rating;
}

export async function calculateRatingSummary(branchId?: string) {
  const filter: Record<string, unknown> = { status: 'active' };
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    filter.branchId = new mongoose.Types.ObjectId(branchId);
  }

  const ratings = await Rating.find(filter);
  if (ratings.length === 0) {
    return { averageScore: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  let totalScore = 0;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const r of ratings) {
    totalScore += r.overallScore;
    distribution[r.overallScore] = (distribution[r.overallScore] || 0) + 1;
  }

  const averageScore = Math.round((totalScore / ratings.length) * 10) / 10;
  return { averageScore, count: ratings.length, distribution };
}

// COUPONS
export async function createCoupon(input: CreateCouponInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';

  const existing = await Coupon.findOne({ tenantId, code: input.code });
  if (existing) {
    throw new AppError(`Coupon code '${input.code}' already exists.`, 409, 'COUPON_CODE_EXISTS');
  }

  const coupon = await Coupon.create({
    tenantId,
    code: input.code,
    discountType: input.discountType,
    value: input.value,
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    minimumOrderAmount: input.minimumOrderAmount,
    maximumDiscountAmount: input.maximumDiscountAmount,
    usageLimit: input.usageLimit,
    perCustomerLimit: input.perCustomerLimit,
    branchIds: input.branchIds?.map((b) => new mongoose.Types.ObjectId(b)),
    status: input.status,
  });

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'COUPON_CREATED',
    targetType: 'coupon',
    targetId: coupon.id,
    metadata: { code: coupon.code, value: coupon.value },
  });

  return coupon;
}

export async function validateCoupon(input: ValidateCouponInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';

  const coupon = await Coupon.findOne({
    tenantId,
    code: input.code.toUpperCase(),
    status: 'active',
  });

  if (!coupon) {
    throw new AppError('Invalid or expired coupon code.', 422, 'COUPON_INVALID');
  }

  const now = new Date();
  if (now < coupon.startsAt || now > coupon.endsAt) {
    throw new AppError('Coupon is outside its validity period.', 422, 'COUPON_EXPIRED');
  }

  if (coupon.minimumOrderAmount && input.orderAmount < coupon.minimumOrderAmount) {
    throw new AppError(
      `Order total does not meet minimum order requirement of ₹${coupon.minimumOrderAmount}.`,
      422,
      'MINIMUM_ORDER_NOT_MET',
    );
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit reached.', 409, 'COUPON_USAGE_LIMIT_REACHED');
  }

  // Calculate discount amount server-side safely
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (input.orderAmount * coupon.value) / 100;
    if (coupon.maximumDiscountAmount && discountAmount > coupon.maximumDiscountAmount) {
      discountAmount = coupon.maximumDiscountAmount;
    }
  } else {
    discountAmount = coupon.value;
  }

  // Prevent negative final order total
  if (discountAmount > input.orderAmount) {
    discountAmount = input.orderAmount;
  }

  const finalAmount = Math.max(0, input.orderAmount - discountAmount);

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    value: coupon.value,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.round(finalAmount * 100) / 100,
  };
}

export async function listCoupons(actor: UserAuthContext) {
  const filter: Record<string, unknown> = {};
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) filter.tenantId = actor.tenantId;

  return Coupon.find(filter).sort({ createdAt: -1 });
}

// LOYALTY
export async function grantLoyaltyPoints(
  customerId: string,
  points: number,
  sourceType: string,
  sourceId: string,
  reason: string | undefined,
  actor: UserAuthContext,
) {
  if (!mongoose.Types.ObjectId.isValid(customerId))
    throw new AppError('Invalid customer ID format.', 400, 'INVALID_ID');

  const customer = await User.findById(customerId);
  if (!customer) throw new AppError('Customer user not found.', 404, 'USER_NOT_FOUND');

  const customerDoc = customer as any;
  const currentPoints = customerDoc.customerProfile?.loyalty?.points || 0;
  const newPoints = currentPoints + points;

  if (newPoints < 0) {
    throw new AppError('Insufficient loyalty points balance.', 409, 'INSUFFICIENT_LOYALTY_POINTS');
  }

  if (!customerDoc.customerProfile) {
    customerDoc.customerProfile = { loyalty: { points: 0 } };
  }
  if (!customerDoc.customerProfile.loyalty) {
    customerDoc.customerProfile.loyalty = { points: 0 };
  }

  customerDoc.customerProfile.loyalty.points = newPoints;
  await customerDoc.save();

  const txn = await LoyaltyTransaction.create({
    tenantId: customer.tenantId || 'tenant_default',
    customerId: customer._id,
    type: points >= 0 ? 'earn' : 'redeem',
    points,
    balanceAfter: newPoints,
    sourceType,
    sourceId,
    reason,
  });

  await logAuditEvent({
    tenantId: customer.tenantId || 'tenant_default',
    actorId: actor.userId,
    action: 'LOYALTY_MUTATED',
    targetType: 'loyalty',
    targetId: customer.id,
    metadata: { points, balanceAfter: newPoints },
  });

  return { balance: newPoints, transaction: txn };
}

export async function getLoyaltyBalance(customerId: string, _actor: UserAuthContext) {
  const customer = await User.findById(customerId);
  if (!customer) throw new AppError('Customer user not found.', 404, 'USER_NOT_FOUND');

  const customerDoc = customer as any;
  const points = customerDoc.customerProfile?.loyalty?.points || 0;
  const transactions = await LoyaltyTransaction.find({ customerId: customer._id })
    .sort({ createdAt: -1 })
    .limit(20);

  return { points, transactions };
}

// FAVORITES
export async function addFavorite(input: AddFavoriteInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';

  const existing = await Favorite.findOne({
    tenantId,
    customerId: new mongoose.Types.ObjectId(actor.userId),
    menuItemId: input.menuItemId,
  });

  if (existing) return existing;

  return Favorite.create({
    tenantId,
    customerId: new mongoose.Types.ObjectId(actor.userId),
    menuItemId: input.menuItemId,
    branchId: input.branchId ? new mongoose.Types.ObjectId(input.branchId) : undefined,
  });
}

export async function removeFavorite(menuItemId: string, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';
  await Favorite.deleteOne({
    tenantId,
    customerId: new mongoose.Types.ObjectId(actor.userId),
    menuItemId,
  });
  return { success: true };
}

export async function listFavorites(actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';
  return Favorite.find({
    tenantId,
    customerId: new mongoose.Types.ObjectId(actor.userId),
  }).sort({ createdAt: -1 });
}
