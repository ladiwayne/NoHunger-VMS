import { apiFetch } from './client';
import { adaptCheckin } from './adapters';

export async function getMyCheckins(): Promise<any[]> {
  const data = await apiFetch<any[]>('/checkins/my');
  return (Array.isArray(data) ? data : []).map(adaptCheckin);
}

export async function getAllCheckins(): Promise<any[]> {
  const data = await apiFetch<any[]>('/checkins');
  return (Array.isArray(data) ? data : []).map(adaptCheckin);
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
