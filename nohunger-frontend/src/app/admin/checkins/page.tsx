'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCheckins, approveCheckin, rejectCheckin, approveCheckout } from '@/lib/api/checkins';
import { getActivityByCode } from '@/lib/api/activities';
import { CheckCircle2, XCircle, LogOut, Loader2, Search, QrCode, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';


type Panel = 'requests' | 'code-entry';

export default function AdminCheckinsPage() {
  useAuth();
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'checked_out' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<Panel>('requests');
  const [codeInput, setCodeInput] = useState('');
  const [codeActivity, setCodeActivity] = useState<any>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCheckins();
  }, []);

  const fetchCheckins = async () => {
    setLoading(true);
    try {
      const data = await getAllCheckins();
      setCheckins(data || []);
    } catch (err) {
      console.log('Checkins fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (checkinId: string, volunteerId: string, volunteerEmail: string, volunteerName: string, activityTitle: string) => {
    setActionLoading(checkinId);
    try {
      await approveCheckin(checkinId);
      toast.success(`${volunteerName}'s check-in approved!`);
      fetchCheckins();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve check-in.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (checkinId: string, volunteerId: string, volunteerName: string, activityTitle: string) => {
    setActionLoading(checkinId);
    try {
      await rejectCheckin(checkinId);
      toast.success(`${volunteerName}'s check-in rejected.`);
      fetchCheckins();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckout = async (checkinId: string, volunteerId: string, volunteerName: string) => {
    setActionLoading(checkinId);
    try {
      const record = checkins.find((c) => c.id === checkinId);
      const hours = record?.hours_spent || 0;
      await approveCheckout(checkinId, hours);
      toast.success(`${volunteerName} checked out! Hours calculated.`);
      fetchCheckins();
    } catch (err: any) {
      toast.error(err.message || 'Failed to checkout.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCodeLookup = async () => {
    if (!codeInput.trim()) { toast.error('Enter a check-in code.'); return; }
    setLookingUp(true);
    try {
      const act = await getActivityByCode(codeInput.trim().toUpperCase());
      if (!act) {
        toast.error('No activity found with this code.');
        setCodeActivity(null);
      } else {
        const activityCheckins = checkins.filter((c) => c.activity_id === act.id);
        setCodeActivity({ ...act, checkin_records: activityCheckins });
      }
    } catch {
      toast.error('Activity not found.');
      setCodeActivity(null);
    } finally {
      setLookingUp(false);
    }
  };

  const filtered = checkins.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter;
    const matchSearch = !search || c.volunteer?.full_name?.toLowerCase().includes(search.toLowerCase()) || c.activity?.title?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: checkins.length,
    pending: checkins.filter(c => c.status === 'pending').length,
    approved: checkins.filter(c => c.status === 'approved').length,
    checked_out: checkins.filter(c => c.status === 'checked_out').length,
    rejected: checkins.filter(c => c.status === 'rejected').length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/25',
      approved: 'bg-success/10 text-success border-success/25',
      checked_out: 'bg-primary/10 text-primary border-primary/25',
      rejected: 'bg-destructive/10 text-destructive border-destructive/25',
    };
    return map[status] || 'bg-muted text-muted-foreground border-border';
  };

  const panels: { id: Panel; label: string; icon: React.ElementType }[] = [
    { id: 'requests', label: 'Check-in Requests', icon: CheckCircle2 },
    { id: 'code-entry', label: 'Code Lookup', icon: KeyRound },
  ];

  return (
    <AppLayout activePath="/admin/checkins">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-700 text-foreground">Check-in Management</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">Approve, reject, and check out Champions, then look up by code</p>
        </div>

        {/* Panel Tabs */}
        <div className="flex gap-2 border-b border-border">
          {panels.map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setActivePanel(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-600 border-b-2 transition-all -mb-px ${activePanel === p.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <Icon size={15} />
                {p.label}
                {p.id === 'requests' && counts.pending > 0 && (
                  <span className="ml-1 text-[10px] font-800 bg-warning/15 text-warning px-1.5 py-0.5 rounded-full">{counts.pending}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Code Lookup Panel */}
        {activePanel === 'code-entry' && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl shadow-card p-6 max-w-md">
              <div className="flex items-center gap-2 mb-4">
                <QrCode size={18} className="text-primary" />
                <h2 className="text-[16px] font-700 text-foreground">Look Up by Check-in Code</h2>
              </div>
              <div className="flex gap-3">
                <input
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleCodeLookup()}
                  placeholder="Enter code (e.g. ABC123)"
                  className="flex-1 px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] font-700 text-foreground tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  onClick={handleCodeLookup}
                  disabled={lookingUp}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60 text-[13.5px]"
                >
                  {lookingUp ? <Loader2 size={15} className="animate-spin" /> : 'Look Up'}
                </button>
              </div>
            </div>

            {codeActivity && (
              <div className="bg-card border border-border rounded-2xl shadow-card p-5">
                <div className="mb-4">
                  <h3 className="text-[16px] font-700 text-foreground">{codeActivity.title}</h3>
                  <p className="text-[13px] text-muted-foreground">{codeActivity.location || 'No location'} · {new Date(codeActivity.start_date || codeActivity.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <code className="text-[12px] font-700 text-primary bg-primary/8 px-2 py-0.5 rounded-md mt-1 inline-block">{codeActivity.check_in_code || codeActivity.checkInCode}</code>
                </div>
                <h4 className="text-[13px] font-700 text-foreground mb-3">Check-in Records ({codeActivity.checkin_records?.length || 0})</h4>
                {codeActivity.checkin_records?.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">No check-ins yet for this event.</p>
                ) : (
                  <div className="space-y-2">
                    {codeActivity.checkin_records?.map((cr: any) => (
                      <div key={cr.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-700 text-primary">
                            {cr.volunteer?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-600 text-foreground">{cr.volunteer?.full_name}</p>
                          <p className="text-[11px] text-muted-foreground">{cr.volunteer?.email}</p>
                        </div>
                        <span className={`text-[11px] font-700 px-2.5 py-1 rounded-full border uppercase tracking-wide ${statusBadge(cr.status)}`}>
                          {cr.status.replace('_', ' ')}
                        </span>
                        {cr.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(cr.id, cr.volunteer_id, cr.volunteer?.email, cr.volunteer?.full_name, codeActivity.title)}
                            disabled={actionLoading === cr.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-success/10 text-success border border-success/25 rounded-lg text-[11px] font-700 hover:bg-success/20 transition-colors disabled:opacity-60"
                          >
                            {actionLoading === cr.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                            Approve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Check-in Requests Panel */}
        {activePanel === 'requests' && (
          <>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'approved', 'checked_out', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3.5 py-2 rounded-xl text-[12.5px] font-600 transition-all border ${filter === f ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/30'}`}
                  >
                    {f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)} ({counts[f]})
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search Champion or event…"
                  className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-card border border-border rounded-2xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <CheckCircle2 size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-[15px] font-600 text-foreground">No {filter !== 'all' ? filter.replace('_', ' ') : ''} check-ins</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {['Champion', 'Event', 'Check-in Time', 'Check-out Time', 'Hours', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-700 text-muted-foreground uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => (
                        <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-600 text-foreground">{c.volunteer?.full_name || '—'}</p>
                            <p className="text-[11px] text-muted-foreground">{c.volunteer?.email || ''}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-600 text-foreground max-w-[160px] truncate">{c.activity?.title || '—'}</p>
                            <p className="text-[11px] text-muted-foreground">{c.activity?.location || ''}</p>
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-muted-foreground font-tabular whitespace-nowrap">
                            {c.checkin_time ? new Date(c.checkin_time).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-muted-foreground font-tabular whitespace-nowrap">
                            {c.checkout_time ? new Date(c.checkout_time).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[13px] font-700 text-primary font-tabular">{c.hours_spent ? `${c.hours_spent} hrs` : '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-700 px-2.5 py-1 rounded-full border uppercase tracking-wide ${statusBadge(c.status)}`}>
                              {c.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {c.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(c.id, c.volunteer_id, c.volunteer?.email, c.volunteer?.full_name, c.activity?.title)}
                                    disabled={actionLoading === c.id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-success/10 text-success border border-success/25 rounded-lg text-[11px] font-700 hover:bg-success/20 transition-colors disabled:opacity-60"
                                  >
                                    {actionLoading === c.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(c.id, c.volunteer_id, c.volunteer?.full_name, c.activity?.title)}
                                    disabled={actionLoading === c.id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-destructive/10 text-destructive border border-destructive/25 rounded-lg text-[11px] font-700 hover:bg-destructive/20 transition-colors disabled:opacity-60"
                                  >
                                    <XCircle size={11} /> Reject
                                  </button>
                                </>
                              )}
                              {c.status === 'approved' && (
                                <button
                                  onClick={() => handleCheckout(c.id, c.volunteer_id, c.volunteer?.full_name)}
                                  disabled={actionLoading === c.id}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary border border-primary/25 rounded-lg text-[11px] font-700 hover:bg-primary/20 transition-colors disabled:opacity-60"
                                >
                                  {actionLoading === c.id ? <Loader2 size={11} className="animate-spin" /> : <LogOut size={11} />}
                                  Checkout
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
