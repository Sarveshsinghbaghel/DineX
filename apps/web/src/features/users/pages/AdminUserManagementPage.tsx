import { useState, useEffect } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { UserProfile, Role, UserAccountStatus } from '@x10think/types';

export function AdminUserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Selected User Detail Drawer
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<UserAccountStatus>('active');
  const [statusReason, setStatusReason] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    void fetchRoles();
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [search, roleFilter, statusFilter, page]);

  async function fetchRoles() {
    try {
      const response = await httpClient.get<Role[]>('/roles');
      setRoles(response.data);
    } catch {
      // Ignore role fetch errors
    }
  }

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('accountStatus', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '10');

      const response = await httpClient.get<{ data: UserProfile[] }>(`/users?${params.toString()}`);
      setUsers(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  function openStatusModal(user: UserProfile) {
    setSelectedUser(user);
    setNewStatus(user.accountStatus || 'active');
    setStatusReason('');
    setStatusModalOpen(true);
  }

  async function handleStatusUpdate() {
    if (!selectedUser) return;
    setStatusUpdating(true);
    setError(null);
    try {
      const response = await httpClient.patch<UserProfile>(`/users/${selectedUser._id}/status`, {
        status: newStatus,
        reason: statusReason || undefined,
      });

      setUsers((prev) => prev.map((u) => (u._id === selectedUser._id ? response.data : u)));
      setSelectedUser(response.data);
      setStatusModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setStatusUpdating(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin User Management</h1>
          <p className="text-xs text-slate-400">
            Search, filter, inspect, and manage status transitions for all system users.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Search User</label>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Name, email, phone..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Role Filter</label>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r._id} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Account Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="active">ACTIVE</option>
            <option value="inactive">INACTIVE</option>
            <option value="suspended">SUSPENDED</option>
            <option value="pending_verification">PENDING VERIFICATION</option>
            <option value="locked">LOCKED</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearch('');
              setRoleFilter('');
              setStatusFilter('');
              setPage(1);
            }}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden text-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading user database...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No users match your criteria.</div>
        ) : (
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">User Details</th>
                <th className="p-3">Email & Status</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Roles</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-amber-500 overflow-hidden">
                        {u.avatar?.url ? (
                          <img src={u.avatar.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.name?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{u._id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div>{u.email}</div>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                        u.accountStatus === 'active'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : u.accountStatus === 'suspended'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {u.accountStatus || 'active'}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{u.phone || '—'}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map((r) => (
                        <span
                          key={r._id}
                          className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-amber-400 font-semibold rounded text-[10px]"
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => openStatusModal(u)}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 font-medium rounded"
                    >
                      Set Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between bg-slate-900 text-xs">
          <span className="text-slate-400">
            Showing Page <span className="font-bold text-white">{page}</span>
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={users.length < 10}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Inspect User Drawer */}
      {selectedUser && !statusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="bg-slate-900 border-l border-slate-700 w-full max-w-md h-full p-6 space-y-6 overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">User Inspection</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-amber-500/40 flex items-center justify-center text-xl font-bold text-amber-500 overflow-hidden">
                  {selectedUser.avatar?.url ? (
                    <img
                      src={selectedUser.avatar.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedUser.name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{selectedUser.name}</h4>
                  <p className="text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg space-y-1">
                <div>
                  <span className="text-slate-400">Account ID:</span>{' '}
                  <span className="font-mono text-white">{selectedUser._id}</span>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>{' '}
                  <span className="text-white">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Locale / Timezone:</span>{' '}
                  <span className="text-white">
                    {selectedUser.locale || 'en-IN'} / {selectedUser.timezone || 'Asia/Kolkata'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>{' '}
                  <span className="font-bold text-amber-400 uppercase">
                    {selectedUser.accountStatus}
                  </span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-white mb-1">
                  Saved Addresses ({selectedUser.addresses?.length || 0})
                </h5>
                {selectedUser.addresses?.length ? (
                  <div className="space-y-2">
                    {selectedUser.addresses.map((a) => (
                      <div
                        key={a._id}
                        className="p-2 bg-slate-800 border border-slate-700 rounded text-[11px]"
                      >
                        <div className="font-bold text-amber-400">
                          {a.label} {a.isDefault && '(Default)'}
                        </div>
                        <div>
                          {a.recipientName} - {a.addressLine1}, {a.city}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No saved addresses.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => openStatusModal(selectedUser)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg"
              >
                Change User Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white">Change Account Status</h3>
            <p className="text-slate-400">
              Update status for <strong className="text-white">{selectedUser.name}</strong> (
              {selectedUser.email}).
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">New Account Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
              >
                <option value="active">ACTIVE - Normal operational status</option>
                <option value="inactive">INACTIVE - Account disabled</option>
                <option value="suspended">SUSPENDED - Suspended due to violation</option>
                <option value="pending_verification">
                  PENDING VERIFICATION - Awaiting verification
                </option>
                <option value="locked">LOCKED - Security lock</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Reason for status change
              </label>
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
