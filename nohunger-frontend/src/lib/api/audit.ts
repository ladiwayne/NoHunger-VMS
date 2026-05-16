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

const actionLabels: Record<string, string> = {
  update_profile: 'Updated your profile',
  apply_for_activity: 'Applied for an activity',
  approve_volunteer: 'Approved a volunteer',
  reject_volunteer: 'Rejected a volunteer',
  approve_admin_request: 'Approved an admin request',
  reject_admin_request: 'Rejected an admin request',
  revoke_admin: 'Revoked an admin role',
  promote_to_admin: 'Promoted a user to admin',
  reset_volunteer_password: 'Reset a volunteer password',
  create_activity: 'Created an activity',
  update_activity: 'Updated an activity',
  reset_checkin_code: 'Reset an activity check-in code',
  approve_activity_volunteer: 'Approved volunteer for activity',
  send_activity_invites: 'Sent activity invites',
  delete_activity: 'Deleted an activity',
  approve_checkin: 'Approved a check-in',
  approve_checkout: 'Approved a check-out',
  reject_checkin: 'Rejected a check-in',
  create_task: 'Created a task',
  update_task: 'Updated a task',
  delete_task: 'Deleted a task',
};

export function getAuditActionLabel(action: string): string {
  return actionLabels[action] ||
    action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (match) => match.toUpperCase());
}

function prettyFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function formatAuditLogDetails(entry: AuditLogEntry): string {
  const details = entry.details;
  if (!details) {
    if (entry.targetUserName) return `Target: ${entry.targetUserName}`;
    if (entry.entityType) return `${entry.entityType}`;
    return '-';
  }

  if (typeof details === 'string') {
    return details;
  }

  if (Array.isArray(details)) {
    return details.join(', ');
  }

  if (details.activityTitle) {
    return `Activity: ${details.activityTitle}`;
  }

  if (details.count !== undefined) {
    return `Count: ${details.count}`;
  }

  if (details.updatedFields) {
    const updated = Array.isArray(details.updatedFields)
      ? details.updatedFields.map(prettyFieldName).join(', ')
      : String(details.updatedFields);
    return `Fields changed: ${updated}`;
  }

  if (details.status) {
    return `Status: ${String(details.status).replace(/_/g, ' ')}`;
  }

  if (details.reason) {
    return `Reason: ${String(details.reason).replace(/_/g, ' ')}`;
  }

  const entries = Object.entries(details).map(([key, value]) => {
    if (typeof value === 'object') {
      return `${prettyFieldName(key)}: ${JSON.stringify(value)}`;
    }
    return `${prettyFieldName(key)}: ${value}`;
  });

  return entries.join(' · ');
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
