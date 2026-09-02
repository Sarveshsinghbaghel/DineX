import { useState, useEffect } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { KPIMetricSummary } from '@x10think/types';

export function AnalyticsDashboardPage() {
  const [period, setPeriod] = useState<string>('last_30_days');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'revenue' | 'orders' | 'menu' | 'inventory' | 'employees'
  >('overview');
  const [kpiData, setKpiData] = useState<KPIMetricSummary | null>(null);
  const [revenueDetails, setRevenueDetails] = useState<any>(null);
  const [menuDetails, setMenuDetails] = useState<any>(null);
  const [inventoryDetails, setInventoryDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, revRes, menuRes, invRes] = await Promise.all([
        httpClient.get<{ data: KPIMetricSummary }>(`/analytics/kpis?period=${period}`),
        httpClient.get<{ data: any }>(`/analytics/revenue?period=${period}`),
        httpClient.get<{ data: any }>(`/analytics/menu?period=${period}`),
        httpClient.get<{ data: any }>(`/analytics/inventory?period=${period}`),
      ]);

      setKpiData(kpiRes.data.data);
      setRevenueDetails(revRes.data.data);
      setMenuDetails(menuRes.data.data);
      setInventoryDetails(invRes.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business analytics');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-700 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Intelligence & Analytics</h1>
          <p className="text-xs text-slate-400">
            Real-time transactional insights, revenue breakdown, menu engineering, and branch
            performance.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 p-1.5 rounded-xl text-xs">
          {[
            { key: 'today', label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'last_7_days', label: '7 Days' },
            { key: 'last_30_days', label: '30 Days' },
            { key: 'this_month', label: 'This Month' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                period === p.key
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      {kpiData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl space-y-1">
            <span className="text-slate-400 text-[11px] font-medium block">Gross Revenue</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">
                ₹{kpiData.grossRevenue.toLocaleString()}
              </span>
              {kpiData.revenueChangePercentage !== undefined && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    kpiData.revenueChangePercentage >= 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {kpiData.revenueChangePercentage >= 0 ? '+' : ''}
                  {kpiData.revenueChangePercentage}% ↗
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block">
              vs {kpiData.comparisonPeriodLabel}
            </span>
          </div>

          <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl space-y-1">
            <span className="text-slate-400 text-[11px] font-medium block">
              Average Order Value (AOV)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-400">
                ₹{kpiData.averageOrderValue}
              </span>
              <span className="text-xs text-slate-400">Per Order</span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              Total Completed: {kpiData.completedOrders}
            </span>
          </div>

          <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl space-y-1">
            <span className="text-slate-400 text-[11px] font-medium block">
              Total Orders Volume
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">{kpiData.totalOrders}</span>
              {kpiData.ordersChangePercentage !== undefined && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    kpiData.ordersChangePercentage >= 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {kpiData.ordersChangePercentage >= 0 ? '+' : ''}
                  {kpiData.ordersChangePercentage}%
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block">
              Cancelled: {kpiData.cancelledOrders}
            </span>
          </div>

          <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl space-y-1">
            <span className="text-slate-400 text-[11px] font-medium block">
              Stock Health Alerts
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-red-400">
                {kpiData.lowStockItemsCount + kpiData.outOfStockItemsCount}
              </span>
              <span className="text-xs text-slate-400">Items</span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              Low: {kpiData.lowStockItemsCount} | Out: {kpiData.outOfStockItemsCount}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 text-xs">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'revenue', label: 'Revenue Breakdown' },
          { key: 'menu', label: 'Menu Engineering' },
          { key: 'inventory', label: 'Inventory Valuation' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2.5 font-bold transition-colors border-b-2 ${
              activeTab === t.key
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-xs space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Aggregating transactional data...</div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm">
              Key Performance Summary ({kpiData?.periodLabel})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2">
                <span className="font-bold text-amber-300">Financial Net Breakdown</span>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Gross Sales</span>
                    <strong className="text-white">₹{kpiData?.grossRevenue}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Discounts Allowed</span>
                    <span>- ₹{kpiData?.discounts}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Tax (GST 5%)</span>
                    <span>+ ₹{kpiData?.taxes}</span>
                  </div>
                  <hr className="border-slate-800 my-1" />
                  <div className="flex justify-between font-bold text-amber-400">
                    <span>Net Revenue</span>
                    <span>₹{kpiData?.netRevenue}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2">
                <span className="font-bold text-amber-300">
                  Customer & Staff Operational Metrics
                </span>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Total Registered Customers</span>
                    <strong className="text-white">{kpiData?.totalCustomers}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Repeat Customers Share</span>
                    <span>
                      {kpiData?.repeatCustomers} (
                      {Math.round(
                        ((kpiData?.repeatCustomers || 0) / (kpiData?.totalCustomers || 1)) * 100,
                      )}
                      %)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Active Employees</span>
                    <span>{kpiData?.activeEmployeesCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'revenue' ? (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm">Revenue Distribution by Order Channel</h3>
            <div className="space-y-2">
              {revenueDetails?.breakdownByChannel?.map((ch: any) => (
                <div
                  key={ch.channel}
                  className="p-3 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between"
                >
                  <span className="font-semibold text-white">{ch.channel}</span>
                  <span className="font-mono font-bold text-amber-400">
                    ₹{ch.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'menu' ? (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm">Top Performing Menu Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Units Sold</th>
                    <th className="p-3">Total Revenue</th>
                    <th className="p-3">Avg Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {menuDetails?.topSellingItems?.map((item: any) => (
                    <tr key={item.menuItemId} className="hover:bg-slate-700/30">
                      <td className="p-3 font-semibold text-white">{item.itemName}</td>
                      <td className="p-3 font-mono">{item.quantitySold}</td>
                      <td className="p-3 font-mono font-bold text-amber-400">
                        ₹{item.totalRevenue}
                      </td>
                      <td className="p-3 text-amber-300 font-bold">★ {item.averageRating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm">Inventory Stock Valuation</h3>
            <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2 max-w-sm">
              <span className="text-slate-400 text-xs">Total Stock Valuation</span>
              <div className="text-2xl font-bold text-amber-400">
                ₹{inventoryDetails?.stockValuationTotal?.toLocaleString()}
              </div>
              <p className="text-slate-400 text-[10px]">
                Healthy Items: {inventoryDetails?.healthyItemsCount} | Low Stock:{' '}
                {inventoryDetails?.lowStockItemsCount}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
