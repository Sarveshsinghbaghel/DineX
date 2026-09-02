import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpClient } from '@/shared/lib/http';
import type { Branch, Restaurant } from '@x10think/types';

export function BranchManagementPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [capacity, setCapacity] = useState<number>(50);
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchInitialData();
  }, []);

  useEffect(() => {
    void fetchBranches();
  }, [search, statusFilter]);

  async function fetchInitialData() {
    try {
      const restResponse = await httpClient.get<{ data: Restaurant[] }>('/restaurants');
      setRestaurants(Array.isArray(restResponse.data.data) ? restResponse.data.data : []);
    } catch {
      // Ignore
    }
  }

  async function fetchBranches() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const response = await httpClient.get<{ data: Branch[] }>(`/branches?${params.toString()}`);
      setBranches(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setName('');
    setCode('');
    setPhone('');
    setEmail('');
    setCapacity(50);
    setAddressLine1('');
    setCity('');
    setState('');
    setPostalCode('');
    setError(null);
    setModalOpen(true);
  }

  async function handleCreateBranch(e: FormEvent) {
    e.preventDefault();
    if (restaurants.length === 0) {
      setError('A restaurant must be configured before creating a branch.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        restaurantId: restaurants[0]._id,
        name,
        code: code.toUpperCase(),
        phone,
        email: email || undefined,
        capacity,
        address: {
          label: 'Branch Location',
          recipientName: name,
          phone,
          addressLine1,
          city,
          state,
          postalCode,
          country: 'India',
        },
      };

      const response = await httpClient.post<{ data: Branch }>('/branches', payload);
      setBranches((prev) => [response.data.data, ...prev]);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Branch creation failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Branch Management</h1>
          <p className="text-xs text-slate-400">
            Manage operational locations, branch codes, capacity, and status.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors"
        >
          + Create New Branch
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Search Branch</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, code, phone..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Operational Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="TEMPORARILY_CLOSED">TEMPORARILY CLOSED</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
            }}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Branch Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden text-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading branch locations...</div>
        ) : branches.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No branches match your search criteria.
          </div>
        ) : (
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Branch Details</th>
                <th className="p-3">Code</th>
                <th className="p-3">Location & Phone</th>
                <th className="p-3">Capacity</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {branches.map((b) => (
                <tr key={b._id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-3 font-semibold text-white">{b.name}</td>
                  <td className="p-3 font-mono text-amber-400 font-bold">{b.code}</td>
                  <td className="p-3">
                    <div>
                      {b.address?.city}, {b.address?.state}
                    </div>
                    <div className="text-[10px] text-slate-400">📞 {b.phone}</div>
                  </td>
                  <td className="p-3">{b.capacity ? `${b.capacity} seats` : 'N/A'}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                        b.status === 'ACTIVE'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : b.status === 'TEMPORARILY_CLOSED'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => void navigate(`/branches/${b._id}`)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded"
                    >
                      View / Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Branch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white">Create New Branch</h3>

            <form onSubmit={(e) => void handleCreateBranch(e)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Branch Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Connaught Place Branch"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Branch Code (Unique)</label>
                  <input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CP-01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Capacity (Seats)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address Line 1</label>
                <input
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">State</label>
                  <input
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Postal Code</label>
                  <input
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
