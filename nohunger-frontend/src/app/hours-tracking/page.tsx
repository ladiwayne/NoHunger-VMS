'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getMyCheckins } from '@/lib/api/checkins';
import { Clock, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

export default function HoursTrackingPage() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, events: 0, avgPerEvent: 0 });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getMyCheckins();
      const records = (data || []).filter((r) => r.status === 'checked_out');
      setSessions(records);

      const total = records.reduce((s, r) => s + (r.hours_spent || 0), 0);
      const now = new Date();
      const thisMonth = records
        .filter((r) => r.checkin_time && new Date(r.checkin_time).getMonth() === now.getMonth())
        .reduce((s, r) => s + (r.hours_spent || 0), 0);

      setStats({
        total: Math.round(total * 10) / 10,
        thisMonth: Math.round(thisMonth * 10) / 10,
        events: records.length,
        avgPerEvent: records.length > 0 ? Math.round((total / records.length) * 10) / 10 : 0,
      });

      const months: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
        months[key] = 0;
      }
      records.forEach((r) => {
        if (r.checkin_time) {
          const d = new Date(r.checkin_time);
          const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
          if (key in months) months[key] += r.hours_spent || 0;
        }
      });
      setMonthlyData(
        Object.entries(months).map(([month, hours]) => ({
          month,
          hours: Math.round(hours * 10) / 10,
        }))
      );
    } catch (err) {
      console.log('Hours fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Event', 'Location', 'Date', 'Check-in', 'Check-out', 'Hours'],
      ...sessions.map((s) => [
        s.activity?.title || '',
        s.activity?.location || '',
        s.checkin_time ? new Date(s.checkin_time).toLocaleDateString() : '',
        s.checkin_time ? new Date(s.checkin_time).toLocaleTimeString() : '',
        s.checkout_time ? new Date(s.checkout_time).toLocaleTimeString() : '',
        s.hours_spent || 0,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nohunger-hours-${profile?.full_name?.replace(' ', '-') || 'volunteer'}.csv`;
    a.click();
  };

  const filtered = sessions;

  return (
    <AppLayout activePath="/hours-tracking">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Hours Tracking</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Your complete volunteer hours log
            </p>
          </div>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-[13.5px] font-600 text-foreground hover:bg-muted transition-all"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>

        {/* Summary cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-card border border-border rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Hours',
                value: stats.total,
                unit: 'hrs',
                icon: Clock,
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                label: 'This Month',
                value: stats.thisMonth,
                unit: 'hrs',
                icon: CalendarCheck,
                color: 'text-success',
                bg: 'bg-success/10',
              },
              {
                label: 'Events Attended',
                value: stats.events,
                unit: 'events',
                icon: CheckCircle2,
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                label: 'Avg per Event',
                value: stats.avgPerEvent,
                unit: 'hrs',
                icon: Clock,
                color: 'text-muted-foreground',
                bg: 'bg-muted',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-card border border-border rounded-2xl p-5 shadow-card"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}
                  >
                    <Icon size={18} className={card.color} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-700 font-tabular text-foreground">
                      {card.value}
                    </span>
                    <span className="text-[12px] text-muted-foreground">{card.unit}</span>
                  </div>
                  <p className="text-[12px] font-600 text-muted-foreground mt-0.5 uppercase tracking-wide">
                    {card.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Monthly chart */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5">
          <h3 className="text-[15px] font-700 text-foreground mb-1">Monthly Hours</h3>
          <p className="text-[12px] text-muted-foreground mb-5">
            Hours volunteered over the last 6 months
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,12%,88%)" />
              <XAxis
                dataKey="month"
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
              <Bar dataKey="hours" fill="hsl(142,72%,29%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hours Log Panel */}
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-[15px] font-700 text-foreground">Session Log</h3>
              <p className="text-[12px] text-muted-foreground">
                {filtered.length} completed sessions
              </p>
            </div>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Clock size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-[14px] font-600 text-foreground">No sessions yet</p>
              <p className="text-[12px] text-muted-foreground mt-1">
                Your completed volunteer sessions will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {['Event', 'Location', 'Date', 'Check-in', 'Check-out', 'Hours'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-700 text-muted-foreground uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                    >
                      <td className="px-4 py-3 text-[13px] font-600 text-foreground max-w-[200px] truncate">
                        {s.activity?.title || '—'}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-muted-foreground max-w-[150px] truncate">
                        {s.activity?.location || '—'}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-muted-foreground whitespace-nowrap">
                        {s.checkin_time
                          ? new Date(s.checkin_time).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-muted-foreground font-tabular">
                        {s.checkin_time
                          ? new Date(s.checkin_time).toLocaleTimeString('en', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-muted-foreground font-tabular">
                        {s.checkout_time
                          ? new Date(s.checkout_time).toLocaleTimeString('en', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-700 text-primary font-tabular">
                          {s.hours_spent || 0} hrs
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
