'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getBroadcasts, sendBroadcast } from '@/lib/api/notifications';
import { getActivities } from '@/lib/api/activities';
import { apiFetch } from '@/lib/api/client';
import { Megaphone, Send, Users, Activity, Globe, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBroadcastsPage() {
  const { user } = useAuth();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    target_type: 'all',
    target_activity_id: '',
    target_group_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bData, aData] = await Promise.all([getBroadcasts(), getActivities()]);
      setBroadcasts(bData || []);
      setActivities((aData || []).filter((a) => ['published', 'ongoing'].includes(a.status)));
      setGroups([]);
    } catch (err) {
      console.log('Broadcasts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!form.title || !form.message) {
      toast.error('Please fill in title and message.');
      return;
    }
    setSending(true);
    try {
      if (form.target_type === 'group') {
        toast.error('Group targeting is not configured in MongoDB mode yet.');
        setSending(false);
        return;
      }

      let payload: any = {
        subject: form.title,
        message: form.message,
        recipientType: 'all',
      };

      if (form.target_type === 'activity' && form.target_activity_id) {
        const activity = await apiFetch<any>(`/activities/${form.target_activity_id}`);
        const ids = (activity?.volunteersApproved || [])
          .map((v: any) => v._id || v.id)
          .filter(Boolean);
        if (ids.length === 0) {
          toast.error('No approved volunteers found for this activity.');
          setSending(false);
          return;
        }
        payload = { ...payload, recipientIds: ids, type: 'broadcast' };
      }

      await sendBroadcast(payload);

      toast.success('Broadcast sent successfully!');
      setForm({
        title: '',
        message: '',
        target_type: 'all',
        target_activity_id: '',
        target_group_id: '',
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  const targetIcon = (type: string) => {
    if (type === 'activity') return <Activity size={14} className="text-primary" />;
    if (type === 'group') return <Users size={14} className="text-success" />;
    return <Globe size={14} className="text-muted-foreground" />;
  };

  return (
    <AppLayout activePath="/admin/broadcasts">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-700 text-foreground">Broadcasts</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">
            Send messages to Nohunger Champions by group or activity
          </p>
        </div>

        {/* Compose form */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <h2 className="text-[16px] font-700 text-foreground mb-4">New Broadcast</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-600 text-foreground mb-1.5">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Broadcast title…"
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-600 text-foreground mb-1.5">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                rows={4}
                placeholder="Write your message to Champions…"
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-600 text-foreground mb-1.5">
                  Target Audience
                </label>
                <select
                  value={form.target_type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      target_type: e.target.value,
                      target_activity_id: '',
                      target_group_id: '',
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="all">All Champions</option>
                  <option value="activity">By Activity</option>
                  <option value="group">By Group</option>
                </select>
              </div>
              {form.target_type === 'activity' && (
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Select Activity
                  </label>
                  <select
                    value={form.target_activity_id}
                    onChange={(e) => setForm((p) => ({ ...p, target_activity_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="">Select activity…</option>
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {form.target_type === 'group' && (
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Select Group
                  </label>
                  <select
                    value={form.target_group_id}
                    onChange={(e) => setForm((p) => ({ ...p, target_group_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="">Select group…</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-[12px] text-muted-foreground">
                📧 Will send in-app notification + email to all matching Champions
              </p>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60 text-[13.5px]"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Send Broadcast
              </button>
            </div>
          </div>
        </div>

        {/* Broadcast history */}
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-[15px] font-700 text-foreground">Broadcast History</h3>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="p-10 text-center">
              <Megaphone size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-[14px] font-600 text-foreground">No broadcasts sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {broadcasts.map((b) => (
                <div key={b.id} className="p-5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {targetIcon(b.target_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-700 text-foreground">{b.title}</p>
                        <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">
                          {b.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(b.created_at || b.sent_at).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[11px] font-600 text-primary capitalize">
                            {(b.type || b.target_type || 'broadcast').replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <CheckCircle2 size={14} className="text-success" />
                      <span className="text-[12px] font-600 text-success">Sent</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
