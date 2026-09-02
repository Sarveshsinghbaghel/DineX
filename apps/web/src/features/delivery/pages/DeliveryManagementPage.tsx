import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { httpClient } from '@/shared/lib/http';
import type { OrderRecord } from '@x10think/types';

interface DriverOption {
  _id: string;
  employeeNumber: string;
  userId: { _id: string; name: string };
}

export function DeliveryManagementPage() {
  const { branchId: paramBranchId } = useParams<{ branchId: string }>();
  const branchId = paramBranchId || '66a97adac596b27daa0d5ecf9';

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  useEffect(() => {
    void fetchData();
  }, [branchId]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, driversRes] = await Promise.all([
        httpClient.get<{ data: OrderRecord[] }>(`/delivery/orders/staff/branch/${branchId}`),
        httpClient.get<{ data: DriverOption[] }>(`/delivery/drivers/branch/${branchId}`),
      ]);
      setOrders(ordersRes.data.data);
      setDrivers(driversRes.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch delivery management data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignDriver(orderId: string) {
    if (!selectedDriverId) return;
    setError(null);
    try {
      await httpClient.patch(`/delivery/orders/${orderId}/assign`, {
        employeeId: selectedDriverId,
      });
      setAssigningOrderId(null);
      setSelectedDriverId('');
      void fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Driver assignment failed.');
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    setError(null);
    try {
      await httpClient.patch(`/delivery/orders/${orderId}/status`, { status: newStatus });
      void fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status.');
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-700 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>Delivery Management Dashboard</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
              Phase 21
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Assign delivery drivers, track active branch deliveries, and manage fulfillment status.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-xs space-y-4">
        <h3 className="font-bold text-white text-sm">Active & Past Delivery Orders</h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Fetching delivery orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No delivery orders placed yet.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-700 rounded-lg">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="p-3">Order No</th>
                  <th className="p-3">Customer / Phone</th>
                  <th className="p-3">Delivery Address</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Driver</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-700/30">
                    <td className="p-3 font-bold text-white">{o.orderNumber}</td>
                    <td className="p-3">
                      <span className="block text-white font-semibold">
                        {o.deliveryAddress?.recipientName || o.guestName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {o.deliveryAddress?.phone || o.guestPhone}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate">
                      {o.deliveryAddress?.addressLine1}, {o.deliveryAddress?.city}
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400">₹{o.grandTotal}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-amber-500/20 text-amber-300">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {o.assignedEmployeeId ? (
                        <span className="text-green-400 font-semibold">
                          {(o.assignedEmployeeId as any).userId?.name || 'Driver Assigned'}
                        </span>
                      ) : (
                        <span className="text-amber-500 font-bold text-[10px]">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => setAssigningOrderId(o._id)}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded"
                      >
                        Assign Driver
                      </button>
                      <button
                        onClick={() => void handleStatusChange(o._id, 'ready_for_pickup')}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded text-[10px]"
                      >
                        Mark Ready
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Driver Assignment Modal */}
      {assigningOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">Assign Delivery Driver</h3>
              <button
                onClick={() => setAssigningOrderId(null)}
                className="text-slate-400 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Select Delivery Employee</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500 font-semibold"
              >
                <option value="">-- Choose Driver --</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.userId.name} ({d.employeeNumber})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => void handleAssignDriver(assigningOrderId)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
            >
              Confirm Driver Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
