import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { RecommendationEvent } from '../models/recommendation-event.model';
import { RuleBasedRecommendationProvider } from '../providers/rule-based.provider';
import type { RecommendationProvider } from '../providers/recommendation-provider.interface';
import type {
  RecommendationQueryInput,
  CartRecommendationInput,
  RecommendationEventInput,
} from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

// Configured Recommendation Engine Provider (defaults to RuleBasedEngine)
let activeProvider: RecommendationProvider = new RuleBasedRecommendationProvider();

export function setRecommendationProvider(provider: RecommendationProvider) {
  activeProvider = provider;
}

export function getActiveRecommendationProvider(): RecommendationProvider {
  return activeProvider;
}

function checkBranchScope(actor: UserAuthContext, branchId?: string) {
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (isSuperAdmin) return;

  const isManager = actor.roles.some((r) => r.code === 'manager');
  const isAdmin = actor.roles.some((r) => r.code === 'admin');

  if (isManager && !isAdmin && branchId && actor.branchIds && actor.branchIds.length > 0) {
    if (!actor.branchIds.includes(branchId)) {
      throw new AppError('Access denied: branch scope violation.', 403, 'BRANCH_SCOPE_DENIED');
    }
  }
}

export async function getRecommendations(query: RecommendationQueryInput, actor?: UserAuthContext) {
  const tenantId = actor?.tenantId || 'tenant_default';

  return activeProvider.getRecommendations(query.context, {
    tenantId,
    branchId: query.branchId,
    customerId: actor?.userId,
    menuItemId: query.menuItemId,
    limit: query.limit,
  });
}

export async function getCartRecommendations(
  input: CartRecommendationInput,
  actor?: UserAuthContext,
) {
  const tenantId = actor?.tenantId || 'tenant_default';

  return activeProvider.getRecommendations('cart_addons', {
    tenantId,
    branchId: input.branchId,
    customerId: actor?.userId,
    cartItemIds: input.cartItemIds,
    limit: input.limit,
  });
}

export async function getStaffInsights(actor: UserAuthContext, branchId?: string) {
  checkBranchScope(actor, branchId);
  const tenantId = actor.tenantId || 'tenant_default';

  return activeProvider.getStaffInsights({
    tenantId,
    branchId,
  });
}

export async function trackRecommendationEvent(
  input: RecommendationEventInput,
  actor?: UserAuthContext,
) {
  const tenantId = actor?.tenantId || 'tenant_default';

  const eventDoc = await RecommendationEvent.create({
    tenantId,
    branchId:
      input.branchId && mongoose.Types.ObjectId.isValid(input.branchId)
        ? new mongoose.Types.ObjectId(input.branchId)
        : undefined,
    userId:
      actor?.userId && mongoose.Types.ObjectId.isValid(actor.userId)
        ? new mongoose.Types.ObjectId(actor.userId)
        : undefined,
    recommendationId: input.recommendationId,
    context: input.context,
    menuItemId: input.menuItemId,
    eventType: input.eventType,
  });

  return eventDoc;
}
