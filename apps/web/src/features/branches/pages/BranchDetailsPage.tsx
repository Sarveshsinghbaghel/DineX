import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { httpClient } from '@/shared/lib/http';
import type { Branch, BranchStatus } from '@x10think/types';

export function BranchDetailsPage() {
  const { branchId } = useParams();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [effectiveSettings, setEffectiveSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<BranchStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Settings Override State
  const [overrideTax, setOverrideTax] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    if (branchId) void fetchBranchData(branchId);
  }, [branchId]);

  async function fetchBranchData(id: string) {
    setLoading(true);
    setError(null);
    try {
      const bRes = await httpClient.get<{ data: Branch }>(`/branches/${id}`);
      setBranch(bRes.data.data);
      setNewStatus(bRes.data.data.status);

      const sRes = await httpClient.get<{ data: Record<string, unknown> }>(
        `/branches/${id}/settings`,
      );
      setEffectiveSettings(sRes.data.data || {});
      if (typeof sRes.data.data?.['tax.default_rate'] === 'number') {
        setOverrideTax(sRes.data.data['tax.default_rate'].toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branch details');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!branchId) return;
    setStatusUpdating(true);
    setError(null);
    try {
      const response = await httpClient.patch<{ data: Branch }>(`/branches/${branchId}/status`, {
        status: newStatus,
        reason: statusReason || undefined,
      });

      setBranch(response.data.data);
      setStatusModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleSaveSettingsOverride(e: FormEvent) {
    e.preventDefault();
    if (!branchId) return;
    setSavingSettings(true);
    setSettingsSuccess(false);
    setError(null);
    try {
      const taxVal = parseFloat(overrideTax);
      const payload: Record<string, unknown> = {};
      if (!isNaN(taxVal)) {
        payload['tax.default_rate'] = taxVal;
      }

      const response = await httpClient.patch<{ data: Record<string, unknown> }>(
        `/branches/${branchId}/settings`,
        payload,
      );

      setEffectiveSettings(response.data.data || {});
      setSettingsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Branch settings update failed');
    } finally {
      setSavingSettings(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500"></div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="p-8 text-center text-slate-400 max-w-4xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-white">Branch Not Found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">{branch.name}</h1>
            <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-amber-400 font-mono font-bold text-xs rounded">
              {branch.code}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Location: {branch.address?.addressLine1}, {branch.address?.city}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
              branch.status === 'ACTIVE'
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : branch.status === 'TEMPORARILY_CLOSED'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}
          >
            {branch.status}
          </span>

          <button
            onClick={() => setStatusModalOpen(true)}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-semibold rounded-lg transition-colors"
          >
            Set Status
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Branch Information Overview */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div>
          <span className="block text-slate-400">Contact & Capacity</span>
          <span className="font-semibold text-white block mt-1">📞 {branch.phone}</span>
          {branch.email && <span className="text-slate-300 block">{branch.email}</span>}
          <span className="text-slate-300 block mt-1">
            Seating Capacity: <strong className="text-white">{branch.capacity || 'N/A'}</strong>
          </span>
        </div>

        <div>
          <span className="block text-slate-400">Service Modes Enabled</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {branch.serviceModes?.map((mode) => (
              <span
                key={mode}
                className="px-2.5 py-0.5 bg-slate-900 border border-slate-700 text-amber-400 font-semibold rounded text-[10px] uppercase"
              >
                {mode.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-slate-400">Timezone</span>
          <span className="font-mono text-white block mt-1">{branch.timezone}</span>
        </div>
      </div>

      {/* Branch Settings Overrides */}
      <form
        onSubmit={(e) => void handleSaveSettingsOverride(e)}
        className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4 text-xs"
      >
        <div>
          <h2 className="text-lg font-bold text-white">Branch Settings Overrides</h2>
          <p className="text-slate-400">
            Override parent restaurant settings specifically for this branch location.
          </p>
        </div>

        {settingsSuccess && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
            Branch settings override saved successfully!
          </div>
        )}

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Branch Tax Rate Override (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={overrideTax}
            onChange={(e) => setOverrideTax(e.target.value)}
            placeholder="Inherits from restaurant default"
            className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
          />
          <span className="block text-[11px] text-slate-400 mt-1">
            Effective Tax Rate:{' '}
            <strong className="text-amber-400">
              {String(effectiveSettings['tax.default_rate'] ?? 5)}%
            </strong>
          </span>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-700">
          <button
            type="submit"
            disabled={savingSettings}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {savingSettings ? 'Saving...' : 'Save Branch Overrides'}
          </button>
        </div>
      </form>

      {/* Status Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white">Change Operational Status</h3>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">New Branch Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
              >
                <option value="ACTIVE">ACTIVE - Open for service</option>
                <option value="INACTIVE">INACTIVE - Branch disabled</option>
                <option value="SUSPENDED">SUSPENDED - Operations suspended</option>
                <option value="TEMPORARILY_CLOSED">
                  TEMPORARILY CLOSED - Maintenance / Holiday
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Status Reason</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Optional audit reason..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 h-20"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleStatusUpdate()}
                disabled={statusUpdating}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg disabled:opacity-50"
              >
                {statusUpdating ? 'Updating...' : 'Confirm Status Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
