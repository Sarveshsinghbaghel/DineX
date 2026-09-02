import { useState, useEffect, type FormEvent } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { Review, Coupon, Favorite } from '@x10think/types';

export function CustomerEngagementPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'reviews' | 'coupons' | 'loyalty' | 'favorites'>(
    'reviews',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Coupon validation form state
  const [couponCode, setCouponCode] = useState('');
  const [orderAmount, setOrderAmount] = useState<number>(500);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    void fetchEngagementData();
  }, []);

  async function fetchEngagementData() {
    setLoading(true);
    setError(null);
    try {
      const [revRes, coupRes, favRes, loyRes] = await Promise.all([
        httpClient.get<{ data: Review[] }>('/engagement/reviews'),
        httpClient.get<{ data: Coupon[] }>('/engagement/coupons'),
        httpClient.get<{ data: Favorite[] }>('/engagement/favorites'),
        httpClient.get<{ data: { points: number } }>('/engagement/loyalty'),
      ]);

      setReviews(Array.isArray(revRes.data.data) ? revRes.data.data : []);
      setCoupons(Array.isArray(coupRes.data.data) ? coupRes.data.data : []);
      setFavorites(Array.isArray(favRes.data.data) ? favRes.data.data : []);
      setLoyaltyPoints(loyRes.data.data?.points || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer engagement data');
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateCoupon(e: FormEvent) {
    e.preventDefault();
    setValidating(true);
    setError(null);
    setValidationResult(null);
    try {
      const response = await httpClient.post<{ data: any }>('/engagement/coupons/validate', {
        code: couponCode,
        branchId: '6a9668c4b2e062da23aec3f5',
        orderAmount,
      });
      setValidationResult(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coupon validation failed');
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Engagement</h1>
          <p className="text-xs text-slate-400">
            Customer feedback reviews, ratings, discount coupons, loyalty points, and saved
            favorites.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs">
          <span className="text-lg">⭐</span>
          <div>
            <span className="block text-[10px] text-slate-400">My Loyalty Balance</span>
            <strong className="text-amber-400 font-bold">{loyaltyPoints} Points</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
            activeTab === 'reviews'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Customer Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
            activeTab === 'coupons'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Coupons & Discounts ({coupons.length})
        </button>
        <button
          onClick={() => setActiveTab('loyalty')}
          className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
            activeTab === 'loyalty'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Loyalty Rewards
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
            activeTab === 'favorites'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Favorites ({favorites.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-xs space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading engagement modules...</div>
        ) : activeTab === 'reviews' ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Published Reviews & Ratings</h3>
            {reviews.length === 0 ? (
              <p className="text-slate-400">No published reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{r.customerName || 'Customer'}</span>
                      <span className="text-amber-400 font-bold">★ {r.rating || 5}/5</span>
                    </div>
                    {r.title && <h5 className="font-bold text-amber-300 text-xs">{r.title}</h5>}
                    <p className="text-slate-300 text-xs">{r.content}</p>
                    <span className="block text-[10px] text-slate-400">
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'coupons' ? (
          <div className="space-y-6">
            {/* Coupon Validator */}
            <form
              onSubmit={(e) => void handleValidateCoupon(e)}
              className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3 max-w-md"
            >
              <h3 className="font-bold text-white text-sm">Coupon Code Validator</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Coupon Code</label>
                  <input
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Order Total (₹)</label>
                  <input
                    type="number"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={validating}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors"
              >
                {validating ? 'Validating...' : 'Validate Code'}
              </button>

              {validationResult && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 space-y-1">
                  <div>
                    ✔ Coupon{' '}
                    <strong className="font-mono text-white">{validationResult.code}</strong>{' '}
                    Applied!
                  </div>
                  <div>
                    Discount Amount: <strong>₹{validationResult.discountAmount}</strong>
                  </div>
                  <div>
                    Final Order Total:{' '}
                    <strong className="text-amber-400">₹{validationResult.finalAmount}</strong>
                  </div>
                </div>
              )}
            </form>

            <h3 className="text-sm font-bold text-white">Active Promotional Campaigns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map((c) => (
                <div
                  key={c._id}
                  className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold rounded">
                      {c.code}
                    </span>
                    <span className="text-slate-300 font-bold">
                      {c.discountType === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Min Order: ₹{c.minimumOrderAmount || 0} • Expires:{' '}
                    {new Date(c.endsAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'loyalty' ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Loyalty Points Balance & Rewards</h3>
            <div className="p-6 bg-slate-900 border border-slate-700 rounded-xl text-center space-y-2 max-w-sm">
              <span className="text-3xl">🎁</span>
              <h4 className="text-2xl font-bold text-amber-400">{loyaltyPoints} Points</h4>
              <p className="text-slate-400 text-xs">
                Earn 1 point for every ₹100 spent. Redeem points on upcoming orders!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">My Favorite Items</h3>
            {favorites.length === 0 ? (
              <p className="text-slate-400">No favorite items saved yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {favorites.map((f) => (
                  <div
                    key={f._id}
                    className="p-3 bg-slate-900 border border-slate-700 rounded-xl font-semibold text-white"
                  >
                    ❤️ Item #{f.menuItemId}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
