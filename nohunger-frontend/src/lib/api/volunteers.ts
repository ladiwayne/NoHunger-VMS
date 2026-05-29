// Get accepted volunteers for an event (JSON or CSV)
export async function getAcceptedVolunteersForEvent(eventId: string, opts?: { exportCsv?: boolean }): Promise<any[] | string> {
  const url = `/admin/events/${eventId}/accepted-volunteers${opts?.exportCsv ? '?export=csv' : ''}`;
  const res = await apiFetch<any>(url, {
    method: 'GET',
    headers: opts?.exportCsv ? { Accept: 'text/csv' } : undefined,
  });
  // If CSV, return as blob/text for download
  if (opts?.exportCsv && typeof res === 'string') {
    return res;
  }
  return Array.isArray(res) ? res : [];
}
import { apiFetch } from './client';
import { adaptUser } from './adapters';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface VolunteerListResponse {
  data: any[];
  pagination: PaginationMeta | null;
}

export async function getVolunteers(
  filters?: { status?: string; country?: string; search?: string; page?: number; limit?: number }
): Promise<VolunteerListResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.country) params.set('country', filters.country);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page)   params.set('page',   String(filters.page));
  if (filters?.limit)  params.set('limit',  String(filters.limit));
  const query = params.toString() ? `?${params}` : '';
  const res = await apiFetch<any>(`/admin/volunteers${query}`);
  const raw = Array.isArray(res) ? res : (res?.data ?? []);
  const pagination = Array.isArray(res) ? null : (res.pagination ?? null);
  return { data: raw.map(adaptUser), pagination };
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
    alternatePhone?: string;
    gender?: string;
    bio?: string;
    skills?: string[];
    availability?: string[];
    region?: string;
    country?: string;
    streetAddress?: string;
    addressLine2?: string;
    city?: string;
    stateProvRegion?: string;
    postalZip?: string;
    birthday?: string;
    occupation?: string;
    organization?: string;
    instagramHandle?: string;
    twitterHandle?: string;
    shirtSize?: string;
    whyVolunteer?: string;
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
