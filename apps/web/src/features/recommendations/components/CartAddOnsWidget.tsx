import { useState, useEffect } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { RecommendationItem } from '@x10think/types';

interface CartAddOnsWidgetProps {
  cartItemIds: string[];
  branchId?: string;
  onAddAddOn?: (item: RecommendationItem) => void;
}

export function CartAddOnsWidget({ cartItemIds, branchId, onAddAddOn }: CartAddOnsWidgetProps) {
  const [addOns, setAddOns] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchCartAddOns();
  }, [cartItemIds.join(','), branchId]);

  async function fetchCartAddOns() {
    setLoading(true);
    try {
      const response = await httpClient.post<{ data: RecommendationItem[] }>(
        '/recommendations/cart',
        {
          cartItemIds,
          branchId,
          limit: 3,
        },
      );
      setAddOns(response.data.data);
    } catch {
      setAddOns([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddClick(item: RecommendationItem) {
    try {
      await httpClient.post('/recommendations/events', {
        context: 'cart_addons',
        menuItemId: item.menuItemId,
        eventType: 'add_to_cart',
        branchId,
      });
    } catch {
      // Non-blocking
    }
    if (onAddAddOn) onAddAddOn(item);
  }

  if (loading || addOns.length === 0) return null;

  return (
    <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
          <span>🛒 Complete Your Order</span>
        </h4>
        <span className="text-[10px] text-slate-400">Frequently Bought Together</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {addOns.map((item) => (
          <div
            key={item.menuItemId}
            className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-white text-xs">{item.itemName}</div>
              <div className="text-amber-400 font-mono text-[11px]">₹{item.price}</div>
            </div>
            <button
              onClick={() => void handleAddClick(item)}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded transition-colors"
            >
              + Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
