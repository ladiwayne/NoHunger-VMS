'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getMyCheckins, checkinWithCode, checkoutFromActivity } from '@/lib/api/checkins';
import { getMyInvitations, respondToInvitation } from '@/lib/api/invitations';
import { getActivities } from '@/lib/api/activities';
import {
  Clock,
  CalendarCheck,
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Calendar,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/navigation';

export default function VolunteerDashboardPage() {
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState({
    totalHours: 0,
    eventsAttended: 0,
    pendingInvitations: 0,
    activeTasks: 0,
  });
  const [invitations, setInvitations] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [activeCheckin, setActiveCheckin] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [checkinCode, setCheckinCode] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (activeCheckin?.checkin_time) {
      interval = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(activeCheckin.checkin_time).getTime()) / 1000
        );
        setTimer(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCheckin]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [checkins, invitationsList, activities] = await Promise.all([
        getMyCheckins(),
        getMyInvitations(),
        getActivities(),
      ]);

      const completedCheckins = checkins.filter((c) => c.status === 'checked_out');
      const totalHours = completedCheckins.reduce((sum, c) => sum + (c.hours_spent || 0), 0);
      const activeCheck = checkins.find((c) => c.status === 'approved' && !c.checkout_time);
      if (activeCheck) setActiveCheckin(activeCheck);

      const pendingInvs = invitationsList.filter((i) => i.status === 'pending');

      setStats({
        totalHours: Math.round(totalHours * 10) / 10,
        eventsAttended: completedCheckins.length,
        pendingInvitations: pendingInvs.length,
        activeTasks: 0,
      });

      setInvitations(pendingInvs.slice(0, 5));

      const now = new Date();
      const upcoming = activities
        .filter(
          (a) =>
            ['published', 'ongoing'].includes(a.status) &&
            a.start_date &&
            new Date(a.start_date) >= now
        )
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        .slice(0, 5);
      setUpcomingEvents(upcoming);

      // Weekly hours chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toLocaleDateString('en', { weekday: 'short' }),
          hours: 0,
          fullDate: d.toDateString(),
        };
      });
      completedCheckins.forEach((c) => {
        if (c.checkin_time) {
          const day = new Date(c.checkin_time).toDateString();
          const idx = last7Days.findIndex((d) => d.fullDate === day);
          if (idx >= 0) last7Days[idx].hours += c.hours_spent || 0;
        }
      });
      setWeeklyData(last7Days);
    } catch (err) {
      console.log('Dashboard fetch error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleInvitationResponse = async (
    invitationId: string,
    status: 'accepted' | 'rejected'
  ) => {
    try {
      await respondToInvitation(invitationId, status);
      toast.success(status === 'accepted' ? '🎉 Invitation accepted!' : 'Invitation declined.');
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to respond to invitation.');
    }
  };

  const handleCheckinCode = () => {
    const code = checkinCode.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a check-in code.');
      return;
    }
    router.push(`/checkin/${code}`);
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );

  return (
    <AppLayout activePath="/volunteer-dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-700 text-foreground">
              {greeting()}, {profile?.full_name?.split(' ')[0] || 'Champion'} 👋
            </h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString('en', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {profile?.region ? ` · ${profile.region}` : ''}
            </p>
          </div>
          {profile?.volunteer_status === 'pending' && (
            <div className="flex items-center gap-2 text-[12px] text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
              <AlertTriangle size={14} />
              <span className="font-600">Pending admin approval for Champion access</span>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        {dataLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-2xl p-5 h-28 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/hours-tracking"
              className="col-span-2 group bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-[0_4px_16px_0_rgba(22,101,52,0.12)] hover:border-[hsl(142,72%,78%)] transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-[hsl(142,72%,92%)] flex items-center justify-center mb-4">
                <Clock size={18} className="text-[hsl(142,72%,22%)]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-700 font-tabular text-foreground">
                  {stats.totalHours}
                </span>
                <span className="text-[13px] font-500 text-muted-foreground">hrs</span>
              </div>
              <p className="text-[12.5px] font-600 text-muted-foreground mt-0.5 uppercase tracking-wide">
                Total Hours Logged
              </p>
            </Link>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-[0_4px_16px_0_rgba(22,101,52,0.10)] hover:border-[hsl(142,72%,78%)] transition-all">
              <div className="w-9 h-9 rounded-xl bg-[hsl(142,72%,92%)] flex items-center justify-center mb-4">
                <CalendarCheck size={18} className="text-[hsl(142,72%,22%)]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-700 font-tabular text-foreground">
                  {stats.eventsAttended}
                </span>
                <span className="text-[13px] font-500 text-muted-foreground">events</span>
              </div>
              <p className="text-[12.5px] font-600 text-muted-foreground mt-0.5 uppercase tracking-wide">
                Events Attended
              </p>
            </div>
            <Link
              href="/invitations"
              className={`group bg-card rounded-2xl p-5 shadow-card hover:shadow-[0_4px_16px_0_rgba(22,101,52,0.10)] transition-all ${stats.pendingInvitations > 0 ? 'border border-warning/30 bg-warning/4' : 'border border-border hover:border-[hsl(142,72%,78%)]'}`}
            >
              <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
                <Bell size={18} className="text-warning" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-700 font-tabular text-foreground">
                  {stats.pendingInvitations}
                </span>
                <span className="text-[13px] font-500 text-muted-foreground">pending</span>
              </div>
              <p className="text-[12.5px] font-600 text-muted-foreground mt-0.5 uppercase tracking-wide">
                Invitations
              </p>
            </Link>
          </div>
        )}

        {/* Check-in Code Entry */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={16} className="text-primary" />
            <h3 className="text-[15px] font-700 text-foreground">Event Check-in</h3>
          </div>
          <p className="text-[13px] text-muted-foreground mb-3">
            Enter the check-in code provided at your event to log your attendance.
          </p>
          <div className="flex gap-2">
            <input
              value={checkinCode}
              onChange={(e) => setCheckinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckinCode()}
              placeholder="Enter code (e.g. ABC123)"
              className="flex-1 px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] font-700 text-foreground tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <button
              onClick={handleCheckinCode}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all text-[13.5px]"
            >
              Check In <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Active Check-in Widget */}
        {activeCheckin && (
          <div className="bg-success/8 border border-success/25 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-[14px] font-700 text-foreground">You're checked in!</p>
                  <p className="text-[12px] text-muted-foreground">
                    Your Champion session timer is running
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-700 font-tabular text-success">{formatTimer(timer)}</p>
                <p className="text-[11px] text-muted-foreground">elapsed time</p>
              </div>
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-card p-5">
            <h3 className="text-[15px] font-700 text-foreground mb-1">Weekly Hours</h3>
            <p className="text-[12px] text-muted-foreground mb-5">
              Your Champion hours over the last 7 days
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142,72%,29%)" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="hsl(142,72%,29%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,12%,88%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(140,10%,48%)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(140,10%,48%)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid hsl(140,12%,88%)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="hsl(142,72%,29%)"
                  strokeWidth={2}
                  fill="url(#hoursGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Upcoming events */}
          <div className="bg-card border border-border rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-700 text-foreground">Upcoming Events</h3>
              <Link
                href="/activities"
                className="text-[12px] text-primary font-600 hover:underline"
              >
                View all
              </Link>
            </div>
            {dataLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-6">
                No upcoming events
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-3 bg-muted rounded-xl">
                    <p className="text-[13px] font-600 text-foreground truncate">{event.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Calendar size={11} className="text-muted-foreground" />
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(event.start_date).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin size={11} className="text-muted-foreground" />
                        <p className="text-[11px] text-muted-foreground truncate">
                          {event.location}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-card border border-border rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-700 text-foreground">Pending Invitations</h3>
                <p className="text-[12px] text-muted-foreground">
                  {invitations.length} invitation{invitations.length > 1 ? 's' : ''} awaiting your
                  response
                </p>
              </div>
              <Link
                href="/invitations"
                className="text-[12px] text-primary font-600 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {invitations.slice(0, 3).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-4 p-4 bg-warning/5 border border-warning/20 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-600 text-foreground truncate">
                      {inv.activities?.title}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {inv.activities?.start_date
                        ? new Date(inv.activities.start_date).toLocaleDateString('en', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })
                        : ''}
                      {inv.activities?.location ? ` · ${inv.activities.location}` : ''}
                    </p>
                    {inv.message && (
                      <p className="text-[11px] text-muted-foreground mt-1 italic truncate">
                        "{inv.message}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleInvitationResponse(inv.id, 'accepted')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(142,72%,92%)] text-[hsl(142,72%,20%)] border border-[hsl(142,72%,72%)] rounded-lg text-[12px] font-600 hover:bg-[hsl(142,72%,85%)] transition-colors"
                    >
                      <CheckCircle2 size={13} /> Accept
                    </button>
                    <button
                      onClick={() => handleInvitationResponse(inv.id, 'rejected')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground border border-border rounded-lg text-[12px] font-600 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <XCircle size={13} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NoHunger Mission Banner */}
        <div className="bg-gradient-to-r from-[hsl(142,72%,20%)] to-[hsl(158,64%,18%)] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-[11px] font-700 text-green-200/80 uppercase tracking-widest mb-1">
              Nohunger Initiative Nigeria
            </p>
            <h3 className="text-[15px] font-700 text-white mb-1">
              Fighting hunger across Nigeria, one meal at a time.
            </h3>
            <p className="text-[12.5px] text-green-100/80 leading-relaxed">
              Nohunger Initiative has distributed over 1.5 million meals to families in need across
              52 communities in Nigeria. Your Champion hours help fuel this mission.
            </p>
          </div>
          <a
            href="https://www.nohungerfoodbank.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[12.5px] font-600 rounded-xl transition-colors whitespace-nowrap"
          >
            Visit Website →
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
