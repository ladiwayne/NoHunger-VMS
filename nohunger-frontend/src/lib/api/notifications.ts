import { apiFetch } from './client';
import { adaptNotification } from './adapters';

export async function getNotifications(): Promise<any[]> {
  try {
    const data = await apiFetch<any[]>('/notifications');
    return (Array.isArray(data) ? data : []).map(adaptNotification);
  } catch {
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch('/notifications/read-all', { method: 'PUT' });
}

export async function getUnreadCount(): Promise<number> {
  try {
    const data = await apiFetch<{ count: number }>('/notifications/unread-count');
    return data.count || 0;
  } catch {
    return 0;
  }
}

export async function sendBroadcast(payload: {
  message: string;
  subject?: string;
  recipientType?: 'all' | 'approved' | 'pending';
  recipientIds?: string[];
}): Promise<void> {
  await apiFetch('/admin/broadcasts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getBroadcasts(): Promise<any[]> {
  try {
    const data = await apiFetch<any[]>('/admin/broadcasts');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
