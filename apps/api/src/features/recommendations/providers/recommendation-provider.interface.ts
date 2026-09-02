import type {
  RecommendationContext,
  RecommendationItem,
  StaffRecommendationInsight,
} from '@x10think/types';

export interface ProviderQueryOptions {
  tenantId?: string;
  branchId?: string;
  customerId?: string;
  menuItemId?: string;
  cartItemIds?: string[];
  limit?: number;
}

export interface RecommendationProvider {
  name: string;
  getRecommendations(
    context: RecommendationContext,
    options: ProviderQueryOptions,
  ): Promise<RecommendationItem[]>;
  getStaffInsights(options: ProviderQueryOptions): Promise<StaffRecommendationInsight[]>;
}
