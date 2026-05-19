import { apiFetch } from './client';
import { adaptTask } from './adapters';

export async function getTasks(filters?: { assignedTo?: string; status?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.assignedTo) params.set('assignedTo', filters.assignedTo);
  if (filters?.status) params.set('status', filters.status);
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiFetch<any[]>(`/tasks${query}`);
  return (Array.isArray(data) ? data : []).map(adaptTask);
}

export async function updateTask(id: string, payload: any): Promise<any> {
  const data = await apiFetch<any>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return adaptTask(data.task || data);
}

export async function deleteTask(id: string): Promise<void> {
  await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
}
