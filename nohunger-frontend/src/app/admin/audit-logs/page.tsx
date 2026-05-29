'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { getAuditLogs, getAuditActionLabel, formatAuditLogDetails } from '@/lib/api/audit';

export default function AdminAuditLogsPage() {
  const { profile, loading } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [volunteerFilter, setVolunteerFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) return;

    const load = async () => {
      try {
        setLoadingLogs(true);
        const data = await getAuditLogs();
        setLogs(data || []);
      } catch (err: any) {
        setError(err?.message || 'Unable to load audit logs.');
      } finally {
        setLoadingLogs(false);
      }
    };

    load();
  }, [loading, profile]);

  const actionOptions = Array.from(new Set(logs.map((entry) => entry.action).filter(Boolean))).sort();
  const filteredLogs = logs.filter((entry) => {
    if (actionFilter !== 'all' && entry.action !== actionFilter) return false;
    if (volunteerFilter.trim()) {
      const search = volunteerFilter.toLowerCase();
      const actorName = String(entry.actorName || '').toLowerCase();
      const targetName = String(entry.targetUserName || '').toLowerCase();
      const actorRole = String(entry.actorRole || '').toLowerCase();
      if (!actorName.includes(search) && !targetName.includes(search) && !actorRole.includes(search)) {
        return false;
      }
    }
    if (entityFilter.trim()) {
      const search = entityFilter.toLowerCase();
      const entityType = String(entry.entityType || '').toLowerCase();
      const details = String(formatAuditLogDetails(entry)).toLowerCase();
      if (!entityType.includes(search) && !details.includes(search)) return false;
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      const created = new Date(entry.createdAt);
      if (created < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      const created = new Date(entry.createdAt);
      if (created > to) return false;
    }
    return true;
  });

  return (
    <AppLayout activePath="/admin/audit-logs">
      <div className="space-y-6 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A clear history of admin and volunteer actions, written in plain language.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loadingLogs ? (
          <div className="rounded-xl border border-border p-6">Loading logs…</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2 space-y-3 rounded-2xl border border-border bg-card p-4">
              <div className="text-sm font-semibold text-foreground">Filters</div>
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Action
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-primary/20"
                >
                  <option value="all">All actions</option>
                  {actionOptions.map((action) => (
                    <option key={action} value={action}>
                      {getAuditActionLabel(action)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Volunteer / Admin
                </label>
                <input
                  value={volunteerFilter}
                  onChange={(e) => setVolunteerFilter(e.target.value)}
                  placeholder="Search by name or role"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-primary/20"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Event / Entity
                </label>
                <input
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  placeholder="Search event, entity, or details"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-primary/20"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setActionFilter('all');
                  setVolunteerFilter('');
                  setEntityFilter('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Clear filters
              </button>
              <div className="text-xs text-muted-foreground">
                {filteredLogs.length} of {logs.length} log entries shown
              </div>
            </div>
            <div className="xl:col-span-3 overflow-x-auto rounded-2xl border border-border bg-card p-4">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Actor</th>
                    <th className="px-3 py-3 font-semibold">Action</th>
                    <th className="px-3 py-3 font-semibold">Target</th>
                    <th className="px-3 py-3 font-semibold">Entity</th>
                    <th className="px-3 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-5 text-sm text-muted-foreground">
                        No audit records were found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((entry) => (
                      <tr key={entry._id} className="border-t border-border/70">
                        <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="font-medium text-foreground">{entry.actorName || entry.actorRole}</div>
                          <div className="text-[11px] text-muted-foreground">{entry.actorRole}</div>
                        </td>
                        <td className="px-3 py-3 align-top text-foreground">{getAuditActionLabel(entry.action)}</td>
                        <td className="px-3 py-3 align-top">
                          <div>{entry.targetUserName || entry.targetUserId || '-'}</div>
                        </td>
                        <td className="px-3 py-3 align-top">{entry.entityType || '-'}</td>
                        <td className="px-3 py-3 align-top text-muted-foreground">
                          {formatAuditLogDetails(entry)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
