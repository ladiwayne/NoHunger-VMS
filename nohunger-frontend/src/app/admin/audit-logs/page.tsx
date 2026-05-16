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
        <div className="overflow-x-auto rounded-2xl border border-border bg-card p-4">
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
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-5 text-sm text-muted-foreground">
                    No audit records were found.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <tr key={entry._id} className="border-t border-border/70">
                    <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="font-medium text-foreground">{entry.actorName || entry.actorRole}</div>
                      <div className="text-[11px] text-muted-foreground">{entry.actorRole}</div>
                    </td>
                    <td className="px-3 py-3 align-top text-foreground">{entry.action}</td>
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
      )}
    </AppLayout>
  );
}
