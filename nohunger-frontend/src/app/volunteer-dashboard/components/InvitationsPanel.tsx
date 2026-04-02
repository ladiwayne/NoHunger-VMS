'use client';

import React, { useState } from 'react';
import { Bell, MapPin, Clock, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/ui/StatusBadge';

interface Invitation {
  id: string;
  eventName: string;
  date: string;
  time: string;
  location: string;
  role: string;
  expiresIn: string | null;
  urgent: boolean;
  status: 'pending' | 'accepted' | 'declined';
}

// TODO: Backend — GET /api/volunteers/:id/invitations?status=pending
const initialInvitations: Invitation[] = [
  {
    id: 'inv-001',
    eventName: 'Port Harcourt Relief Drive',
    date: 'Sat, Mar 21',
    time: '06:30 AM',
    location: 'Diobu Community Hall',
    role: 'Distribution',
    expiresIn: '2 days',
    urgent: true,
    status: 'pending',
  },
  {
    id: 'inv-002',
    eventName: 'Abuja Central Soup Kitchen',
    date: 'Wed, Apr 2',
    time: '10:00 AM',
    location: 'Garki Market, Abuja',
    role: 'Cooking',
    expiresIn: null,
    urgent: false,
    status: 'pending',
  },
  {
    id: 'inv-003',
    eventName: 'Spintex Road Food Pack',
    date: 'Sat, Apr 12',
    time: '08:00 AM',
    location: 'Spintex Community Hall',
    role: 'Food Packing',
    expiresIn: null,
    urgent: false,
    status: 'pending',
  },
];

export default function InvitationsPanel() {
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRespond = async (id: string, response: 'accepted' | 'declined') => {
    setLoadingId(id);
    // TODO: Backend — PATCH /api/invitations/:id with { response }
    await new Promise((r) => setTimeout(r, 900));

    setInvitations((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: response } : inv))
    );
    setLoadingId(null);

    const inv = invitations.find((i) => i.id === id);
    if (response === 'accepted') {
      toast.success(`You&apos;re signed up for ${inv?.eventName}!`, {
        description: 'Added to your upcoming events. We&apos;ll send a reminder 24 hrs before.',
        duration: 4000,
      });
    } else {
      toast.info(`Declined ${inv?.eventName}`, { duration: 3000 });
    }
  };

  const pending = invitations.filter((i) => i.status === 'pending');

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-warning" />
          <h3 className="text-[15px] font-700 text-foreground">Invitations</h3>
        </div>
        {pending.length > 0 && (
          <span className="text-[11px] font-700 bg-warning/12 text-warning px-2 py-0.5 rounded-full border border-warning/20">
            {pending.length} pending
          </span>
        )}
      </div>

      {invitations.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <Bell size={28} className="text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground">No pending invitations</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className={`px-5 py-3.5 transition-colors ${inv.status !== 'pending' ? 'opacity-60' : ''}`}
            >
              {inv.urgent && inv.status === 'pending' && (
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle size={11} className="text-warning" />
                  <span className="text-[11px] font-700 text-warning uppercase tracking-wide">
                    Expires in {inv.expiresIn}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[13px] font-700 text-foreground leading-snug">{inv.eventName}</p>
                {inv.status !== 'pending' && <StatusBadge variant={inv.status} size="sm" />}
              </div>

              <div className="flex items-center gap-3 mb-3 flex-wrap gap-y-1">
                <div className="flex items-center gap-1">
                  <Clock size={10} className="text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">
                    {inv.date} · {inv.time}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={10} className="text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                    {inv.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10.5px] font-600 bg-primary/8 text-primary px-1.5 py-0.5 rounded">
                  {inv.role}
                </span>
              </div>

              {inv.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRespond(inv.id, 'accepted')}
                    disabled={loadingId === inv.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                      bg-success/10 text-success border border-success/20
                      hover:bg-success hover:text-white hover:border-success
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-150 text-[12px] font-700"
                  >
                    {loadingId === inv.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(inv.id, 'declined')}
                    disabled={loadingId === inv.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                      bg-destructive/8 text-destructive border border-destructive/15
                      hover:bg-destructive hover:text-white hover:border-destructive
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-150 text-[12px] font-700"
                  >
                    <X size={12} />
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
