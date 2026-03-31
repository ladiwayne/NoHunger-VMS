import { apiFetch } from './client';
import { adaptActivity } from './adapters';

export async function getActivities(filters?: { status?: string }): Promise<any[]> {
  const params = filters?.status ? `?status=${filters.status}` : '';
  const data = await apiFetch<any[]>(`/activities${params}`);
  return (Array.isArray(data) ? data : []).map(adaptActivity);
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
  } catch {
    return null;
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
    }),
  });
  return adaptActivity(data.activity || data);
}

export async function deleteActivity(id: string): Promise<void> {
  await apiFetch(`/activities/${id}`, { method: 'DELETE' });
}

export async function sendInvitesForActivity(activityId: string): Promise<void> {
  await apiFetch(`/activities/${activityId}/send-invites`, { method: 'POST' });
}
