import { useState, useEffect, type FormEvent } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { Restaurant } from '@x10think/types';

export function RestaurantSettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings form values
  const [taxRate, setTaxRate] = useState<number>(5);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [autoAcceptOrder, setAutoAcceptOrder] = useState<boolean>(true);
  const [reservationDays, setReservationDays] = useState<number>(7);

  useEffect(() => {
    void fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    setError(null);
    try {
      const restResponse = await httpClient.get<{ data: Restaurant[] }>('/restaurants');
      const list = Array.isArray(restResponse.data.data) ? restResponse.data.data : [];
      if (list.length > 0) {
        setRestaurant(list[0]);
        const setResponse = await httpClient.get<{ data: Record<string, unknown> }>(
          `/restaurants/${list[0]._id}/settings`,
        );
        const sData = setResponse.data.data || {};
        setSettings(sData);

        if (typeof sData['tax.default_rate'] === 'number') setTaxRate(sData['tax.default_rate']);
        if (typeof sData['service_charge.rate'] === 'number')
          setServiceCharge(sData['service_charge.rate']);
        if (typeof sData['order.auto_accept'] === 'boolean')
          setAutoAcceptOrder(sData['order.auto_accept']);
        if (typeof sData['reservation.advance_days'] === 'number')
          setReservationDays(sData['reservation.advance_days']);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!restaurant) return;
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const payload = {
        'tax.default_rate': taxRate,
        'service_charge.rate': serviceCharge,
        'order.auto_accept': autoAcceptOrder,
        'reservation.advance_days': reservationDays,
      };

      const response = await httpClient.patch<{ data: Record<string, unknown> }>(
        `/restaurants/${restaurant._id}/settings`,
        payload,
      );

      setSettings(response.data.data || {});
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save settings failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-white">Restaurant Tenant Settings</h1>
        <p className="text-xs text-slate-400">
          Configure default operational policies for currency, taxes, service charges, orders, and
          reservations.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400">
          Restaurant settings updated successfully!
        </div>
      )}

      {/* Precedence Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-300 flex items-center space-x-3">
        <span className="text-lg">⚙️</span>
        <div>
          <strong className="block text-white">Configuration Precedence Order:</strong>
          <span>Branch Settings &gt; Restaurant (Tenant) Settings &gt; System Defaults</span>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSaveSettings(e)}
        className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-6 text-xs"
      >
        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm">Tax & Pricing Configurations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Default GST / Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Service Charge Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-700">
          <h3 className="font-bold text-white text-sm">Order & Reservation Workflows</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Reservation Advance Window (Days)
              </label>
              <input
                type="number"
                value={reservationDays}
                onChange={(e) => setReservationDays(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <input
                type="checkbox"
                id="autoAcceptOrder"
                checked={autoAcceptOrder}
                onChange={(e) => setAutoAcceptOrder(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-amber-500"
              />
              <label htmlFor="autoAcceptOrder" className="text-slate-300 font-semibold">
                Auto-accept incoming digital orders
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-700">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Tenant Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
