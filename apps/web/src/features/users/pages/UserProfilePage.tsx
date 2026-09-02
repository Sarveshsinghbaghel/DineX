import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { httpClient } from '@/shared/lib/http';
import type { UserProfile, Address, UserPreferences } from '@x10think/types';
import { AvatarUploader } from '../components/AvatarUploader';
import { AddressManagement } from '../components/AddressManagement';
import { PreferencesForm } from '../components/PreferencesForm';

export function UserProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Profile Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [locale, setLocale] = useState('');
  const [timezone, setTimezone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    void fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get<UserProfile>('/users/me/profile');
      setProfile(response.data);
      setFirstName(response.data.profile?.firstName || response.data.name || '');
      setLastName(response.data.profile?.lastName || '');
      setPhone(response.data.phone || '');
      setLocale(response.data.locale || 'en-IN');
      setTimezone(response.data.timezone || 'Asia/Kolkata');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setError(null);
    try {
      const response = await httpClient.patch<UserProfile>('/users/me/profile', {
        firstName,
        lastName,
        phone: phone || undefined,
        locale,
        timezone,
      });
      setProfile(response.data);
      setProfileSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAvatarUpload(base64Data: string, mimeType: string) {
    const response = await httpClient.post<{ url: string; publicId: string }>('/users/me/avatar', {
      data: base64Data,
      mimeType,
    });
    setProfile((prev) => (prev ? { ...prev, avatar: response.data } : prev));
  }

  async function handleAvatarDelete() {
    await httpClient.delete('/users/me/avatar');
    setProfile((prev) => (prev ? { ...prev, avatar: undefined } : prev));
  }

  async function handleAddAddress(addr: Omit<Address, '_id'>) {
    const response = await httpClient.post<Address>('/users/me/addresses', addr);
    setProfile((prev) => {
      if (!prev) return prev;
      const current = prev.addresses || [];
      const updated = addr.isDefault
        ? current.map((a) => ({ ...a, isDefault: false }))
        : [...current];
      return { ...prev, addresses: [...updated, response.data] };
    });
  }

  async function handleUpdateAddress(addressId: string, updates: Partial<Address>) {
    const response = await httpClient.patch<Address>(`/users/me/addresses/${addressId}`, updates);
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = (prev.addresses || []).map((a) =>
        a._id === addressId ? response.data : updates.isDefault ? { ...a, isDefault: false } : a,
      );
      return { ...prev, addresses: updated };
    });
  }

  async function handleDeleteAddress(addressId: string) {
    await httpClient.delete(`/users/me/addresses/${addressId}`);
    setProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, addresses: (prev.addresses || []).filter((a) => a._id !== addressId) };
    });
  }

  async function handleSavePreferences(newPrefs: UserPreferences) {
    const response = await httpClient.patch<UserPreferences>('/users/me/preferences', newPrefs);
    setProfile((prev) => (prev ? { ...prev, preferences: response.data } : prev));
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
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Account & User Profile</h1>
          <p className="text-xs text-slate-400">
            Manage personal info, avatar, addresses, preferences, and security settings.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Account & Security Summary Card */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Account & Security Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="block text-slate-400">Email Address</span>
            <span className="font-semibold text-white">{profile?.email}</span>
            <div className="mt-1">
              {profile?.emailVerified ? (
                <span className="inline-block px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded font-bold text-[10px]">
                  ✓ VERIFIED EMAIL
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold text-[10px]">
                  ⚠ UNVERIFIED EMAIL
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="block text-slate-400">Account Status</span>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full font-bold text-[10px] uppercase">
              {profile?.accountStatus || 'ACTIVE'}
            </span>
          </div>

          <div>
            <span className="block text-slate-400">Assigned Roles</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {user?.roles?.map((role) => (
                <span
                  key={role._id}
                  className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-amber-400 font-semibold rounded text-[10px]"
                >
                  {role.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Personal Info */}
      <form
        onSubmit={(e) => void handleUpdateProfile(e)}
        className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4 text-xs"
      >
        <h2 className="text-lg font-bold text-white">Personal Profile</h2>

        {profileSuccess && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
            Personal profile updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">First Name</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Last Name</label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Locale</label>
            <input
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Timezone</label>
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-700">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Update Personal Info'}
          </button>
        </div>
      </form>

      {/* Avatar Management */}
      <AvatarUploader
        avatar={profile?.avatar}
        onUpload={handleAvatarUpload}
        onDelete={handleAvatarDelete}
      />

      {/* Saved Addresses */}
      <AddressManagement
        addresses={profile?.addresses || []}
        onAdd={handleAddAddress}
        onUpdate={handleUpdateAddress}
        onDelete={handleDeleteAddress}
      />

      {/* Preferences */}
      <PreferencesForm preferences={profile?.preferences} onSave={handleSavePreferences} />
    </div>
  );
}
