import { useState, useEffect } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { RecommendationItem } from '@x10think/types';

interface RecommendedForYouProps {
  context?: 'personalized' | 'popular' | 'trending';
  branchId?: string;
  onAddToCart?: (item: RecommendationItem) => void;
}

export function RecommendedForYou({
  context = 'popular',
  branchId,
  onAddToCart,
}: RecommendedForYouProps) {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchRecommendations();
  }, [context, branchId]);

  async function fetchRecommendations() {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get<{ data: RecommendationItem[] }>(
        `/recommendations?context=${context}${branchId ? `&branchId=${branchId}` : ''}&limit=4`,
      );
      setItems(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }

  async function handleItemClick(item: RecommendationItem) {
    try {
      await httpClient.post('/recommendations/events', {
        context,
        menuItemId: item.menuItemId,
        eventType: 'click',
        branchId,
      });
    } catch {
      // Non-blocking background event recording
    }
  }

  async function handleAddClick(item: RecommendationItem) {
    try {
      await httpClient.post('/recommendations/events', {
        context,
        menuItemId: item.menuItemId,
        eventType: 'add_to_cart',
        branchId,
      });
    } catch {
      // Non-blocking
    }
    if (onAddToCart) onAddToCart(item);
  }

  if (loading) {
    return <div className="p-4 text-xs text-slate-400">Loading recommended items...</div>;
  }

  if (error || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
          <span className="text-amber-400">✨</span>
          <span>
            {context === 'personalized' ? 'Recommended For You' : 'Popular at this Branch'}
          </span>
        </h3>
        <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          AI Suggested
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.menuItemId}
            onClick={() => void handleItemClick(item)}
            className="p-3 bg-slate-800/90 border border-slate-700 hover:border-amber-500/50 rounded-xl space-y-2 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-semibold">
                {item.explanationSignal}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ★ {(item.normalizedScore * 5).toFixed(1)}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs group-hover:text-amber-400 transition-colors">
                {item.itemName}
              </h4>
              <span className="text-[10px] text-slate-400">{item.categoryName}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-mono font-bold text-amber-400 text-xs">₹{item.price}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void handleAddClick(item);
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg transition-colors"
              >
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
