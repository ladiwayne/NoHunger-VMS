'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getVolunteers, approveVolunteer, rejectVolunteer, bulkApproveVolunteers, sendMessageToVolunteer, sendBulkMessageToVolunteers } from '@/lib/api/volunteers';
import { Users, XCircle, Search, Loader2, UserCheck, UserX, Eye, CheckSquare, MessageSquare, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';


type Panel = 'list' | 'message';

export default function AdminVolunteersPage() {
  useAuth();
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedVol, setSelectedVol] = useState<any>(null);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>('list');
  const [messageTarget, setMessageTarget] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageScope, setMessageScope] = useState<'single' | 'filtered' | 'approved' | 'pending' | 'all'>('single');

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const data = await getVolunteers();
      setVolunteers(data || []);
    } catch (err) {
      console.log('Volunteers fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (volunteerId: string, volunteerName: string) => {
    setActionLoading(volunteerId);
    try {
      await approveVolunteer(volunteerId);
      toast.success(`${volunteerName} is now a Nohunger Champion!`);
      fetchVolunteers();
      if (selectedVol?.id === volunteerId) setSelectedVol((p: any) => ({ ...p, volunteer_status: 'approved' }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (volunteerId: string, volunteerName: string) => {
    setActionLoading(volunteerId);
    try {
      await rejectVolunteer(volunteerId);
      toast.success(`${volunteerName}'s Champion application was declined.`);
      fetchVolunteers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    const pending = volunteers.filter(v => v.volunteer_status === 'pending');
    if (pending.length === 0) { toast.error('No pending Champions to approve right now.'); return; }
    setBulkApproving(true);
    try {
      await bulkApproveVolunteers(pending.map(v => v.id));

      toast.success(`${pending.length} Nohunger Champions approved!`);
      fetchVolunteers();
    } catch (err: any) {
      toast.error(err.message || 'Bulk approve failed.');
    } finally {
      setBulkApproving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) { toast.error('Please enter a message.'); return; }

    let recipientIds: string[] = [];
    if (messageScope === 'single') {
      if (!messageTarget) {
        toast.error('Please pick a Champion first.');
        return;
      }
      recipientIds = [messageTarget.id];
    }

    if (messageScope === 'filtered') {
      recipientIds = filtered.map(v => v.id);
    }
    if (messageScope === 'approved') {
      recipientIds = volunteers.filter(v => v.volunteer_status === 'approved').map(v => v.id);
    }
    if (messageScope === 'pending') {
      recipientIds = volunteers.filter(v => v.volunteer_status === 'pending').map(v => v.id);
    }
    if (messageScope === 'all') {
      recipientIds = volunteers.map(v => v.id);
    }

    if (recipientIds.length === 0) {
      toast.error('No recipients found for the selected audience.');
      return;
    }

    setSendingMessage(true);
    try {
      if (messageScope === 'single' && messageTarget) {
        await sendMessageToVolunteer(messageTarget.id, messageText.trim());
        toast.success(`Message sent to ${messageTarget.full_name}!`);
      } else {
        await sendBulkMessageToVolunteers(recipientIds, messageText.trim());
        toast.success(`Bulk message sent to ${recipientIds.length} Champions.`);
      }
      setMessageText('');
      setMessageTarget(null);
      setMessageScope('single');
      setActivePanel('list');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const openMessage = (vol: any) => {
    setMessageScope('single');
    setMessageTarget(vol);
    setActivePanel('message');
  };

  const filtered = volunteers.filter(v => {
    const matchFilter = filter === 'all' || v.volunteer_status === filter;
    const matchSearch = !search || v.full_name?.toLowerCase().includes(search.toLowerCase()) || v.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: volunteers.length,
    pending: volunteers.filter(v => v.volunteer_status === 'pending').length,
    approved: volunteers.filter(v => v.volunteer_status === 'approved').length,
    rejected: volunteers.filter(v => v.volunteer_status === 'rejected').length,
  };

  const groupCount = (items: any[], keyFn: (item: any) => string) => {
    return items.reduce((acc: Record<string, number>, item) => {
      const key = keyFn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  };

  const byGender = groupCount(filtered, (v) => {
    if (v.gender === 'female') return 'Female';
    if (v.gender === 'male') return 'Male';
    if (v.gender === 'other') return 'Other';
    if (v.gender === 'prefer_not_to_say') return 'Prefer not to say';
    return 'Unspecified';
  });

  const byEventConfirmation = groupCount(filtered, (v) => {
    const s = v.event_confirmation_status || 'no_invitations';
    if (s === 'confirmed') return 'Confirmed';
    if (s === 'pending_response') return 'Pending Response';
    if (s === 'declined') return 'Declined';
    if (s === 'mixed') return 'Mixed';
    return 'No Invitations';
  });

  const byLocation = groupCount(filtered, (v) => {
    const region = (v.region || '').split(',').map((p: string) => p.trim()).filter(Boolean);
    return region.length > 0 ? region[region.length - 1] : 'Unspecified';
  });

  const bySkillAreas = groupCount(filtered, (v) => {
    if (!v.skills || v.skills.length === 0) return 'No Skills Listed';
    return v.skills.map((s: string) => s.replace('-', ' ')).join(', ');
  });

  const sortedLocationGroups = Object.entries(byLocation).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const sortedSkillGroups = Object.entries(bySkillAreas).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/25',
      approved: 'bg-success/10 text-success border-success/25',
      rejected: 'bg-destructive/10 text-destructive border-destructive/25',
      suspended: 'bg-muted text-muted-foreground border-border',
    };
    return map[status] || 'bg-muted text-muted-foreground border-border';
  };

  return (
    <AppLayout activePath="/admin/volunteers">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Nohunger Champions</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">Approve, review, and support Champion accounts</p>
          </div>
          {counts.pending > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={bulkApproving}
              className="flex items-center gap-2 px-4 py-2.5 bg-success text-white font-700 rounded-xl hover:bg-success/90 transition-all disabled:opacity-60 text-[13.5px]"
            >
              {bulkApproving ? <Loader2 size={15} className="animate-spin" /> : <CheckSquare size={15} />}
              Approve All Pending Champions ({counts.pending})
            </button>
          )}
        </div>

        {/* Panel Tabs */}
        <div className="flex gap-2 border-b border-border">
          {[
            { id: 'list' as Panel, label: 'Champion List', icon: Users },
            { id: 'message' as Panel, label: 'Send Message', icon: MessageSquare },
          ].map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setActivePanel(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-600 border-b-2 transition-all -mb-px ${activePanel === p.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <Icon size={15} />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Send Message Panel */}
        {activePanel === 'message' && (
          <div className="bg-card border border-border rounded-2xl shadow-card p-6 max-w-xl">
            <h2 className="text-[16px] font-700 text-foreground mb-4">Send Custom Message</h2>

            <div className="mb-4">
              <label className="block text-[13px] font-600 text-foreground mb-1.5">Audience</label>
              <select
                value={messageScope}
                onChange={(e) => {
                  const next = e.target.value as typeof messageScope;
                  setMessageScope(next);
                  if (next !== 'single') setMessageTarget(null);
                }}
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="single">Single Champion</option>
                <option value="filtered">All filtered Champions ({filtered.length})</option>
                <option value="approved">All approved Champions ({counts.approved})</option>
                <option value="pending">All pending Champions ({counts.pending})</option>
                <option value="all">All Champions ({counts.all})</option>
              </select>
            </div>

            {/* Champion selector */}
            {messageScope === 'single' && (
            <div className="mb-4">
              <label className="block text-[13px] font-600 text-foreground mb-1.5">Select Champion</label>
              {messageTarget ? (
                <div className="flex items-center gap-3 p-3 bg-primary/6 border border-primary/20 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-700 text-primary">
                      {messageTarget.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-600 text-foreground">{messageTarget.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">{messageTarget.email}</p>
                  </div>
                  <button onClick={() => setMessageTarget(null)} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-xl">
                  {volunteers.filter(v => v.volunteer_status === 'approved').map(vol => (
                    <button
                      key={vol.id}
                      onClick={() => setMessageTarget(vol)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-700 text-primary">
                          {vol.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-600 text-foreground">{vol.full_name}</p>
                        <p className="text-[11px] text-muted-foreground">{vol.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}

            <div className="mb-4">
              <label className="block text-[13px] font-600 text-foreground mb-1.5">Message</label>
              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                rows={4}
                placeholder="Write your message to this Champion…"
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || (messageScope === 'single' && !messageTarget) || !messageText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60 text-[13.5px]"
              >
                {sendingMessage ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Send Message
              </button>
              <button onClick={() => { setActivePanel('list'); setMessageTarget(null); setMessageText(''); }} className="px-4 py-2.5 bg-card border border-border rounded-xl text-[13.5px] font-600 text-muted-foreground hover:bg-muted transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Champion List Panel */}
        {activePanel === 'list' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3.5 py-2 rounded-xl text-[13px] font-600 transition-all border ${filter === f ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/30'}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search Champions…"
                  className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Grouped summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-[12px] font-700 text-foreground uppercase tracking-wide mb-2">By Gender</p>
                <div className="space-y-1.5">
                  {Object.entries(byGender).sort((a, b) => b[1] - a[1]).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-700 text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-[12px] font-700 text-foreground uppercase tracking-wide mb-2">By Event Confirmation</p>
                <div className="space-y-1.5">
                  {Object.entries(byEventConfirmation).sort((a, b) => b[1] - a[1]).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-700 text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-[12px] font-700 text-foreground uppercase tracking-wide mb-2">Top Locations</p>
                <div className="space-y-1.5">
                  {sortedLocationGroups.map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-muted-foreground truncate pr-2">{key}</span>
                      <span className="font-700 text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-[12px] font-700 text-foreground uppercase tracking-wide mb-2">By Skill Areas</p>
                <div className="space-y-1.5">
                  {sortedSkillGroups.map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-muted-foreground truncate pr-2">{key}</span>
                      <span className="font-700 text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Champion detail panel */}
            {selectedVol && (
              <div className="bg-card border border-border rounded-2xl shadow-card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="text-[16px] font-700 text-primary">
                        {selectedVol.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-[16px] font-700 text-foreground">{selectedVol.full_name}</h3>
                      <p className="text-[13px] text-muted-foreground">{selectedVol.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${selectedVol.id}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-[12px] font-600 hover:text-foreground transition-colors">
                      <Eye size={13} /> View Public Profile
                    </Link>
                    <button
                      onClick={() => { setMessageTarget(selectedVol); setActivePanel('message'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[12px] font-600 hover:bg-primary/20 transition-colors"
                    >
                      <MessageSquare size={13} /> Message
                    </button>
                    <button onClick={() => setSelectedVol(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: 'Region', value: selectedVol.region || '—' },
                    { label: 'Phone', value: selectedVol.phone || '—' },
                    { label: 'Total Hours', value: `${selectedVol.total_hours || 0} hrs` },
                    { label: 'Status', value: selectedVol.volunteer_status },
                  ].map(item => (
                    <div key={item.label} className="bg-muted rounded-xl p-3">
                      <p className="text-[11px] font-600 text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
                      <p className="text-[13px] font-700 text-foreground capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>
                {selectedVol.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedVol.skills.map((s: string) => (
                      <span key={s} className="px-2.5 py-1 bg-primary/8 text-primary text-[11px] font-600 rounded-full capitalize">{s.replace('-', ' ')}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Table */}
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Users size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-[15px] font-600 text-foreground">No Champions found</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {['Champion', 'Email', 'Region', 'Skills', 'Hours', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-700 text-muted-foreground uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(vol => (
                        <tr key={vol.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-[11px] font-700 text-primary">
                                  {vol.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                              </div>
                              <span className="text-[13px] font-600 text-foreground">{vol.full_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-muted-foreground">{vol.email}</td>
                          <td className="px-4 py-3 text-[12.5px] text-muted-foreground max-w-[120px] truncate">{vol.region || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {vol.skills?.slice(0, 2).map((s: string) => (
                                <span key={s} className="px-1.5 py-0.5 bg-primary/8 text-primary text-[10px] font-600 rounded-full capitalize">{s.replace('-', ' ')}</span>
                              ))}
                              {vol.skills?.length > 2 && <span className="text-[10px] text-muted-foreground">+{vol.skills.length - 2}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[13px] font-700 text-primary font-tabular">{vol.total_hours || 0} hrs</td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-700 px-2.5 py-1 rounded-full border uppercase tracking-wide ${statusBadge(vol.volunteer_status)}`}>
                              {vol.volunteer_status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => setSelectedVol(vol)} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors" title="View details">
                                <Eye size={14} />
                              </button>
                              <button onClick={() => openMessage(vol)} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Send message">
                                <MessageSquare size={14} />
                              </button>
                              {vol.volunteer_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(vol.id, vol.full_name)}
                                    disabled={actionLoading === vol.id}
                                    className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-60"
                                    title="Approve"
                                  >
                                    {actionLoading === vol.id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                                  </button>
                                  <button
                                    onClick={() => handleReject(vol.id, vol.full_name)}
                                    disabled={actionLoading === vol.id}
                                    className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-60"
                                    title="Reject"
                                  >
                                    <UserX size={14} />
                                  </button>
                                </>
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
