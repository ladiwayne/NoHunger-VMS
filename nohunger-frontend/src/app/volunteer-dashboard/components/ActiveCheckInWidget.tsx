'use client';

import React, { useEffect, useState } from 'react';
import { formatHoursHHMM } from '@/lib/formatHours';
import { MapPin, Clock, CheckCircle2, LogIn, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { checkinWithCode, checkoutFromActivity, getMyCheckins } from '@/lib/api/checkins';
import { getEvents } from '@/lib/api/events';

type CheckInState = 'not-started' | 'checked-in' | 'checked-out';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

export default function ActiveCheckInWidget() {
  const { user } = useAuth();
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [checkinRecord, setCheckinRecord] = useState<any>(null);
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

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [events, myCheckins] = await Promise.all([getEvents(), getMyCheckins()]);
        const nextEvent = (events || []).find((event: any) => ['published', 'ongoing'].includes(event.status)) || (events || [])[0] || null;
        setEventDetails(nextEvent);

        const activeRecord = (myCheckins || []).find((record: any) => record.status === 'approved' && !record.checkout_time) || null;
        if (activeRecord) {
          setCheckinRecord(activeRecord);
          setCheckInState('checked-in');
          setCheckInTime(activeRecord.checkin_time || null);
          return;
        }

        const completedRecord = (myCheckins || []).find((record: any) => record.status === 'checked_out' || (record.checkout_time && record.status === 'approved')) || null;
        if (completedRecord) {
          setCheckinRecord(completedRecord);
          setCheckInState('checked-out');
          setCheckInTime(completedRecord.checkin_time || null);
          setCheckOutTime(completedRecord.checkout_time || null);
        }
      } catch (error) {
        console.error('Failed to load active event widget', error);
      }
    };

    loadData();
  }, [user]);

  const handleCheckIn = async () => {
    if (!eventDetails?.check_in_code) {
      toast.error('No check-in code is available for the current event yet.');
      return;
    }

    setLoading(true);
    try {
      const data = await checkinWithCode(String(eventDetails.check_in_code));
      setCheckinRecord(data);
      setCheckInState('checked-in');
      setCheckInTime(data.checkin_time || null);
      setCheckOutTime(null);
      setElapsedSeconds(0);
      toast.success(`✅ Checked in to ${eventDetails.title}.`, {
        description: 'Your attendance has been received and is pending admin approval.',
        duration: 4000,
      });
    } catch (error: any) {
      toast.error(error.message || 'Unable to check in right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!checkinRecord?.id) return;

    setLoading(true);
    try {
      const data = await checkoutFromActivity(checkinRecord.id);
      setCheckinRecord(data);
      setCheckOutTime(data.checkout_time || null);
      setCheckInState('checked-out');
      toast.success(`✅ Checked out. ${formatHoursHHMM(data.hours_spent || 0)} logged.`, {
        description: 'Your volunteer hours are now waiting for final approval.',
        duration: 5000,
      });
    } catch (error: any) {
      toast.error(error.message || 'Unable to check out right now.');
    } finally {
      setLoading(false);
    }
  };

  const eventTitle = eventDetails?.title || 'Community event';
  const eventLocation = eventDetails?.location || 'Location to be confirmed';
  const eventTime = eventDetails?.start_date
    ? new Date(eventDetails.start_date).toLocaleString('en', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'To be confirmed';
  const coordinator = eventDetails?.coordinator?.full_name || eventDetails?.coordinator?.firstName || 'No Hunger team';
  const totalSlots = eventDetails?.max_volunteers || 20;

  return (
    <div
      className={`
      bg-card border rounded-2xl shadow-card overflow-hidden
      ${checkInState === 'checked-in' ? 'border-success/30' : 'border-border'}
    `}
    >
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
            <h3 className="text-[17px] font-700 text-foreground">{eventTitle}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin size={13} className="text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">{eventLocation}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[12px] font-600 text-muted-foreground uppercase tracking-wide">
              Your Role
            </p>
            <p className="text-[13px] font-700 text-primary mt-0.5">Volunteer</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-muted rounded-xl p-3">
            <p className="text-[10.5px] font-600 uppercase tracking-wide text-muted-foreground mb-0.5">
              Time
            </p>
            <p className="text-[13px] font-700 text-foreground">{eventTime}</p>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <p className="text-[10.5px] font-600 uppercase tracking-wide text-muted-foreground mb-0.5">
              Capacity
            </p>
            <p className="text-[13px] font-700 text-foreground font-tabular">{totalSlots}</p>
            <p className="text-[11px] text-muted-foreground">slots</p>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <p className="text-[10.5px] font-600 uppercase tracking-wide text-muted-foreground mb-0.5">
              Coordinator
            </p>
            <p className="text-[13px] font-700 text-foreground truncate">{coordinator}</p>
          </div>
        </div>

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
              <p className="text-[14px] font-700 text-foreground">{checkInTime ? new Date(checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
            </div>
          </div>
        )}

        {checkInState === 'checked-out' && (
          <div className="bg-muted border border-border rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-success" />
              <div>
                <p className="text-[13px] font-700 text-foreground">Session complete</p>
                <p className="text-[12px] text-muted-foreground">
                  {checkInTime ? new Date(checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'} – {checkOutTime ? new Date(checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Logged</p>
              <p className="text-[18px] font-800 text-success font-tabular">
                {formatHoursHHMM(checkinRecord?.hours_spent || 0)}
              </p>
            </div>
          </div>
        )}

        {checkInState === 'not-started' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/6 border border-primary/15 mb-4">
            <AlertCircle size={14} className="text-primary flex-shrink-0" />
            <p className="text-[12.5px] text-primary font-500">
              Your next event is ready for check-in.
            </p>
          </div>
        )}

        {checkInState === 'not-started' && (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-700 text-[14px] hover:bg-primary-dark active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Checking in…</>
            ) : (
              <><LogIn size={16} /> Check In to Event</>
            )}
          </button>
        )}

        {checkInState === 'checked-in' && (
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-success text-white font-700 text-[14px] hover:bg-green-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Checking out…</>
            ) : (
              <><LogOut size={16} /> Check Out of Event</>
            )}
          </button>
        )}

        {checkInState === 'checked-out' && (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-muted-foreground text-[14px] font-600">
            <CheckCircle2 size={16} className="text-success" />
            Hours logged to your record
          </div>
        )}

        {checkInState === 'not-started' && (
          <div className="flex items-center gap-1.5 mt-3 justify-center">
            <Clock size={12} className="text-muted-foreground" />
            <p className="text-[11.5px] text-muted-foreground">
              Check-in is available once the event begins.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
