'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAdminStats, getTopVolunteers, getAdminActivities, getAdminVolunteers } from '@/lib/api/admin';
import { getAdminCheckins } from '@/lib/api/admin';
import {
  Users, CalendarDays, Clock, CheckSquare, Loader2, UserCheck,
  Activity, MessageSquare, CheckCircle2, TrendingUp, MapPin,
  BarChart2, Award, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Link from 'next/link';

const NIGERIA_REGIONS = [
  'Lagos State', 'Abuja (FCT)', 'Kano State', 'Rivers State',
  'Oyo State', 'Kaduna State', 'Enugu State', 'Delta State',
  'Anambra State', 'Ogun State', 'Imo State', 'Plateau State',
];

const PIE_COLORS = ['hsl(142,72%,29%)', 'hsl(142,60%,45%)', 'hsl(142,50%,60%)', 'hsl(142,40%,72%)', 'hsl(142,30%,82%)', '#e8621a', '#d97706', '#7c3aed'];

type DateRange = '30d' | '90d' | '6m' | '1y';

export default function AdminDashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalVolunteers: 0, pendingApprovals: 0, totalActivities: 0,
    pendingCheckins: 0, totalHours: 0, completedActivities: 0,
    approvedVolunteers: 0, totalCheckins: 0,
  });
  const [topVolunteers, setTopVolunteers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [monthlyHours, setMonthlyHours] = useState<any[]>([]);
  const [volunteerGrowth, setVolunteerGrowth] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [activityStatusData, setActivityStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('6m');

  useEffect(() => {
    if (!authLoading) {
      if (profile?.role !== 'admin') { router.push('/volunteer-dashboard'); return; }
      fetchData();
    }
  }, [profile, authLoading, dateRange]);

  const getMonthsBack = () => {
    const map: Record<DateRange, number> = { '30d': 1, '90d': 3, '6m': 6, '1y': 12 };
    return map[dateRange];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const monthsBack = getMonthsBack();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsBack);

      const [statsData, checkins, volunteers, activities, topVols] = await Promise.all([
        getAdminStats(),
        getAdminCheckins(),
        getAdminVolunteers(),
        getAdminActivities(),
        getTopVolunteers(5),
      ]);

      const completedCheckins = checkins.filter((c) => c.status === 'checked_out');
      const dateFiltered = completedCheckins.filter((c) => c.checkin_time && new Date(c.checkin_time) >= startDate);
      const totalHours = dateFiltered.reduce((s, c) => s + (c.hours_spent || 0), 0);

      setStats({
        totalVolunteers: statsData.totalVolunteers || 0,
        pendingApprovals: statsData.pendingApprovals || 0,
        approvedVolunteers: statsData.approvedVolunteers || 0,
        totalActivities: statsData.totalActivities || 0,
        completedActivities: statsData.completedActivities || 0,
        pendingCheckins: statsData.pendingCheckins || 0,
        totalCheckins: statsData.totalCheckins || 0,
        totalHours: Math.round((statsData.totalHours || totalHours) * 10) / 10,
      });
      setTopVolunteers(topVols || []);
      setRecentActivities((activities || []).slice(0, 5));

      // Monthly hours chart
      const months: Record<string, number> = {};
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months[d.toLocaleDateString('en', { month: 'short', year: monthsBack > 6 ? '2-digit' : undefined })] = 0;
      }
      dateFiltered.forEach(c => {
        if (c.checkin_time) {
          const key = new Date(c.checkin_time).toLocaleDateString('en', { month: 'short', year: monthsBack > 6 ? '2-digit' : undefined });
          if (key in months) months[key] += c.hours_spent || 0;
        }
      });
      setMonthlyHours(Object.entries(months).map(([month, hours]) => ({ month, hours: Math.round(hours * 10) / 10 })));

      // Volunteer growth (cumulative)
      const growthMonths: Record<string, number> = {};
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        growthMonths[d.toLocaleDateString('en', { month: 'short' })] = 0;
      }
      volunteers?.forEach(v => {
        if (v.created_at) {
          const key = new Date(v.created_at).toLocaleDateString('en', { month: 'short' });
          if (key in growthMonths) growthMonths[key] += 1;
        }
      });
      let cumulative = 0;
      setVolunteerGrowth(Object.entries(growthMonths).map(([month, count]) => {
        cumulative += count;
        return { month, new: count, total: cumulative };
      }));

      // Regional breakdown
      const regionCounts: Record<string, number> = {};
      volunteers?.forEach(v => {
        const r = v.region || 'Unknown';
        regionCounts[r] = (regionCounts[r] || 0) + 1;
      });
      setRegionData(
        Object.entries(regionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name: name.replace(' Region', ''), value }))
      );

      // Activity status breakdown
      const statusCounts: Record<string, number> = { published: 0, ongoing: 0, completed: 0, draft: 0, cancelled: 0 };
      activities?.forEach(a => { if (a.status in statusCounts) statusCounts[a.status] += 1; });
      setActivityStatusData(Object.entries(statusCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })));

    } catch (err) {
      console.log('Admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const approvalRate = stats.totalVolunteers > 0 ? Math.round((stats.approvedVolunteers / stats.totalVolunteers) * 100) : 0;
  const completionRate = stats.totalActivities > 0 ? Math.round((stats.completedActivities / stats.totalActivities) * 100) : 0;

  const kpis = [
    { label: 'Total Volunteers', value: stats.totalVolunteers, sub: `${approvalRate}% approved`, icon: Users, color: 'text-[hsl(142,72%,22%)]', bg: 'bg-[hsl(142,72%,92%)]', href: '/admin/volunteers', alert: false },
    { label: 'Pending Approvals', value: stats.pendingApprovals, sub: 'awaiting review', icon: UserCheck, color: 'text-warning', bg: 'bg-warning/10', href: '/admin/volunteers', alert: stats.pendingApprovals > 0 },
    { label: 'Total Activities', value: stats.totalActivities, sub: `${completionRate}% completed`, icon: CalendarDays, color: 'text-[hsl(142,72%,22%)]', bg: 'bg-[hsl(142,72%,92%)]', href: '/admin/activities', alert: false },
    { label: 'Pending Check-ins', value: stats.pendingCheckins, sub: 'need approval', icon: CheckSquare, color: 'text-warning', bg: 'bg-warning/10', href: '/admin/checkins', alert: stats.pendingCheckins > 0 },
    { label: 'Total Hours Logged', value: stats.totalHours, sub: `${stats.totalCheckins} sessions`, icon: Clock, color: 'text-[hsl(142,72%,22%)]', bg: 'bg-[hsl(142,72%,92%)]', href: '/admin/volunteers', alert: false },
    { label: 'Completed Events', value: stats.completedActivities, sub: 'activities done', icon: CheckCircle2, color: 'text-[hsl(142,72%,22%)]', bg: 'bg-[hsl(142,72%,92%)]', href: '/admin/activities', alert: false },
  ];

  const activityStatusColor = (status: string) => {
    const map: Record<string, string> = {
      published: 'bg-primary/10 text-primary',
      ongoing: 'bg-success/10 text-success',
      completed: 'bg-muted text-muted-foreground',
      draft: 'bg-warning/10 text-warning',
      cancelled: 'bg-destructive/10 text-destructive',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' },
  ];

  return (
    <AppLayout activePath="/admin/dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Admin Analytics Dashboard</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · NoHunger Nigeria
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-xl p-1 gap-0.5">
              {dateRangeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDateRange(opt.value)}
                  className={`px-3 py-1.5 text-[12px] font-600 rounded-lg transition-all ${dateRange === opt.value ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-card border border-border shadow-card hover:border-primary/30 transition-all"
              title="Refresh data"
            >
              <RefreshCw size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map(kpi => {
            const KpiIcon = kpi.icon;
            return (
              <Link key={kpi.label} href={kpi.href} className={`group bg-card border rounded-2xl p-4 shadow-card hover:shadow-[0_4px_16px_0_rgba(22,101,52,0.12)] hover:border-[hsl(142,72%,78%)] transition-all ${kpi.alert ? 'border-warning/30' : 'border-border'}`}>
                <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                  <KpiIcon size={16} className={kpi.color} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-700 font-tabular text-foreground">{kpi.value}</span>
                </div>
                <p className="text-[11px] font-600 text-muted-foreground mt-0.5 uppercase tracking-wide leading-tight">{kpi.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/admin/volunteers?panel=message" className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-card hover:border-primary/30 hover:shadow-[0_4px_16px_0_rgba(22,101,52,0.10)] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-[13.5px] font-700 text-foreground">Send Message</p>
              <p className="text-[11px] text-muted-foreground">Message a volunteer</p>
            </div>
          </Link>
          <Link href="/admin/volunteers" className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-card hover:border-primary/30 hover:shadow-[0_4px_16px_0_rgba(22,101,52,0.10)] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-success" />
            </div>
            <div>
              <p className="text-[13.5px] font-700 text-foreground">Bulk Approve</p>
              <p className="text-[11px] text-muted-foreground">{stats.pendingApprovals} pending volunteers</p>
            </div>
          </Link>
          <Link href="/admin/checkins?panel=code-entry" className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-card hover:border-primary/30 hover:shadow-[0_4px_16px_0_rgba(22,101,52,0.10)] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
              <CheckSquare size={18} className="text-warning" />
            </div>
            <div>
              <p className="text-[13.5px] font-700 text-foreground">Code Lookup</p>
              <p className="text-[11px] text-muted-foreground">Look up by check-in code</p>
            </div>
          </Link>
        </div>

        {/* Charts Row 1: Hours + Volunteer Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly hours chart */}
          <div className="bg-card border border-border rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[15px] font-700 text-foreground">Volunteer Hours</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <BarChart2 size={13} />
                <span>Monthly</span>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground mb-4">Total hours logged across all activities</p>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={monthlyHours} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,12%,88%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(140,10%,48%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(140,10%,48%)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(140,12%,88%)' }} formatter={(v) => [`${v} hrs`, 'Hours']} />
                <Bar dataKey="hours" fill="hsl(142,72%,29%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Volunteer growth chart */}
          <div className="bg-card border border-border rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[15px] font-700 text-foreground">Volunteer Growth</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <TrendingUp size={13} />
                <span>Cumulative</span>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground mb-4">New volunteer registrations over time</p>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={volunteerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,12%,88%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(140,10%,48%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(140,10%,48%)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(140,12%,88%)' }} />
                <Line type="monotone" dataKey="new" stroke="#e8621a" strokeWidth={2} dot={{ r: 3, fill: '#e8621a' }} name="New" />
                <Line type="monotone" dataKey="total" stroke="hsl(142,72%,29%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(142,72%,29%)' }} name="Total" />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2: Regional + Activity Status + Top Volunteers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Regional breakdown */}
          <div className="bg-card border border-border rounded-2xl shadow-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} className="text-primary" />
              <h3 className="text-[15px] font-700 text-foreground">Regional Breakdown</h3>
            </div>
            <p className="text-[12px] text-muted-foreground mb-4">Volunteers by region</p>
            {regionData.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={regionData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {regionData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Activity status breakdown */}
          <div className="bg-card border border-border rounded-2xl shadow-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} className="text-primary" />
              <h3 className="text-[15px] font-700 text-foreground">Activity Status</h3>
            </div>
            <p className="text-[12px] text-muted-foreground mb-4">Distribution by status</p>
            {activityStatusData.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3 mt-2">
                {activityStatusData.map((item, i) => {
                  const total = activityStatusData.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-600 text-foreground capitalize">{item.name}</span>
                        <span className="text-[12px] font-700 text-muted-foreground">{item.value} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top volunteers */}
          <div className="bg-card border border-border rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award size={14} className="text-primary" />
                <h3 className="text-[15px] font-700 text-foreground">Top Volunteers</h3>
              </div>
              <Link href="/admin/volunteers" className="text-[12px] text-primary font-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {topVolunteers.length === 0 ? (
                <p className="text-[13px] text-muted-foreground text-center py-4">No data yet</p>
              ) : topVolunteers.map((v, i) => (
                <div key={v.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-yellow-100' : i === 1 ? 'bg-gray-100' : i === 2 ? 'bg-orange-100' : 'bg-primary/10'}`}>
                    <span className={`text-[11px] font-700 ${i === 0 ? 'text-yellow-700' : i === 1 ? 'text-gray-600' : i === 2 ? 'text-orange-700' : 'text-primary'}`}>{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-600 text-foreground truncate">{v.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">{v.region ? v.region.replace(' State', '') : 'Nigeria'}</p>
                  </div>
                  <span className="text-[13px] font-700 text-primary font-tabular">{v.total_hours} hrs</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activities table */}
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="text-[15px] font-700 text-foreground">Recent Activities</h3>
            <Link href="/admin/activities" className="text-[12px] text-primary font-600 hover:underline">Manage all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Activity', 'Date', 'Location', 'Status', 'Check-in Code'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-700 text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivities.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px] text-muted-foreground">No activities yet</td></tr>
                ) : recentActivities.map(act => (
                  <tr key={act.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-600 text-foreground max-w-[200px] truncate">{act.title}</td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground whitespace-nowrap">
                      {new Date(act.start_date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground max-w-[150px] truncate">{act.location || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-700 px-2.5 py-1 rounded-full uppercase tracking-wide ${activityStatusColor(act.status)}`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[12px] font-700 text-primary bg-primary/8 px-2 py-0.5 rounded-md">{act.checkin_code || '—'}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
