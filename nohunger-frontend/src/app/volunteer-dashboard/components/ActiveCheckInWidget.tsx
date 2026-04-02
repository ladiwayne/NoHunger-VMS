'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle2, LogIn, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/ui/StatusBadge';

type CheckInState = 'not-started' | 'checked-in' | 'checked-out';

const ACTIVE_EVENT = {
  id: 'evt-001',
  name: 'Mushin Community Food Drive',
  location: 'Mushin Community Centre, Lagos',
  date: 'Today, March 17, 2026',
  startTime: '08:00 AM',
  endTime: '01:00 PM',
  coordinator: 'Esi Boateng',
  volunteersCheckedIn: 14,
  totalSlots: 20,
  role: 'Food Packing',
  checkInOpenAt: '07:30 AM',
};

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

export default function ActiveCheckInWidget() {
  const [checkInState, setCheckInState] = useState<CheckInState>('not-started');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (checkInState === 'checked-in') {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [checkInState]);

  const handleCheckIn = async () => {
    setLoading(true);
    // TODO: Backend — POST /api/checkins with { eventId, volunteerId, timestamp }
    await new Promise((r) => setTimeout(r, 1200));
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setCheckInTime(timeStr);
    setCheckInState('checked-in');
    setLoading(false);
    toast.success(`Checked in to ${ACTIVE_EVENT.name} at ${timeStr}`, {
      description: 'Your attendance has been recorded. Have a great session!',
      duration: 4000,
    });
  };

  const handleCheckOut = async () => {
    setLoading(true);
    // TODO: Backend — PATCH /api/checkins/:id with { checkOutTime, duration }
    await new Promise((r) => setTimeout(r, 1000));
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setCheckOutTime(timeStr);
    setCheckInState('checked-out');
    setLoading(false);
    const hours = (elapsedSeconds / 3600).toFixed(2);
    toast.success(`Checked out at ${timeStr} — ${hours} hrs logged!`, {
      description: 'Your volunteer hours have been saved. Thank you for your service!',
      duration: 5000,
    });
  };

  return (
    <div
      className={`
      bg-card border rounded-2xl shadow-card overflow-hidden
      ${checkInState === 'checked-in' ? 'border-success/30' : 'border-border'}
    `}
    >
      {/* Header bar */}
      <div
        className={`
        px-5 py-3 flex items-center justify-between
        ${checkInState === 'checked-in' ? 'bg-success/6 border-b border-success/15' : 'bg-primary/4 border-b border-primary/10'}
      `}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${checkInState === 'checked-in' ? 'bg-success animate-pulse' : 'bg-primary'}`}
          />
          <span className="text-[12.5px] font-700 uppercase tracking-wide text-muted-foreground">
            {checkInState === 'not-started' && 'Active Event Today'}
            {checkInState === 'checked-in' && 'Currently Checked In'}
            {checkInState === 'checked-out' && 'Session Complete'}
          </span>
        </div>
        <StatusBadge
          variant={
            checkInState === 'checked-in'
              ? 'checked-in'
              : checkInState === 'checked-out'
                ? 'checked-out'
                : 'active'
          }
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-[17px] font-700 text-foreground">{ACTIVE_EVENT.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin size={13} className="text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">{ACTIVE_EVENT.location}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[12px] font-600 text-muted-foreground uppercase tracking-wide">
              Your Role
            </p>
            <p className="text-[13px] font-700 text-primary mt-0.5">{ACTIVE_EVENT.role}</p>
          </div>
        </div>

        {/* Event details row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-muted rounded-xl p-3">
            <p className="text-[10.5px] font-600 uppercase tracking-wide text-muted-foreground mb-0.5">
              Time
            </p>
            <p className="text-[13px] font-700 text-foreground">{ACTIVE_EVENT.startTime}</p>
            <p className="text-[11px] text-muted-foreground">– {ACTIVE_EVENT.endTime}</p>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <p className="text-[10.5px] font-600 uppercase tracking-wide text-muted-foreground mb-0.5">
              Volunteers
            </p>
            <p className="text-[13px] font-700 text-foreground font-tabular">
              {ACTIVE_EVENT.volunteersCheckedIn}/{ACTIVE_EVENT.totalSlots}
            </p>
            <p className="text-[11px] text-muted-foreground">checked in</p>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <p className="text-[10.5px] font-600 uppercase tracking-wide text-muted-foreground mb-0.5">
              Coordinator
            </p>
            <p className="text-[13px] font-700 text-foreground truncate">
              {ACTIVE_EVENT.coordinator}
            </p>
            <p className="text-[11px] text-muted-foreground">Lead</p>
          </div>
        </div>

        {/* Timer (when checked in) */}
        {checkInState === 'checked-in' && (
          <div className="bg-success/8 border border-success/20 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-600 uppercase tracking-wide text-success mb-1">
                Time in session
              </p>
              <p className="text-3xl font-800 text-success font-tabular">
                {formatElapsed(elapsedSeconds)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Checked in at</p>
              <p className="text-[14px] font-700 text-foreground">{checkInTime}</p>
            </div>
          </div>
        )}

        {/* Checked out summary */}
        {checkInState === 'checked-out' && (
          <div className="bg-muted border border-border rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-success" />
              <div>
                <p className="text-[13px] font-700 text-foreground">Session complete</p>
                <p className="text-[12px] text-muted-foreground">
                  {checkInTime} – {checkOutTime}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Logged</p>
              <p className="text-[18px] font-800 text-success font-tabular">
                {(elapsedSeconds / 3600).toFixed(2)} hrs
              </p>
            </div>
          </div>
        )}

        {/* Check-in window notice */}
        {checkInState === 'not-started' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/6 border border-primary/15 mb-4">
            <AlertCircle size={14} className="text-primary flex-shrink-0" />
            <p className="text-[12.5px] text-primary font-500">
              Check-in window opens at {ACTIVE_EVENT.checkInOpenAt}. You can check in now.
            </p>
          </div>
        )}

        {/* Action button */}
        {checkInState === 'not-started' && (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-primary text-white font-700 text-[14px]
              hover:bg-primary-dark active:scale-[0.99]
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-150 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Checking in…
              </>
            ) : (
              <>
                <LogIn size={16} /> Check In to Event
              </>
            )}
          </button>
        )}

        {checkInState === 'checked-in' && (
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-success text-white font-700 text-[14px]
              hover:bg-green-700 active:scale-[0.99]
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-150 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Checking out…
              </>
            ) : (
              <>
                <LogOut size={16} /> Check Out of Event
              </>
            )}
          </button>
        )}

        {checkInState === 'checked-out' && (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-muted-foreground text-[14px] font-600">
            <CheckCircle2 size={16} className="text-success" />
            Hours logged to your record
          </div>
        )}

        {/* Check-in timer note */}
        {checkInState === 'not-started' && (
          <div className="flex items-center gap-1.5 mt-3 justify-center">
            <Clock size={12} className="text-muted-foreground" />
            <p className="text-[11.5px] text-muted-foreground">
              Check-in closes at {ACTIVE_EVENT.endTime}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
