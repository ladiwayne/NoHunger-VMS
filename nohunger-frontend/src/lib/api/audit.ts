import { apiFetch } from './client';

export interface AuditLogEntry {
  _id: string;
  actorId: string;
  actorRole: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string;
  targetUserId?: string;
  targetUserName?: string;
  details?: any;
  createdAt: string;
}

export async function getMyAuditLogs(): Promise<AuditLogEntry[]> {
  return apiFetch<AuditLogEntry[]>('/audit/me');
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  return apiFetch<AuditLogEntry[]>('/audit/admin');
}

export async function getVolunteerAuditLogs(volunteerId: string): Promise<AuditLogEntry[]> {
  return apiFetch<AuditLogEntry[]>(`/audit/volunteer/${volunteerId}`);
}
