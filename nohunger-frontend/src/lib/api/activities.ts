import { apiFetch } from './client';
import { adaptActivity, adaptEvent } from './adapters';

export async function getActivities(
  filters?: { status?: string; category?: string; page?: number; limit?: number; startDate?: string; endDate?: string; location?: string; skill?: string }
): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.status)   params.set('status',   filters.status);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.page)     params.set('page',     String(filters.page));
  if (filters?.limit)    params.set('limit',    String(filters.limit));
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate)   params.set('endDate',   filters.endDate);
  if (filters?.location)  params.set('location',  filters.location);
  if (filters?.search)    params.set('search',    filters.search);
  if (filters?.skill)     params.set('skill',     filters.skill);
  const query = params.toString() ? `?${params}` : '';
  const res = await apiFetch<any>(`/activities${query}`);
  // Handle both paginated { data, pagination } and legacy array responses
  const raw = Array.isArray(res) ? res : (res?.data ?? []);
  return raw.map(adaptActivity);
}

export async function getActivitiesWithPagination(
  filters?: { status?: string; category?: string; page?: number; limit?: number; startDate?: string; endDate?: string; location?: string; skill?: string }
): Promise<{ data: any[]; pagination: { total: number; page: number; limit: number; pages: number } | null }> {
  const params = new URLSearchParams();
  if (filters?.status)   params.set('status',   filters.status);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.page)     params.set('page',     String(filters.page));
  if (filters?.limit)    params.set('limit',    String(filters.limit));
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate)   params.set('endDate',   filters.endDate);
  if (filters?.location)  params.set('location',  filters.location);
  if (filters?.skill)     params.set('skill',     filters.skill);
  const query = params.toString() ? `?${params}` : '';
  const res = await apiFetch<any>(`/activities${query}`);
  const raw = Array.isArray(res) ? res : (res?.data ?? []);
  const pagination = Array.isArray(res) ? null : (res.pagination ?? null);
  return { data: raw.map(adaptActivity), pagination };
}

export async function getActivity(id: string): Promise<any | null> {
  try {
    const data = await apiFetch<any>(`/activities/${id}`);
    return adaptActivity(data);
  } catch {
    return null;
  }
}

export async function getActivityByCode(code: string): Promise<any | null> {
  try {
    const data = await apiFetch<any>(`/activities/code/${code}`);
    return adaptActivity(data);
  } catch (activityError) {
    try {
      const data = await apiFetch<any>(`/events/code/${code}`);
      return adaptEvent(data);
    } catch {
      return null;
    }
  }
}

export async function createActivity(payload: {
  title: string;
  description?: string;
  activity_type?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  max_volunteers?: number;
  status?: string;
  invitedVolunteers?: string[];
}): Promise<any> {
  const data = await apiFetch<any>('/activities', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      category: payload.activity_type,
      location: payload.location,
      startDate: payload.start_date,
      endDate: payload.end_date,
      volunteersNeeded: payload.max_volunteers,
      status: payload.status || 'draft',
      invitedVolunteers: payload.invitedVolunteers || [],
    }),
  });
  return adaptActivity(data.activity || data);
}

export async function updateActivity(id: string, payload: any): Promise<any> {
  const data = await apiFetch<any>(`/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      category: payload.activity_type,
      location: payload.location,
      startDate: payload.start_date,
      endDate: payload.end_date,
      volunteersNeeded: payload.max_volunteers,
      status: payload.status,
      invitedVolunteers: payload.invitedVolunteers || [],
    }),
  });
  return adaptActivity(data.activity || data);
}

export async function deleteActivity(id: string): Promise<void> {
  await apiFetch(`/activities/${id}`, { method: 'DELETE' });
}

export async function resetCheckinCode(id: string): Promise<any> {
  const data = await apiFetch<any>(`/activities/${id}/reset-checkin-code`, { method: 'PUT' });
  return adaptActivity(data.activity || data);
}

export async function sendInvitesForActivity(activityId: string, volunteerIds: string[] = [], inviteAll = false): Promise<void> {
  await apiFetch(`/activities/${activityId}/send-invites`, {
    method: 'POST',
    body: JSON.stringify({ volunteerIds, inviteAll }),
  });
}
