import { apiFetch } from './client';
import { adaptInvitation } from './adapters';

export async function getMyInvitations(): Promise<any[]> {
  const data = await apiFetch<any[]>('/invitations');
  return (Array.isArray(data) ? data : []).map(adaptInvitation);
}

export async function respondToInvitation(
  id: string,
  status: 'accepted' | 'rejected'
): Promise<void> {
  await apiFetch(`/invitations/${id}/${status === 'accepted' ? 'accept' : 'reject'}`, {
    method: 'PUT',
  });
}

export async function createInvitation(payload: {
  volunteerId: string;
  activityId?: string;
  eventId?: string;
  message?: string;
}): Promise<any> {
  const data = await apiFetch<any>('/invitations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return adaptInvitation(data.invitation || data);
}
