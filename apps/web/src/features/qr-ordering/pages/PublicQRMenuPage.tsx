import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { httpClient } from '@/shared/lib/http';
import { RecommendedForYou } from '@/features/recommendations/components/RecommendedForYou';
import { CartAddOnsWidget } from '@/features/recommendations/components/CartAddOnsWidget';
import type { PublicQRContext } from '@x10think/types';

interface MenuItem {
  menuItemId: string;
  itemName: string;
  categoryName: string;
  price: number;
  description: string;
  isAvailable: boolean;
}

interface CartItem {
  menuItemId: string;
  itemName: string;
  price: number;
  quantity: number;
}

export function PublicQRMenuPage() {
  const { token } = useParams<{ token: string }>();
  const [context, setContext] = useState<PublicQRContext | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) void loadQRMenu();
  }, [token]);

  async function loadQRMenu() {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get<{
        data: { context: PublicQRContext; categories: any[]; menuItems: MenuItem[] };
      }>(`/qr/menu/${token}`);
      setContext(response.data.data.context);
      setCategories([{ id: 'all', name: 'All' }, ...response.data.data.categories]);
      setMenuItems(response.data.data.menuItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired QR code.');
    } finally {
      setLoading(false);
    }
  }

  function addToCart(item: { menuItemId: string; itemName: string; price: number }) {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        { menuItemId: item.menuItemId, itemName: item.itemName, price: item.price, quantity: 1 },
      ];
    });
  }

  function updateQuantity(menuItemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  }

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = Math.round((subtotal + tax) * 100) / 100;

  async function handleCheckout() {
    if (cart.length === 0 || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await httpClient.post<{ data: any }>(`/qr/checkout/${token}`, {
        token,
        guestName: guestName.trim() || 'Guest Customer',
        items: cart.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      });
      setActiveOrder(response.data.data);
      setCart([]);
      setShowCart(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  }

  // Live status polling for active order
  useEffect(() => {
    if (!activeOrder?.orderId) return;
    const interval = setInterval(async () => {
      try {
        const response = await httpClient.get<{ data: any }>(
          `/qr/order/${activeOrder.orderId}/status`,
        );
        setActiveOrder(response.data.data);
      } catch {
        // Silent catch on poll failure
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeOrder?.orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs p-4">
        Validating QR Code & Loading Restaurant Menu...
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full flex items-center justify-center text-xl font-bold">
          ⚠️
        </div>
        <h2 className="text-lg font-bold text-white">QR Code Unavailable</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          {error || 'This QR Code is invalid, expired, or deactivated by restaurant staff.'}
        </p>
      </div>
    );
  }

  const filteredItems =
    selectedCategory === 'All'
      ? menuItems
      : menuItems.filter((i) => i.categoryName === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-24">
      {/* Mobile Branding Header */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
              DineX QR Order
            </span>
            <h1 className="text-lg font-extrabold text-white leading-none">
              {context.restaurantName}
            </h1>
            <span className="text-[11px] text-slate-400">{context.branchName}</span>
          </div>
          <div className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-right">
            <span className="text-[10px] text-amber-300 font-bold block">{context.section}</span>
            <span className="text-xs font-black text-amber-400">Table {context.tableNumber}</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-2 overflow-x-auto pt-2 scrollbar-none text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.name)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors ${
                selectedCategory === c.name
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main Menu Grid */}
      <main className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Integrated AI Recommended Widget */}
        <RecommendedForYou
          context="popular"
          onAddToCart={(rec) =>
            addToCart({ menuItemId: rec.menuItemId, itemName: rec.itemName, price: rec.price })
          }
        />

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white">Menu Items</h3>
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.menuItemId}
                className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between space-x-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs">{item.itemName}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.categoryName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{item.description}</p>
                  <span className="font-mono font-bold text-amber-400 text-xs block">
                    ₹{item.price}
                  </span>
                </div>

                <button
                  onClick={() => addToCart(item)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Float Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-slate-900/95 backdrop-blur border-t border-slate-800">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">
                {cart.reduce((a, i) => a + i.quantity, 0)} Items Selected
              </span>
              <span className="text-base font-black text-amber-400">₹{grandTotal}</span>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-colors flex items-center space-x-1.5"
            >
              <span>View Cart & Checkout</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer Modal */}
      {showCart && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">
                Your Order (Table {context.tableNumber})
              </h3>
              <button onClick={() => setShowCart(false)} className="text-slate-400 text-sm">
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 divide-y divide-slate-800 text-xs">
              {cart.map((item) => (
                <div key={item.menuItemId} className="pt-2 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{item.itemName}</div>
                    <div className="text-amber-400 font-mono">₹{item.price}</div>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="px-2 font-bold text-slate-300"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="px-2 font-bold text-slate-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Cart Add-Ons Widget */}
            <CartAddOnsWidget
              cartItemIds={cart.map((i) => i.menuItemId)}
              onAddAddOn={(addon) =>
                addToCart({
                  menuItemId: addon.menuItemId,
                  itemName: addon.itemName,
                  price: addon.price,
                })
              }
            />

            {/* Guest Name input */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-bold">
                Your Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
              />
            </div>

            {/* Totals */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST Tax (5%)</span>
                <span className="font-mono">₹{tax}</span>
              </div>
              <hr className="border-slate-800 my-1" />
              <div className="flex justify-between font-bold text-amber-400 text-sm">
                <span>Grand Total</span>
                <span className="font-mono">₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={() => void handleCheckout()}
              disabled={submitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition-colors"
            >
              {submitting ? 'Submitting Order to Kitchen...' : 'Confirm & Send Order to Kitchen'}
            </button>
          </div>
        </div>
      )}

      {/* Live Order Status Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center text-2xl">
            🍳
          </div>
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
              Order Received!
            </span>
            <h2 className="text-xl font-extrabold text-white">Order {activeOrder.orderNumber}</h2>
            <p className="text-xs text-slate-400">
              Table {activeOrder.tableNumber} • Grand Total ₹{activeOrder.grandTotal}
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm space-y-3 text-xs text-left">
            <span className="font-bold text-slate-300 block border-b border-slate-800 pb-1">
              Kitchen Live Status
            </span>
            {activeOrder.timeline ? (
              <div className="space-y-2 pt-1">
                {activeOrder.timeline.map((step: any) => (
                  <div key={step.key} className="flex items-center space-x-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        step.isCompleted
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {step.isCompleted ? '✓' : '•'}
                    </div>
                    <span
                      className={`text-xs ${
                        step.isCompleted ? 'text-white font-medium' : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded uppercase text-[10px]">
                    {activeOrder.status}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Items Placed</span>
                  <span className="text-white font-mono">
                    {activeOrder.items?.length || 0} items
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveOrder(null)}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
