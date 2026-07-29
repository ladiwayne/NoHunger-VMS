import { apiFetch } from './client';
import { adaptEvent } from './adapters';

export async function getEvents(): Promise<any[]> {
  const res = await apiFetch<any>('/events');
  const raw = Array.isArray(res) ? res : res?.data ?? [];
  return raw.map(adaptEvent);
}

export async function getEvent(id: string): Promise<any | null> {
  try {
    const data = await apiFetch<any>(`/events/${id}`);
    return adaptEvent(data);
  } catch {
    return null;
  }
}

export async function getEventByCode(code: string): Promise<any | null> {
  try {
    const data = await apiFetch<any>(`/events/code/${code}`);
    return adaptEvent(data);
  } catch {
    return null;
  }
}

export async function createEvent(payload: {
  title: string;
  description: string;
  eventDate: string;
  endDate: string;
  location: string;
  status?: string;
  invitedVolunteers?: string[];
  max_volunteers?: number;
}): Promise<any> {
  const data = await apiFetch<any>('/events', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      eventDate: payload.eventDate,
      endDate: payload.endDate,
      location: payload.location,
      status: payload.status || 'draft',
      invitedVolunteers: payload.invitedVolunteers || [],
      max_volunteers: payload.max_volunteers || 0,
    }),
  });
  return adaptEvent(data.event || data);
}

export async function updateEvent(eventId: string, payload: {
  title?: string;
  description?: string;
  eventDate?: string;
  endDate?: string;
  location?: string;
  status?: string;
  max_volunteers?: number;
}): Promise<any> {
  const data = await apiFetch<any>(`/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return adaptEvent(data.event || data);
}

export async function sendInvitesForEvent(
  eventId: string,
  volunteerIds: string[] = [],
  inviteAll = false
): Promise<any> {
  const data = await apiFetch<any>(`/events/${eventId}/send-invitations`, {
    method: 'POST',
    body: JSON.stringify({ volunteerIds, inviteAll }),
  });
  return adaptEvent(data.event || data);
}

export async function deleteEvent(eventId: string): Promise<void> {
  await apiFetch(`/events/${eventId}`, { method: 'DELETE' });
}
