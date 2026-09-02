import { useState, useEffect, type FormEvent } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { Restaurant, WeeklyBusinessHours } from '@x10think/types';
import { BusinessHoursEditor } from '../components/BusinessHoursEditor';

export function RestaurantOverviewPage() {
  const [, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchRestaurants();
  }, []);

  async function fetchRestaurants() {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get<{ data: Restaurant[] }>('/restaurants');
      const list = Array.isArray(response.data.data) ? response.data.data : [];
      setRestaurants(list);
      if (list.length > 0) {
        setSelectedRestaurant(list[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant profile');
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(rest: Restaurant) {
    setName(rest.name);
    setLegalName(rest.legalName);
    setDescription(rest.description || '');
    setEmail(rest.email);
    setPhone(rest.phone);
    setWebsite(rest.website || '');
    setCurrency(rest.currency);
    setTimezone(rest.timezone);
    setError(null);
    setEditModalOpen(true);
  }

  async function handleUpdateRestaurant(e: FormEvent) {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setSaving(true);
    setError(null);
    try {
      const response = await httpClient.patch<{ data: Restaurant }>(
        `/restaurants/${selectedRestaurant._id}`,
        {
          name,
          legalName,
          description: description || undefined,
          email,
          phone,
          website: website || undefined,
          currency,
          timezone,
        },
      );

      setSelectedRestaurant(response.data.data);
      setRestaurants((prev) =>
        prev.map((r) => (r._id === selectedRestaurant._id ? response.data.data : r)),
      );
      setEditModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBusinessHours(hours: WeeklyBusinessHours) {
    if (!selectedRestaurant) return;
    const response = await httpClient.put<{ data: WeeklyBusinessHours }>(
      `/restaurants/${selectedRestaurant._id}/business-hours`,
      hours,
    );
    setSelectedRestaurant((prev) => (prev ? { ...prev, businessHours: response.data.data } : prev));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500"></div>
      </div>
    );
  }

  if (!selectedRestaurant) {
    return (
      <div className="p-8 text-center text-slate-400 max-w-4xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-white">No Restaurant Profile Found</h2>
        <p className="text-xs">No restaurant has been configured for this workspace tenant yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{selectedRestaurant.name}</h1>
          <p className="text-xs text-slate-400">
            Legal Entity:{' '}
            <span className="font-semibold text-slate-200">{selectedRestaurant.legalName}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
              selectedRestaurant.status === 'ACTIVE'
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {selectedRestaurant.status}
          </span>
          <button
            onClick={() => openEditModal(selectedRestaurant)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Restaurant Overview Card */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div>
          <span className="block text-slate-400">Contact Email & Phone</span>
          <span className="font-semibold text-white block mt-1">{selectedRestaurant.email}</span>
          <span className="text-slate-300 block">{selectedRestaurant.phone}</span>
          {selectedRestaurant.website && (
            <a
              href={selectedRestaurant.website}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline block mt-1"
            >
              {selectedRestaurant.website}
            </a>
          )}
        </div>

        <div>
          <span className="block text-slate-400">Headquarters Address</span>
          <span className="font-semibold text-white block mt-1">
            {selectedRestaurant.address?.addressLine1}
          </span>
          <span className="text-slate-300 block">
            {selectedRestaurant.address?.city}, {selectedRestaurant.address?.state} -{' '}
            {selectedRestaurant.address?.postalCode}
          </span>
        </div>

        <div>
          <span className="block text-slate-400">Operational Config</span>
          <span className="text-slate-300 block mt-1">
            Currency: <strong className="text-white">{selectedRestaurant.currency}</strong>
          </span>
          <span className="text-slate-300 block">
            Timezone: <strong className="text-white">{selectedRestaurant.timezone}</strong>
          </span>
          <span className="text-slate-300 block">
            Cuisines:{' '}
            <strong className="text-white">
              {selectedRestaurant.cuisineTypes?.join(', ') || 'General'}
            </strong>
          </span>
        </div>
      </div>

      {/* Business Hours Editor */}
      <BusinessHoursEditor
        initialHours={selectedRestaurant.businessHours}
        onSave={handleSaveBusinessHours}
      />

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white">Edit Restaurant Profile</h3>

            <form onSubmit={(e) => void handleUpdateRestaurant(e)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Brand Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Legal Entity Name</label>
                  <input
                    required
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Contact Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Contact Phone</label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Currency</label>
                  <input
                    required
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Timezone</label>
                  <input
                    required
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
