import { useState, useEffect } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { Notification } from '@x10think/types';

export function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchNotifications();
  }, [filterType]);

  async function fetchNotifications() {
    setLoading(true);
    setError(null);
    try {
      const url = filterType ? `/notifications?type=${filterType}` : '/notifications';
      const response = await httpClient.get<{ data: { notifications: Notification[] } }>(url);
      setNotifications(response.data.data?.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await httpClient.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, status: 'read', readAt: new Date().toISOString() } : n,
        ),
      );
    } catch {
      // Ignore
    }
  }

  async function handleMarkAllRead() {
    try {
      await httpClient.post('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'read', readAt: new Date().toISOString() })),
      );
    } catch {
      // Ignore
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Centralized Notification Center</h1>
          <p className="text-xs text-slate-400">
            Real-time alerts, system updates, and security notifications.
          </p>
        </div>
        <button
          onClick={() => void handleMarkAllRead()}
          className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-semibold rounded-lg transition-colors"
        >
          Mark All as Read
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Filter Category Pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {['', 'ORDER', 'INVENTORY', 'EMPLOYEE', 'SECURITY', 'SYSTEM'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
              filterType === type
                ? 'bg-amber-500 text-slate-950 border-amber-500'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {type || 'ALL TYPES'}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl divide-y divide-slate-800 text-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No notifications found.</div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.readAt;
            return (
              <div
                key={n._id}
                className={`p-4 flex items-start justify-between transition-colors ${
                  isUnread ? 'bg-slate-900/90 font-semibold' : 'opacity-75'
                }`}
              >
                <div className="space-y-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${
                        n.type === 'SECURITY' || n.priority === 'critical'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : n.type === 'INVENTORY'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {n.type}
                    </span>
                    <h4 className="text-white font-bold text-sm">{n.title}</h4>
                  </div>
                  {n.body && <p className="text-slate-300 text-xs">{n.body}</p>}
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>

                {isUnread && (
                  <button
                    onClick={() => void handleMarkRead(n._id)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded text-[11px]"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
