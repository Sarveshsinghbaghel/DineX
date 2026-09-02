import { useState, useEffect } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { Inventory, Supplier, PurchaseOrder } from '@x10think/types';

export function InventoryDashboardPage() {
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [lowStockList, setLowStockList] = useState<Inventory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'balances' | 'low_stock' | 'suppliers' | 'pos'>(
    'balances',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchInventoryData();
  }, []);

  async function fetchInventoryData() {
    setLoading(true);
    setError(null);
    try {
      const [invRes, lowRes, supRes, poRes] = await Promise.all([
        httpClient.get<{ data: Inventory[] }>('/inventory/balances'),
        httpClient.get<{ data: Inventory[] }>('/inventory/low-stock'),
        httpClient.get<{ data: Supplier[] }>('/inventory/suppliers'),
        httpClient.get<{ data: PurchaseOrder[] }>('/inventory/purchase-orders'),
      ]);

      setInventoryList(Array.isArray(invRes.data.data) ? invRes.data.data : []);
      setLowStockList(Array.isArray(lowRes.data.data) ? lowRes.data.data : []);
      setSuppliers(Array.isArray(supRes.data.data) ? supRes.data.data : []);
      setPurchaseOrders(Array.isArray(poRes.data.data) ? poRes.data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory & Procurement</h1>
          <p className="text-xs text-slate-400">
            Real-time stock tracking, threshold state detection, supplier management, and purchase
            orders.
          </p>
        </div>

        <div className="flex space-x-2">
          {lowStockList.length > 0 && (
            <span className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs rounded-lg flex items-center space-x-2">
              <span>⚠️</span>
              <span>{lowStockList.length} Low / Out-of-stock Items</span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
            activeTab === 'balances'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Stock Balances ({inventoryList.length})
        </button>
        <button
          onClick={() => setActiveTab('low_stock')}
          className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
            activeTab === 'low_stock'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Low Stock Worklist ({lowStockList.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
            activeTab === 'suppliers'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Suppliers ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
            activeTab === 'pos'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden text-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading inventory records...</div>
        ) : activeTab === 'balances' ? (
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Ingredient</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3">Reorder Threshold</th>
                <th className="p-3">State</th>
                <th className="p-3">Storage Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {inventoryList.map((inv) => {
                const ingName =
                  typeof inv.ingredientId === 'object' ? inv.ingredientId.name : inv.ingredientId;
                return (
                  <tr key={inv._id} className="hover:bg-slate-700/30">
                    <td className="p-3 font-semibold text-white">{ingName}</td>
                    <td className="p-3 font-mono font-bold text-amber-400">
                      {inv.currentQuantity} {inv.unit}
                    </td>
                    <td className="p-3">
                      {inv.reorderLevel} {inv.unit}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                          inv.stockState === 'HEALTHY'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : inv.stockState === 'LOW'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}
                      >
                        {inv.stockState || 'HEALTHY'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {inv.storageLocation || 'Main Dry Store'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : activeTab === 'low_stock' ? (
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Ingredient</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3">Reorder Level</th>
                <th className="p-3">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {lowStockList.map((inv) => {
                const ingName =
                  typeof inv.ingredientId === 'object' ? inv.ingredientId.name : inv.ingredientId;
                return (
                  <tr key={inv._id} className="hover:bg-slate-700/30">
                    <td className="p-3 font-semibold text-white">{ingName}</td>
                    <td className="p-3 font-mono font-bold text-red-400">
                      {inv.currentQuantity} {inv.unit}
                    </td>
                    <td className="p-3">
                      {inv.reorderLevel} {inv.unit}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase border bg-red-500/20 text-red-400 border-red-500/30">
                        {inv.stockState}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : activeTab === 'suppliers' ? (
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Supplier Name</th>
                <th className="p-3">Code</th>
                <th className="p-3">Primary Contact</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {suppliers.map((sup) => (
                <tr key={sup._id} className="hover:bg-slate-700/30">
                  <td className="p-3 font-semibold text-white">{sup.name}</td>
                  <td className="p-3 font-mono text-amber-400">{sup.supplierCode || 'N/A'}</td>
                  <td className="p-3">
                    {sup.contacts?.[0]?.name} ({sup.contacts?.[0]?.phone})
                  </td>
                  <td className="p-3 uppercase font-bold text-[10px] text-green-400">
                    {sup.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">PO Number</th>
                <th className="p-3">Status</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Ordered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {purchaseOrders.map((po) => (
                <tr key={po._id} className="hover:bg-slate-700/30">
                  <td className="p-3 font-mono font-bold text-amber-400">{po.poNumber}</td>
                  <td className="p-3 uppercase font-bold text-[10px] text-slate-200">
                    {po.status}
                  </td>
                  <td className="p-3 font-bold text-white">₹{po.grandTotal}</td>
                  <td className="p-3 text-slate-400">
                    {new Date(po.orderedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
