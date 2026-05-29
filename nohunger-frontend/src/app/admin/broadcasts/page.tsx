'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { getBroadcasts, sendBroadcast } from '@/lib/api/notifications';
import { getActivities } from '@/lib/api/activities';
import { getVolunteers } from '@/lib/api/volunteers';
import { apiFetch } from '@/lib/api/client';
import { Megaphone, Send, Activity, Globe, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    target_type: 'all',
    target_activity_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (form.target_type === 'selected') {
      fetchVolunteers(volunteerSearch);
    }
  }, [form.target_type, volunteerSearch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bData, aData] = await Promise.all([getBroadcasts(), getActivities()]);
      setBroadcasts(bData || []);
      setActivities((aData || []).filter((a) => ['published', 'ongoing'].includes(a.status)));
    } catch (err) {
      console.log('Broadcasts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async (search = '') => {
    setLoadingVolunteers(true);
    try {
      const result = await getVolunteers({ status: 'approved', search, limit: 100 });
      setVolunteers(result.data || []);
    } catch (err) {
      console.log('Volunteer search error:', err);
    } finally {
      setLoadingVolunteers(false);
    }
  };

  const handleSend = async () => {
    if (!form.title || !form.message) {
      toast.error('Please fill in title and message.');
      return;
    }

    if (form.target_type === 'selected' && selectedVolunteerIds.length === 0) {
      toast.error('Please select at least one volunteer to send this broadcast.');
      return;
    }

    setSending(true);
    try {
      let payload: any = {
        subject: form.title,
        message: form.message,
        recipientType: 'all',
      };

      if (form.target_type === 'selected') {
        payload = { ...payload, recipientIds: selectedVolunteerIds, type: 'broadcast' };
      } else if (form.target_type === 'activity' && form.target_activity_id) {
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
      toast.success('✅ Broadcast sent! Volunteers will receive your message shortly.');
      setForm({ title: '', message: '', target_type: 'all', target_activity_id: '' });
      setSelectedVolunteerIds([]);
      setVolunteerSearch('');
      setVolunteers([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Unable to send broadcast. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  const targetIcon = (type: string) => {
    if (type === 'activity') return <Activity size={14} className="text-primary" />;
    return <Globe size={14} className="text-muted-foreground" />;
  };

  return (
    <AppLayout activePath="/admin/broadcasts">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-700 text-foreground">Broadcasts</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">
            Send messages to all Champions or selected volunteers by search and selection
          </p>
        </div>

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
                <label className="block text-[13px] font-600 text-foreground mb-1.5">Target Audience</label>
                <select
                  value={form.target_type}
                  onChange={(e) => {
                    setForm((p) => ({
                      ...p,
                      target_type: e.target.value,
                      target_activity_id: '',
                    }));
                    setSelectedVolunteerIds([]);
                    setVolunteerSearch('');
                    setVolunteers([]);
                  }}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="all">All Champions</option>
                  <option value="selected">Selected Champions</option>
                  <option value="activity">By Activity</option>
                </select>
              </div>
              {form.target_type === 'activity' && (
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">Select Activity</label>
                  <select
                    value={form.target_activity_id}
                    onChange={(e) => setForm((p) => ({ ...p, target_activity_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="">Select activity…</option>
                    {activities.map((a) => (
                      <option key={a.id || a._id} value={a.id || a._id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {form.target_type === 'selected' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">Search Champions</label>
                  <input
                    value={volunteerSearch}
                    onChange={(e) => setVolunteerSearch(e.target.value)}
                    placeholder="Search by name or email"
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div className="grid gap-2 max-h-64 overflow-y-auto rounded-2xl border border-border bg-muted p-3">
                  {loadingVolunteers ? (
                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">Loading volunteers…</div>
                  ) : volunteers.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Search volunteers to select recipients.</div>
                  ) : (
                    volunteers.map((vol) => {
                      const selected = selectedVolunteerIds.includes(vol.id);
                      return (
                        <button
                          key={vol.id}
                          type="button"
                          onClick={() => {
                            setSelectedVolunteerIds((current) =>
                              current.includes(vol.id)
                                ? current.filter((id) => id !== vol.id)
                                : [...current, vol.id]
                            );
                          }}
                          className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${selected ? 'bg-primary/10 border border-primary text-primary' : 'border border-border bg-white text-foreground hover:bg-muted'}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{vol.full_name || vol.email}</span>
                            {selected && <span className="text-[12px] font-semibold text-primary">Selected</span>}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                {selectedVolunteerIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedVolunteerIds.map((id) => {
                      const vol = volunteers.find((v) => v.id === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-sm">
                          {vol?.full_name || 'Selected volunteer'}
                          <button
                            type="button"
                            onClick={() => setSelectedVolunteerIds((current) => current.filter((item) => item !== id))}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 1 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.42 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.42L13.41 12l4.9-4.89a1 1 0 0 0 0-1.4z"/></svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-[12px] text-muted-foreground">📧 Sends in-app notification to the chosen volunteers.</p>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Send Broadcast
              </button>
            </div>
          </div>
        </div>

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
                <div key={b.id || b._id} className="p-5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {targetIcon(b.target_type || b.type || 'all')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-700 text-foreground">{b.title}</p>
                        <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">{b.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(b.created_at || b.createdAt || b.sent_at || b.createdAt).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[11px] font-600 text-primary capitalize">{(b.type || b.target_type || 'broadcast').replace('_', ' ')}</span>
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
