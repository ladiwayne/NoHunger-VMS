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

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const data = await apiFetch<any>('/admin/dashboard/stats');
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
  const data = await apiFetch<any[]>('/volunteers');
  return (Array.isArray(data) ? data : []).map(adaptUser);
}

export async function getAdminActivities(): Promise<any[]> {
  const data = await apiFetch<any[]>('/activities');
  return (Array.isArray(data) ? data : []).map(adaptActivity);
}

export async function getAdminCheckins(): Promise<any[]> {
  const data = await apiFetch<any[]>('/checkins');
  return (Array.isArray(data) ? data : []).map(adaptCheckin);
}

export async function getTopVolunteers(limit = 5): Promise<any[]> {
  try {
    const data = await apiFetch<any[]>(`/admin/top-volunteers?limit=${limit}`);
    return (Array.isArray(data) ? data : []).map(adaptUser);
  } catch {
    // Fallback: get all volunteers and sort by hours
    const vols = await apiFetch<any[]>('/volunteers');
    const adapted = (Array.isArray(vols) ? vols : []).map(adaptUser).filter(Boolean) as any[];
    return adapted.sort((a, b) => (b?.total_hours || 0) - (a?.total_hours || 0)).slice(0, limit);
  }
}
