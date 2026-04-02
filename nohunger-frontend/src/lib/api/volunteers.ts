import { apiFetch } from './client';
import { adaptUser } from './adapters';

export async function getVolunteers(filters?: { status?: string }): Promise<any[]> {
  const params = filters?.status ? `?status=${filters.status}` : '';
  const data = await apiFetch<any[]>(`/volunteers${params}`);
  return (Array.isArray(data) ? data : []).map(adaptUser);
}

export async function getVolunteer(id: string): Promise<any | null> {
  try {
    const data = await apiFetch<any>(`/volunteers/${id}`);
    return adaptUser(data);
  } catch {
    return null;
  }
}

export async function updateVolunteerProfile(
  id: string,
  payload: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    gender?: string;
    bio?: string;
    skills?: string[];
    availability?: string[];
    region?: string;
    onboardingCompleted?: boolean;
  }
): Promise<any> {
  const data = await apiFetch<any>(`/volunteers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return adaptUser(data.volunteer || data);
}

export async function approveVolunteer(id: string): Promise<void> {
  await apiFetch(`/admin/volunteers/${id}/approve`, { method: 'PUT' });
}

export async function rejectVolunteer(id: string): Promise<void> {
  await apiFetch(`/admin/volunteers/${id}/reject`, { method: 'PUT' });
}

export async function bulkApproveVolunteers(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => approveVolunteer(id)));
}

export async function sendMessageToVolunteer(volunteerId: string, message: string): Promise<void> {
  await apiFetch('/admin/broadcasts', {
    method: 'POST',
    body: JSON.stringify({ recipientIds: [volunteerId], message, type: 'direct' }),
  });
}

export async function sendBulkMessageToVolunteers(
  volunteerIds: string[],
  message: string
): Promise<void> {
  await apiFetch('/admin/broadcasts', {
    method: 'POST',
    body: JSON.stringify({ recipientIds: volunteerIds, message, type: 'broadcast' }),
  });
}
