import { apiFetch } from './client';
import { adaptCheckin } from './adapters';

export async function getMyCheckins(): Promise<any[]> {
  const data = await apiFetch<any[]>('/checkins/my');
  return (Array.isArray(data) ? data : []).map(adaptCheckin);
}

export async function getAllCheckins(
  filters?: { status?: string; activityId?: string; page?: number; limit?: number }
): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.status)     params.set('status',     filters.status);
  if (filters?.activityId) params.set('activityId', filters.activityId);
  if (filters?.page)       params.set('page',       String(filters.page));
  if (filters?.limit)      params.set('limit',      String(filters.limit));
  const query = params.toString() ? `?${params}` : '';
  const res = await apiFetch<any>(`/checkins${query}`);
  // Handle both paginated { data, pagination } and legacy array responses
  const raw = Array.isArray(res) ? res : (res?.data ?? []);
  return raw.map(adaptCheckin);
}

export async function checkinWithCode(code: string, activityId?: string): Promise<any> {
  const data = await apiFetch<any>('/checkins/checkin', {
    method: 'POST',
    body: JSON.stringify({ checkInCode: code, activityId }),
  });
  return adaptCheckin(data.checkin || data);
}

export async function checkoutFromActivity(checkinId: string): Promise<any> {
  const data = await apiFetch<any>(`/checkins/${checkinId}/checkout`, {
    method: 'PUT',
  });
  return adaptCheckin(data.checkin || data);
}

export async function approveCheckin(checkinId: string): Promise<void> {
  await apiFetch(`/checkins/${checkinId}/approve-checkin`, { method: 'PUT' });
}

export async function approveCheckout(checkinId: string, hoursSpent: number): Promise<void> {
  await apiFetch(`/checkins/${checkinId}/approve-checkout`, {
    method: 'PUT',
    body: JSON.stringify({ hoursSpent }),
  });
}

export async function rejectCheckin(checkinId: string): Promise<void> {
  await apiFetch(`/checkins/${checkinId}/reject`, { method: 'PUT' });
}
