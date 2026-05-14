'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyAuditLogs } from '@/lib/api/audit';

export default function MyAuditLogsPage() {
  const { profile, loading } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!profile) return;

    const load = async () => {
      try {
        setLoadingLogs(true);
        const data = await getMyAuditLogs();
        setLogs(data || []);
      } catch (err: any) {
        setError(err?.message || 'Unable to load your activity logs.');
      } finally {
        setLoadingLogs(false);
      }
    };

    load();
  }, [loading, profile]);

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A timeline of your recent actions and requests in the No Hunger volunteer system.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loadingLogs ? (
        <div className="rounded-xl border border-border p-6">Loading your activity log…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card p-4">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Action</th>
                <th className="px-3 py-3 font-semibold">Entity</th>
                <th className="px-3 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-5 text-sm text-muted-foreground">
                    No activity entries were recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <tr key={entry._id} className="border-t border-border/70">
                    <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 align-top text-foreground">{entry.action}</td>
                    <td className="px-3 py-3 align-top">{entry.entityType || '-'}</td>
                    <td className="px-3 py-3 align-top text-muted-foreground">
                      {typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details || {})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
