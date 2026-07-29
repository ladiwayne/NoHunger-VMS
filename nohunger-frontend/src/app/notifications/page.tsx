'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import { Bell, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

type Panel = 'notifications';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activePanel, setActivePanel] = useState<Panel>('notifications');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.log('Notifications error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(() => {
        fetchNotifications(true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('✅ All notifications are now marked as read.');
    } catch (err) {
      toast.error('Unable to mark notifications as read. Please try again.');
    }
  };

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const typeIcon = (type: string) => {
    const icons: Record<string, string> = {
      invitation: '📩',
      event_reminder: '📅',
    };
    return icons[type] || '🔔';
  };

  const notifTypes = ['all', 'invitation', 'event_reminder'];

  const filteredNotifs = notifications.filter((n) => {
    const matchType = typeFilter === 'all' || n.notification_type === typeFilter;
    const matchSearch =
      !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.message?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const panels: { id: Panel; label: string; icon: React.ElementType }[] = [
    {
      id: 'notifications',
      label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
      icon: Bell,
    },
  ];

  return (
    <AppLayout activePath="/notifications">
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Notifications & Events</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Stay in the loop on your No Hunger Champion events and invitations
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 bg-card border border-border rounded-xl text-[13px] font-600 text-foreground hover:bg-muted transition-all"
            >
              Mark all read ({unreadCount})
            </button>
          )}
        </div>

        {/* Panel Tabs */}
        <div className="flex gap-2 border-b border-border">
          {panels.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setActivePanel(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-600 border-b-2 transition-all -mb-px ${activePanel === p.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <Icon size={15} />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Notifications Panel */}
        {activePanel === 'notifications' && (
          <div className="space-y-4">
            <p className="text-[13px] text-muted-foreground">
              You will only see invitation updates and event reminders here.
            </p>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notifications…"
                  className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter size={14} className="text-muted-foreground" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-card border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  {notifTypes.map((t) => (
                    <option key={t} value={t}>
                      {t === 'all' ? 'All Types' : t.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-card border border-border rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : filteredNotifs.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Bell size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-[15px] font-600 text-foreground">No notifications</p>
                <p className="text-[13px] text-muted-foreground mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden divide-y divide-border">
                {filteredNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-muted/40 transition-colors ${!n.read ? 'bg-primary/4' : ''}`}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">
                      {typeIcon(n.notification_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[13.5px] leading-snug ${!n.read ? 'font-700 text-foreground' : 'font-500 text-foreground'}`}
                      >
                        {n.title}
                      </p>
                      <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {new Date(n.created_at).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


      </div>
    </AppLayout>
  );
}
