import { apiFetch } from './client';
import { adaptUser, adaptActivity, adaptCheckin } from './adapters';

export interface AdminStats {
  totalVolunteers: number;
  pendingApprovals: number;
  approvedVolunteers: number;
  totalActivities: number;
  completedActivities: number;
  pendingCheckins: number;
  totalCheckins: number;
  totalHours: number;
}

export async function getAdminStats(params?: { from?: string; to?: string }): Promise<AdminStats> {
  try {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => !!v) as [string, string][]).toString()
      : '';
    const data = await apiFetch<any>(`/admin/dashboard/stats${qs}`);
    return {
      totalVolunteers: data.totalVolunteers || 0,
      pendingApprovals: data.pendingApprovals || data.pendingVolunteers || 0,
      approvedVolunteers: data.approvedVolunteers || 0,
      totalActivities: data.totalActivities || 0,
      completedActivities: data.completedActivities || 0,
      pendingCheckins: data.pendingCheckins || 0,
      totalCheckins: data.totalCheckins || 0,
      totalHours: data.totalHours || 0,
    };
  } catch {
    return {
      totalVolunteers: 0,
      pendingApprovals: 0,
      approvedVolunteers: 0,
      totalActivities: 0,
      completedActivities: 0,
      pendingCheckins: 0,
      totalCheckins: 0,
      totalHours: 0,
    };
  }
}

export async function getAdminVolunteers(): Promise<any[]> {
  const data = await apiFetch<any>('/volunteers?limit=20');
  return (data?.data ?? (Array.isArray(data) ? data : [])).map(adaptUser);
}

export async function getAdminActivities(): Promise<any[]> {
  const data = await apiFetch<any>('/activities?limit=500');
  return (data?.data ?? (Array.isArray(data) ? data : [])).map(adaptActivity);
}

export async function getAdminCheckins(): Promise<any[]> {
  const data = await apiFetch<any>('/checkins?limit=20');
  return (data?.data ?? (Array.isArray(data) ? data : [])).map(adaptCheckin);
}

export async function getTopVolunteers(limit = 5): Promise<any[]> {
  try {
    const data = await apiFetch<any>(`/admin/top-volunteers?limit=${limit}`);
    return (data?.data ?? (Array.isArray(data) ? data : [])).map(adaptUser);
  } catch {
    // Fallback: get all volunteers and sort by hours
    const vols = await apiFetch<any>('/volunteers?limit=500');
    const adapted = (vols?.data ?? (Array.isArray(vols) ? vols : [])).map(adaptUser).filter(Boolean) as any[];
    return adapted.sort((a, b) => (b?.total_hours || 0) - (a?.total_hours || 0)).slice(0, limit);
  }
}

// ─── Super Admin: Admin Account Management ───────────────────────────────────

export async function getPendingAdmins(): Promise<any[]> {
  const data = await apiFetch<any[]>('/admin/pending-admins');
  return Array.isArray(data) ? data : [];
}

export async function getAllAdmins(): Promise<any[]> {
  const data = await apiFetch<any[]>('/admin/all-admins');
  return Array.isArray(data) ? data : [];
}

export async function approveAdmin(id: string): Promise<any> {
  return apiFetch(`/admin/approve-admin/${id}`, { method: 'PUT' });
}

export async function rejectAdmin(id: string): Promise<any> {
  return apiFetch(`/admin/reject-admin/${id}`, { method: 'PUT' });
}

export async function revokeAdmin(id: string): Promise<any> {
  return apiFetch(`/admin/revoke-admin/${id}`, { method: 'DELETE' });
}

export async function promoteToAdmin(id: string): Promise<any> {
  return apiFetch(`/admin/promote-to-admin/${id}`, { method: 'PUT' });
}

export async function resetVolunteerPassword(id: string): Promise<any> {
  return apiFetch(`/admin/reset-volunteer-password/${id}`, { method: 'POST' });
}
