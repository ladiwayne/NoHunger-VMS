'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import {
  ShieldCheck,
  UserCog,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  AlertCircle,
  Users,
  UserPlus,
  Search,
  X,
} from 'lucide-react';
import {
  getPendingAdmins,
  getAllAdmins,
  approveAdmin,
  rejectAdmin,
  revokeAdmin,
  promoteToAdmin,
  resetVolunteerPassword,
  getAdminVolunteers,
} from '@/lib/api/admin';

type AdminUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'admin' | 'super_admin';
  adminRequestReason?: string;
  createdAt: string;
};

export default function ManageAdminsPage() {
  const { profile, isSuperAdmin, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'promote'>('pending');
  const [pendingAdmins, setPendingAdmins] = useState<AdminUser[]>([]);
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState<string | null>(null);
  const [resetModalData, setResetModalData] = useState<{ name: string; password: string } | null>(null);

  // Redirect non-super-admins
  useEffect(() => {
    if (!loading && !isSuperAdmin()) {
      router.replace('/admin/dashboard');
    }
  }, [loading, isSuperAdmin, router]);

  const loadData = async () => {
    setFetching(true);
    try {
      const [pending, all, vols] = await Promise.all([getPendingAdmins(), getAllAdmins(), getAdminVolunteers()]);
      setPendingAdmins(pending);
      setAllAdmins(all);
      setVolunteers(vols.filter((v: any) => v.role === 'volunteer'));
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && isSuperAdmin()) {
      loadData();
    }
  }, [loading]);

  const handleApprove = async (id: string, name: string) => {
    setActionLoading(id + '-approve');
    try {
      await approveAdmin(id);
      toast.success(`${name} has been approved as admin`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string, name: string) => {
    setActionLoading(id + '-reject');
    try {
      await rejectAdmin(id);
      toast.success(`${name}'s admin request has been rejected`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromote = async (id: string, name: string) => {
    if (!confirm(`Promote ${name} to admin? They will gain access to the admin dashboard.`)) return;
    setActionLoading(id + '-promote');
    try {
      await promoteToAdmin(id);
      toast.success(`${name} has been promoted to admin`);
      await loadData();
      setActiveTab('all');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to promote volunteer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke admin access for ${name}? They will be downgraded to a volunteer.`)) return;
    setActionLoading(id + '-revoke');
    try {
      await revokeAdmin(id);
      toast.success(`Admin access revoked for ${name}`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to revoke admin access');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (id: string, name: string) => {
    if (!confirm(`Reset password for ${name}? A new password will be generated.`)) return;
    setResetLoading(id);
    try {
      const result = await resetVolunteerPassword(id);
      if (result?.newPassword) {
        setResetModalData({ name, password: result.newPassword });
        toast.success(`Password reset for ${name}.`);
      } else {
        toast.success(`Password reset for ${name}. Please copy the new password from the details modal.`);
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to reset password for ${name}`);
    } finally {
      setResetLoading(null);
    }
  };

  if (loading || (!loading && !isSuperAdmin())) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserCog size={18} className="text-primary" />
            </div>
            <h1 className="text-2xl font-700 text-foreground">Manage Admins</h1>
          </div>
          <p className="text-[14px] text-muted-foreground ml-12">
            Review admin access requests and manage existing administrators.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-600 rounded-lg transition-all ${activeTab === 'pending' ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Clock size={13} />
            Pending Requests
            {pendingAdmins.length > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] bg-warning/20 text-warning text-[10px] font-700 rounded-full flex items-center justify-center px-1">
                {pendingAdmins.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-600 rounded-lg transition-all ${activeTab === 'all' ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users size={13} />
            All Admins
          </button>
          <button
            onClick={() => setActiveTab('promote')}
            className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-600 rounded-lg transition-all ${activeTab === 'promote' ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <UserPlus size={13} />
            Promote Volunteer
          </button>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* ── PENDING REQUESTS ── */}
            {activeTab === 'pending' && (
              <div className="space-y-3">
                {pendingAdmins.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckCircle2 size={36} className="text-muted-foreground/30 mb-3" />
                    <p className="text-[15px] font-600 text-foreground">No pending requests</p>
                    <p className="text-[13px] text-muted-foreground mt-1">All admin requests have been reviewed.</p>
                  </div>
                ) : (
                  pendingAdmins.map((admin) => (
                    <div
                      key={admin._id}
                      className="bg-card border border-border rounded-xl p-4 flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[13px] font-700 text-warning">
                          {admin.firstName[0]}{admin.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[14px] font-700 text-foreground">
                            {admin.firstName} {admin.lastName}
                          </p>
                          <span className="px-2 py-0.5 text-[10px] font-700 uppercase bg-warning/10 text-warning rounded-full">
                            Pending
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{admin.email}</p>
                        {admin.adminRequestReason && (
                          <div className="mt-2 p-2.5 bg-muted rounded-lg">
                            <p className="text-[11px] font-600 text-muted-foreground uppercase tracking-wide mb-1">Reason</p>
                            <p className="text-[12.5px] text-foreground leading-relaxed">{admin.adminRequestReason}</p>
                          </div>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-2">
                          Requested {new Date(admin.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleReject(admin._id, `${admin.firstName} ${admin.lastName}`)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-600 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/5 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === admin._id + '-reject' ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <XCircle size={13} />
                          )}
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(admin._id, `${admin.firstName} ${admin.lastName}`)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-600 text-white bg-[hsl(142,72%,29%)] rounded-lg hover:bg-[hsl(142,72%,22%)] transition-colors disabled:opacity-50"
                        >
                          {actionLoading === admin._id + '-approve' ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          Approve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── PROMOTE VOLUNTEER ── */}
            {activeTab === 'promote' && (
              <div>
                <div className="relative mb-4">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search volunteers by name or email…"
                    value={volunteerSearch}
                    onChange={(e) => setVolunteerSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border rounded-xl text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)] transition-all"
                  />
                </div>
                <div className="space-y-3">
                  {(() => {
                    const filtered = volunteers.filter((v) => {
                      const q = volunteerSearch.toLowerCase();
                      return !q || (v.full_name || '').toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
                    });
                    if (filtered.length === 0) return (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Users size={36} className="text-muted-foreground/30 mb-3" />
                        <p className="text-[15px] font-600 text-foreground">{volunteerSearch ? 'No matching volunteers' : 'No volunteers found'}</p>
                        <p className="text-[13px] text-muted-foreground mt-1">Volunteers who register on the platform will appear here.</p>
                      </div>
                    );
                    return filtered.map((vol) => (
                      <div
                        key={vol.id}
                        className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-[13px] font-700 text-muted-foreground">
                            {(vol.full_name || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-700 text-foreground">
                            {vol.full_name || vol.email}
                          </p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{vol.email}</p>
                          {vol.phone && <p className="text-[11px] text-muted-foreground mt-0.5">{vol.phone}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handlePromote(vol.id, vol.full_name || vol.email)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-600 text-white bg-[hsl(142,72%,29%)] rounded-lg hover:bg-[hsl(142,72%,22%)] transition-colors disabled:opacity-50"
                          >
                            {actionLoading === vol.id + '-promote' ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <UserPlus size={13} />
                            )}
                            Make Admin
                          </button>
                          <button
                            onClick={() => handleResetPassword(vol.id, vol.full_name || vol.email)}
                            disabled={!!actionLoading || resetLoading === vol.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-600 text-muted-foreground bg-muted border border-border rounded-lg hover:bg-muted/90 transition-colors disabled:opacity-50"
                          >
                            {resetLoading === vol.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ShieldCheck size={13} />
                            )}
                            Reset Password
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* ── ALL ADMINS ── */}
            {activeTab === 'all' && (
              <div className="space-y-3">
                {allAdmins.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Users size={36} className="text-muted-foreground/30 mb-3" />
                    <p className="text-[15px] font-600 text-foreground">No admins yet</p>
                  </div>
                ) : (
                  allAdmins.map((admin) => {
                    const isSelf = admin._id === profile?.id;
                    const isSup = admin.role === 'super_admin';
                    return (
                      <div
                        key={admin._id}
                        className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isSup ? 'bg-primary/10' : 'bg-muted'}`}>
                          <span className={`text-[13px] font-700 ${isSup ? 'text-primary' : 'text-muted-foreground'}`}>
                            {admin.firstName[0]}{admin.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[14px] font-700 text-foreground">
                              {admin.firstName} {admin.lastName}
                              {isSelf && <span className="text-[11px] text-muted-foreground font-400"> (you)</span>}
                            </p>
                            <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-700 uppercase rounded-full ${isSup ? 'bg-primary/10 text-primary' : 'bg-[hsl(142,72%,92%)] text-[hsl(142,72%,22%)]'}`}>
                              <ShieldCheck size={10} />
                              {isSup ? 'Super Admin' : 'Admin'}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-700 uppercase rounded-full ${admin.status === 'approved' ? 'bg-[hsl(142,72%,92%)] text-[hsl(142,72%,22%)]' : admin.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                              {admin.status}
                            </span>
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{admin.email}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Added {new Date(admin.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!isSelf && !isSup && (
                          <button
                            onClick={() => handleRevoke(admin._id, `${admin.firstName} ${admin.lastName}`)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-600 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/5 transition-colors disabled:opacity-50 flex-shrink-0"
                          >
                            {actionLoading === admin._id + '-revoke' ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                            Revoke Access
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {resetModalData && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Password Reset Complete</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        The new password for {resetModalData.name} is shown below. Copy it before closing.
                      </p>
                    </div>
                    <button
                      onClick={() => setResetModalData(null)}
                      className="rounded-full p-2 text-muted-foreground hover:bg-muted transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <div className="font-semibold">Success</div>
                    <div className="mt-1 text-sm text-foreground">The password has been reset successfully. Use the password below or copy it to the clipboard.</div>
                  </div>
                  <div className="mt-6 rounded-3xl border border-border bg-muted p-4 font-mono text-sm break-words">
                    {resetModalData.password}
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      onClick={async () => {
                        if (!navigator?.clipboard) {
                          toast.error('Clipboard is unavailable in this browser.');
                          return;
                        }
                        try {
                          await navigator.clipboard.writeText(resetModalData.password);
                          toast.success('Password copied to clipboard');
                        } catch (copyError) {
                          toast.error('Unable to copy password. Please copy it manually.');
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition"
                    >
                      Copy password
                    </button>
                    <button
                      onClick={() => setResetModalData(null)}
                      className="inline-flex items-center justify-center rounded-2xl border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground hover:bg-border transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
