import { useState, useEffect } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { OrderRecord } from '@x10think/types';

export function DeliveryDriverPage() {
  const [deliveries, setDeliveries] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDriverDeliveries();
  }, []);

  async function fetchDriverDeliveries() {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get<{ data: OrderRecord[] }>(
        '/delivery/driver/deliveries',
      );
      setDeliveries(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assigned deliveries.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(orderId: string, status: string) {
    setError(null);
    try {
      await httpClient.patch(`/delivery/orders/${orderId}/status`, { status });
      void fetchDriverDeliveries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update delivery status.');
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 p-4 text-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider block">
            Delivery Partner Portal
          </span>
          <h1 className="text-lg font-extrabold text-white">Assigned Deliveries</h1>
        </div>
        <button
          onClick={() => void fetchDriverDeliveries()}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[11px]"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading assigned deliveries...</div>
      ) : deliveries.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 space-y-2">
          <span className="text-2xl block">🛵</span>
          <span className="font-bold text-white block">No Active Deliveries Assigned</span>
          <p className="text-[11px]">When a manager assigns a delivery order to you, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((d) => (
            <div key={d._id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="font-mono font-bold text-amber-400 block">{d.orderNumber}</span>
                  <span className="text-slate-400 text-[11px]">
                    Customer: {d.deliveryAddress?.recipientName}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded uppercase text-[10px]">
                  {d.status}
                </span>
              </div>

              <div className="space-y-1 text-slate-300">
                <div className="font-bold text-white">Delivery Address:</div>
                <p>
                  {d.deliveryAddress?.addressLine1}, {d.deliveryAddress?.city},{' '}
                  {d.deliveryAddress?.postalCode}
                </p>
                <div className="text-amber-400 font-semibold pt-1">
                  📞 Contact: {d.deliveryAddress?.phone}
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg font-mono text-slate-300">
                <span>Collect Cash / Payment</span>
                <span className="font-bold text-amber-400">₹{d.grandTotal}</span>
              </div>

              {/* Status Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => void handleUpdateStatus(d._id, 'picked_up')}
                  disabled={d.status === 'picked_up' || d.status === 'out_for_delivery'}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-[10px] disabled:opacity-50"
                >
                  Confirm Pickup
                </button>
                <button
                  onClick={() => void handleUpdateStatus(d._id, 'out_for_delivery')}
                  disabled={d.status === 'out_for_delivery'}
                  className="py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded-lg text-[10px]"
                >
                  Out for Delivery
                </button>
                <button
                  onClick={() => void handleUpdateStatus(d._id, 'delivered')}
                  className="py-2 bg-green-500 hover:bg-green-400 text-slate-950 font-bold rounded-lg text-[10px]"
                >
                  Mark Delivered
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
