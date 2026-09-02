import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpClient } from '@/shared/lib/http';
import type { DeliveryServiceabilityResult } from '@x10think/types';

interface CartItem {
  menuItemId: string;
  itemName: string;
  price: number;
  quantity: number;
}

const DEMO_MENU = [
  { menuItemId: 'ITEM-101', itemName: 'Butter Chicken Special', price: 420 },
  { menuItemId: 'ITEM-102', itemName: 'Paneer Tikka Masala', price: 350 },
  { menuItemId: 'ITEM-103', itemName: 'Garlic Naan Basket', price: 120 },
  { menuItemId: 'ITEM-104', itemName: 'Jeera Rice Bowl', price: 160 },
];

export function DeliveryCheckoutPage() {
  const navigate = useNavigate();
  const branchId = '66a97adac596b27daa0d5ecf9';
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [postalCode, setPostalCode] = useState('110001');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [cart, setCart] = useState<CartItem[]>([
    { menuItemId: 'ITEM-101', itemName: 'Butter Chicken Special', price: 420, quantity: 1 },
    { menuItemId: 'ITEM-103', itemName: 'Garlic Naan Basket', price: 120, quantity: 2 },
  ]);
  const [serviceability, setServiceability] = useState<DeliveryServiceabilityResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const deliveryFee = serviceability?.deliveryFee || 0;
  const grandTotal = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

  useEffect(() => {
    if (postalCode && branchId) {
      void checkServiceability();
    }
  }, [postalCode, branchId, subtotal]);

  async function checkServiceability() {
    setChecking(true);
    try {
      const response = await httpClient.post<{ data: DeliveryServiceabilityResult }>(
        '/delivery/serviceability',
        {
          branchId,
          postalCode,
          orderAmount: subtotal,
        },
      );
      setServiceability(response.data.data);
    } catch {
      setServiceability(null);
    } finally {
      setChecking(false);
    }
  }

  function addItem(item: { menuItemId: string; itemName: string; price: number }) {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function updateQty(menuItemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  }

  async function handleSubmitOrder() {
    if (!recipientName.trim() || !phone.trim() || !addressLine1.trim()) {
      setError('Please fill in recipient name, phone, and delivery address.');
      return;
    }
    if (cart.length === 0) {
      setError('Cart is empty.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await httpClient.post<{ data: { orderId: string } }>(
        '/delivery/checkout',
        {
          branchId,
          deliveryAddress: {
            label: 'Home',
            recipientName: recipientName.trim(),
            phone: phone.trim(),
            addressLine1: addressLine1.trim(),
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
          },
          paymentMethod,
          items: cart.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        },
      );
      navigate(`/delivery/track/${response.data.data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delivery checkout failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <span>🛵 Delivery Checkout</span>
          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
            Phase 21
          </span>
        </h1>
        <p className="text-xs text-slate-400">
          Enter delivery address, select items, and place server-authoritative delivery order.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Delivery Address Form */}
        <div className="md:col-span-2 space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs">
          <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
            Delivery Address Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Recipient Name *</label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Phone Number *</label>
              <input
                type="text"
                placeholder="e.g. +919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Address Line 1 *</label>
            <input
              type="text"
              placeholder="House/Flat No, Building, Street"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">PIN / Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500 font-semibold"
              />
            </div>
          </div>

          {/* Serviceability Badge */}
          <div className="p-3 bg-slate-800 rounded-lg flex items-center justify-between">
            <span className="text-slate-300">Delivery Serviceability</span>
            {checking ? (
              <span className="text-slate-400 font-mono text-[11px]">Checking...</span>
            ) : serviceability?.isServiceable ? (
              <span className="text-green-400 font-bold text-[11px]">
                ✓ Serviceable (Fee: ₹{serviceability.deliveryFee})
              </span>
            ) : (
              <span className="text-red-400 font-bold text-[11px]">
                ✕ {serviceability?.reason || 'Not Serviceable'}
              </span>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="font-bold text-white">Payment Method</h4>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="accent-amber-500"
                />
                <span className="text-white">Cash on Delivery (COD)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                  className="accent-amber-500"
                />
                <span className="text-white">Online Payment (UPI/Card)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Cart & Total Summary */}
        <div className="space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs">
          <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
            Order Items Summary
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-800">
            {cart.map((item) => (
              <div key={item.menuItemId} className="pt-2 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{item.itemName}</div>
                  <div className="text-amber-400 font-mono">₹{item.price}</div>
                </div>
                <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-lg">
                  <button onClick={() => updateQty(item.menuItemId, -1)} className="px-2 font-bold">
                    -
                  </button>
                  <span className="font-mono font-bold text-white">{item.quantity}</span>
                  <button onClick={() => updateQty(item.menuItemId, 1)} className="px-2 font-bold">
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <span className="text-slate-400 block mb-1 font-bold">Add Item to Cart</span>
            <div className="space-y-1">
              {DEMO_MENU.map((item) => (
                <button
                  key={item.menuItemId}
                  onClick={() => addItem(item)}
                  className="w-full text-left p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[11px] flex justify-between text-slate-300"
                >
                  <span>{item.itemName}</span>
                  <span className="font-mono text-amber-400">+ ₹{item.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST Tax (5%)</span>
              <span className="font-mono">₹{tax}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Delivery Fee</span>
              <span className="font-mono">₹{deliveryFee}</span>
            </div>
            <hr className="border-slate-800 my-1" />
            <div className="flex justify-between font-bold text-amber-400 text-sm">
              <span>Grand Total</span>
              <span className="font-mono">₹{grandTotal}</span>
            </div>
          </div>

          <button
            onClick={() => void handleSubmitOrder()}
            disabled={submitting}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition-colors"
          >
            {submitting ? 'Placing Order...' : 'Confirm Delivery Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
