'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getMyInvitations, respondToInvitation } from '@/lib/api/invitations';
import { Bell, Calendar, MapPin, CheckCircle2, XCircle, Clock, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function InvitationsPage() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    if (user) fetchInvitations();
  }, [user]);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const data = await getMyInvitations();
      setInvitations(data || []);
    } catch (err) {
      console.log('Invitations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invId: string, status: 'accepted' | 'rejected') => {
    setResponding(invId);
    try {
      await respondToInvitation(invId, status);
      toast.success(status === 'accepted' ? '🎉 Invitation accepted! See you there.' : 'Invitation declined.');
      fetchInvitations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to respond.');
    } finally {
      setResponding(null);
    }
  };

  const filtered = filter === 'all' ? invitations : invitations.filter(i => i.status === filter);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/25',
      accepted: 'bg-success/10 text-success border-success/25',
      rejected: 'bg-muted text-muted-foreground border-border',
      expired: 'bg-destructive/10 text-destructive border-destructive/25',
    };
    return map[status] || 'bg-muted text-muted-foreground border-border';
  };

  const counts = {
    all: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    rejected: invitations.filter(i => i.status === 'rejected').length,
  };

  return (
    <AppLayout activePath="/invitations">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-700 text-foreground">My Invitations</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">Event invitations sent to you by the admin team</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'accepted', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[13px] font-600 transition-all border ${
                filter === f ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 text-[11px] opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-card border border-border rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Bell size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-[15px] font-600 text-foreground">No {filter !== 'all' ? filter : ''} invitations</p>
            <p className="text-[13px] text-muted-foreground mt-1">Invitations from the admin team will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(inv => (
              <div key={inv.id} className={`bg-card border rounded-2xl shadow-card p-5 ${inv.status === 'pending' ? 'border-warning/30' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[11px] font-700 px-2.5 py-1 rounded-full border uppercase tracking-wide ${statusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                      {inv.expires_at && inv.status === 'pending' && (
                        <span className="text-[11px] text-warning font-500">
                          Expires {new Date(inv.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[16px] font-700 text-foreground mb-1">{inv.activities?.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                      {inv.activities?.start_date && (
                        <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                          <Calendar size={13} />
                          <span>{new Date(inv.activities.start_date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}
                      {inv.activities?.location && (
                        <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                          <MapPin size={13} />
                          <span>{inv.activities.location}</span>
                        </div>
                      )}
                    </div>
                    {inv.message && (
                      <div className="flex items-start gap-2 p-3 bg-muted rounded-xl mt-2">
                        <MessageSquare size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-[12.5px] text-muted-foreground italic">"{inv.message}"</p>
                      </div>
                    )}

                    {/* Check-in link for accepted invitations */}
                    {inv.status === 'accepted' && inv.activities?.checkin_link && (
                      <div className="mt-3 p-3 bg-primary/8 border border-primary/20 rounded-xl">
                        <p className="text-[12px] font-700 text-primary mb-1">Check-in Link (venue only)</p>
                        <p className="text-[11px] text-muted-foreground mb-2">This link is only active at the event venue</p>
                        <a
                          href={`/checkin/${inv.activities.checkin_code}`}
                          className="inline-flex items-center gap-1.5 text-[12px] font-600 text-primary hover:underline"
                        >
                          <Clock size={12} /> Open Check-in →
                        </a>
                      </div>
                    )}
                  </div>

                  {inv.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleRespond(inv.id, 'accepted')}
                        disabled={responding === inv.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-success/10 text-success border border-success/25 rounded-xl text-[13px] font-700 hover:bg-success/20 transition-colors disabled:opacity-60"
                      >
                        {responding === inv.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(inv.id, 'rejected')}
                        disabled={responding === inv.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-muted text-muted-foreground border border-border rounded-xl text-[13px] font-700 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-60"
                      >
                        <XCircle size={14} /> Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
