'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getActivityByCode } from '@/lib/api/activities';
import { getMyCheckins, checkinWithCode } from '@/lib/api/checkins';

import { CheckCircle2, Clock, MapPin, Calendar, Loader2, AlertTriangle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';

export default function CheckinPage() {
  const { code } = useParams<{ code: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const [activity, setActivity] = useState<any>(null);
  const [checkinRecord, setCheckinRecord] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-up-login-screen');
      return;
    }
    if (user && code) fetchActivity();
  }, [user, code, authLoading]);

  useEffect(() => {
    let interval: any;
    if (checkinRecord?.status === 'approved' && checkinRecord?.checkin_time) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(checkinRecord.checkin_time).getTime()) / 1000);
        setTimer(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [checkinRecord]);

  const fetchActivity = async () => {
    setPageLoading(true);
    try {
      const act = await getActivityByCode(code);
      setActivity(act);

      if (act && user) {
        const my = await getMyCheckins();
        const record = my.find((r: any) => r.activity_id === act.id) || null;
        setCheckinRecord(record);
      }
    } catch (err) {
      console.log('Checkin fetch error:', err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!user || !activity) return;
    setActionLoading(true);
    try {
      const data = await checkinWithCode(String(code).toUpperCase(), activity.id);
      setCheckinRecord(data);

      toast.success('Check-in request submitted! Awaiting admin approval.');
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm">
          <AlertTriangle size={48} className="text-warning mx-auto mb-4" />
          <h2 className="text-xl font-700 text-foreground mb-2">Invalid Check-in Link</h2>
          <p className="text-[14px] text-muted-foreground mb-6">This check-in link is not valid or has expired.</p>
          <button onClick={() => router.push('/volunteer-dashboard')} className="px-6 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <AppLogo size={36} />
          <div>
            <p className="font-display font-700 text-lg text-foreground">NoHunger</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Event Check-in</p>
          </div>
        </div>

        {/* Activity card */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 mb-5">
          <h2 className="text-[18px] font-700 text-foreground mb-3">{activity.title}</h2>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Calendar size={14} />
                <span>{new Date(activity.start_date || activity.startDate).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {activity.location && (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <MapPin size={14} />
                <span>{activity.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/8 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[12px] font-600 text-primary">Check-in code: {code}</span>
          </div>
        </div>

        {/* Status / Action */}
        {!checkinRecord && (
          <div className="bg-card border border-border rounded-2xl shadow-card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-primary" />
            </div>
            <h3 className="text-[17px] font-700 text-foreground mb-2">Ready to check in?</h3>
            <p className="text-[13px] text-muted-foreground mb-6">
              Hi {profile?.full_name?.split(' ')[0]}! Tap the button below to submit your check-in request.
            </p>
            <button
              onClick={handleCheckin}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60 text-[15px]"
            >
              {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Check In Now</>}
            </button>
          </div>
        )}

        {checkinRecord?.status === 'pending' && (
          <div className="bg-warning/8 border border-warning/25 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-warning" />
            </div>
            <h3 className="text-[17px] font-700 text-foreground mb-2">Check-in Pending</h3>
            <p className="text-[13px] text-muted-foreground">Your check-in request has been submitted. Waiting for admin approval.</p>
          </div>
        )}

        {checkinRecord?.status === 'approved' && (
          <div className="bg-success/8 border border-success/25 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-success" />
            </div>
            <h3 className="text-[17px] font-700 text-foreground mb-2">You're checked in! ✅</h3>
            <div className="text-4xl font-800 font-tabular text-success mb-2">{formatTimer(timer)}</div>
            <p className="text-[12px] text-muted-foreground">Session timer · Admin will check you out after the event</p>
          </div>
        )}

        {checkinRecord?.status === 'checked_out' && (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <LogOut size={28} className="text-primary" />
            </div>
            <h3 className="text-[17px] font-700 text-foreground mb-2">Session Complete!</h3>
            <p className="text-[13px] text-muted-foreground mb-3">You've been checked out.</p>
            <div className="text-3xl font-800 font-tabular text-primary mb-1">{checkinRecord.hours_spent || 0} hrs</div>
            <p className="text-[12px] text-muted-foreground">Hours logged for this event</p>
          </div>
        )}

        {checkinRecord?.status === 'rejected' && (
          <div className="bg-destructive/8 border border-destructive/25 rounded-2xl p-6 text-center">
            <AlertTriangle size={32} className="text-destructive mx-auto mb-3" />
            <h3 className="text-[17px] font-700 text-foreground mb-2">Check-in Rejected</h3>
            <p className="text-[13px] text-muted-foreground">Your check-in was not approved. Please contact the admin team.</p>
          </div>
        )}

        <button onClick={() => router.push('/volunteer-dashboard')} className="w-full mt-4 py-2.5 text-[13px] font-600 text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
