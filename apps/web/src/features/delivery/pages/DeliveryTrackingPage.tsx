import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { httpClient } from '@/shared/lib/http';

interface DeliveryTrackingData {
  orderId: string;
  orderNumber: string;
  guestName: string;
  items: Array<{ itemName: string; quantity: number; totalPrice: number }>;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryAddress: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    city: string;
    postalCode: string;
  };
  assignedEmployeeName?: string;
  timeline: Array<{ key: string; label: string; isCompleted: boolean }>;
  createdAt: string;
}

export function DeliveryTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<DeliveryTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) void fetchTrackingInfo();
  }, [orderId]);

  // Live polling every 5 seconds
  useEffect(() => {
    if (!orderId) return;
    const interval = setInterval(() => {
      void fetchTrackingInfo(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  async function fetchTrackingInfo(silent = false) {
    if (!silent) setLoading(true);
    try {
      const response = await httpClient.get<{ data: DeliveryTrackingData }>(
        `/delivery/orders/track/${orderId}`,
      );
      setOrder(response.data.data);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Failed to fetch order tracking.');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs p-4">
        Fetching live delivery order tracking...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full flex items-center justify-center text-xl font-bold">
          ⚠️
        </div>
        <h2 className="text-lg font-bold text-white">Order Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'Order tracking information is unavailable.'}</p>
        <Link
          to="/delivery/checkout"
          className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-lg"
        >
          Back to Delivery
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider block">
              DineX Live Delivery Status
            </span>
            <h1 className="text-xl font-extrabold text-white">Order {order.orderNumber}</h1>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-bold rounded-lg uppercase text-xs">
            {order.status}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Recipient: {order.deliveryAddress?.recipientName} ({order.deliveryAddress?.phone})
        </p>
      </div>

      {/* Driver info if assigned */}
      {order.assignedEmployeeName && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🛵</span>
            <div>
              <span className="font-bold text-amber-400 block">Delivery Driver Assigned</span>
              <span className="text-white font-semibold">{order.assignedEmployeeName}</span>
            </div>
          </div>
          <span className="text-[11px] text-amber-300 font-mono">On the way!</span>
        </div>
      )}

      {/* Timeline Progression */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs space-y-3">
        <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
          Delivery Status Timeline
        </h3>
        <div className="space-y-3 pt-1">
          {order.timeline.map((step) => (
            <div key={step.key} className="flex items-center space-x-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  step.isCompleted
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {step.isCompleted ? '✓' : '•'}
              </div>
              <span
                className={`font-semibold ${
                  step.isCompleted ? 'text-white' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address & Order Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <h4 className="font-bold text-white">Delivery Address</h4>
          <p className="text-slate-300">
            {order.deliveryAddress?.addressLine1}, {order.deliveryAddress?.city},{' '}
            {order.deliveryAddress?.postalCode}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <h4 className="font-bold text-white">Payment Details</h4>
          <div className="flex justify-between text-slate-300">
            <span>Payment Method</span>
            <span className="uppercase font-bold text-amber-400">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Grand Total</span>
            <span className="font-mono font-bold text-amber-400">₹{order.grandTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
