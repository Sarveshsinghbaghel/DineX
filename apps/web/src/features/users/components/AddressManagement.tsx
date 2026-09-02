import { useState, type FormEvent } from 'react';
import type { Address } from '@x10think/types';

export interface AddressManagementProps {
  addresses: Address[];
  onAdd: (data: Omit<Address, '_id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Address>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function AddressManagement({
  addresses,
  onAdd,
  onUpdate,
  onDelete,
}: AddressManagementProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState('Home');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [isDefault, setIsDefault] = useState(false);

  function openAddModal() {
    setEditingAddress(null);
    setLabel('Home');
    setRecipientName('');
    setPhone('');
    setAddressLine1('');
    setAddressLine2('');
    setLandmark('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('India');
    setIsDefault(addresses.length === 0);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(addr: Address) {
    setEditingAddress(addr);
    setLabel(addr.label);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setCountry(addr.country);
    setIsDefault(addr.isDefault);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        label,
        recipientName,
        phone,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        landmark: landmark || undefined,
        city,
        state,
        postalCode,
        country,
        isDefault,
      };

      if (editingAddress) {
        await onUpdate(editingAddress._id, payload);
      } else {
        await onAdd(payload);
      }

      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetDefault(addr: Address) {
    if (addr.isDefault) return;
    setLoading(true);
    try {
      await onUpdate(addr._id, { isDefault: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Set default failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setLoading(true);
    try {
      await onDelete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete address failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Saved Addresses</h2>
          <p className="text-xs text-slate-400">
            Manage delivery and billing addresses. Maximum 10 addresses allowed.
          </p>
        </div>
        <button
          onClick={openAddModal}
          disabled={addresses.length >= 10 || loading}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-semibold rounded-lg transition-colors"
        >
          + Add New Address
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-700 rounded-xl">
          No addresses saved yet. Click "+ Add New Address" to add your first delivery address.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`p-4 rounded-xl border transition-all ${
                addr.isDefault
                  ? 'border-amber-500/60 bg-amber-500/5'
                  : 'border-slate-700 bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {addr.label}
                </span>
                {addr.isDefault ? (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    ★ DEFAULT ADDRESS
                  </span>
                ) : (
                  <button
                    onClick={() => void handleSetDefault(addr)}
                    disabled={loading}
                    className="text-[11px] text-amber-500 hover:underline"
                  >
                    Set as Default
                  </button>
                )}
              </div>

              <p className="text-sm font-semibold text-white">{addr.recipientName}</p>
              <p className="text-xs text-slate-300 mt-1">{addr.addressLine1}</p>
              {addr.addressLine2 && <p className="text-xs text-slate-300">{addr.addressLine2}</p>}
              {addr.landmark && <p className="text-xs text-slate-400">Landmark: {addr.landmark}</p>}
              <p className="text-xs text-slate-300">
                {addr.city}, {addr.state} - {addr.postalCode}, {addr.country}
              </p>
              <p className="text-xs text-slate-400 mt-1">📞 {addr.phone}</p>

              <div className="flex items-center space-x-4 mt-4 pt-3 border-t border-slate-800 text-xs">
                <button
                  onClick={() => openEditModal(addr)}
                  disabled={loading}
                  className="text-amber-400 hover:text-amber-300 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => void handleDelete(addr._id)}
                  disabled={loading}
                  className="text-red-400 hover:text-red-300 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Label</label>
                  <input
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Home, Office, etc."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Recipient Name</label>
                  <input
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address Line 1</label>
                <input
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Flat, House no., Building, Street"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Address Line 2 (Optional)</label>
                  <input
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Apartment, suite, unit"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Landmark (Optional)</label>
                  <input
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near park, station, etc."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
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

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isDefault" className="text-slate-300">
                  Set as default address
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
