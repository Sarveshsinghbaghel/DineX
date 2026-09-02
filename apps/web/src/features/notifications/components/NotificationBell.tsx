import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpClient } from '@/shared/lib/http';

export function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    void fetchUnreadCount();
    const interval = setInterval(() => {
      void fetchUnreadCount();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnreadCount() {
    try {
      const response = await httpClient.get<{ data: { unreadCount: number } }>(
        '/notifications/unread-count',
      );
      setUnreadCount(response.data.data?.unreadCount || 0);
    } catch {
      // Ignore silent error if unauthenticated
    }
  }

  return (
    <button
      type="button"
      onClick={() => void navigate('/notifications')}
      className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg bg-slate-800 border border-slate-700"
      title="Notifications Center"
    >
      <span className="text-base">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full min-w-[18px] text-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
