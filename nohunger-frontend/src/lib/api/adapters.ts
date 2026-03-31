/**
 * Adapter functions: translate backend MongoDB field names
 * into the shape the frontend UI expects (mirrors the Supabase schema).
 */

// ---------- User / Profile ----------
export function adaptUser(u: any) {
  if (!u) return null;
  return {
    id: u._id || u.id,
    full_name: u.full_name || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName || ''),
    email: u.email,
    gender: u.gender || '',
    role: u.role,
    volunteer_status: u.volunteer_status || u.status || 'pending',
    phone: u.phone || '',
    region: u.region || u.country || '',
    skills: u.skills || [],
    total_hours: u.total_hours ?? u.totalVolunteeringHours ?? 0,
    bio: u.bio || '',
    profile_picture: u.profilePicture || u.profile_picture || '',
    created_at: u.createdAt || u.created_at || new Date().toISOString(),
    appliedActivities: u.appliedActivities || [],
    availability: u.availability || [],
    onboarding_completed: u.onboardingCompleted || u.onboarding_completed || false,
    event_confirmation_status: u.eventConfirmationStatus || u.event_confirmation_status || 'no_invitations',
    invitation_stats: u.invitationStats || u.invitation_stats || { total: 0, accepted: 0, pending: 0, rejected: 0 },
  };
}

// ---------- Activity ----------
export function adaptActivity(a: any) {
  if (!a) return null;
  return {
    id: a._id || a.id,
    title: a.title,
    description: a.description || '',
    activity_type: a.activity_type || a.category || 'outreach',
    location: a.location || '',
    start_date: a.start_date || a.startDate || '',
    end_date: a.end_date || a.endDate || '',
    max_volunteers: a.max_volunteers ?? a.volunteersNeeded ?? 0,
    status: a.status || 'draft',
    check_in_code: a.check_in_code || a.checkInCode || '',
    created_at: a.createdAt || a.created_at || new Date().toISOString(),
    coordinator: a.coordinatorId || a.coordinator || null,
  };
}

// ---------- CheckIn ----------
export function adaptCheckin(c: any) {
  if (!c) return null;
  const computedStatus =
    c.status ||
    (c.checkOutStatus === 'completed'
      ? 'checked_out'
      : c.checkInStatus === 'approved'
        ? 'approved'
        : c.checkInStatus === 'rejected'
          ? 'rejected'
          : 'pending');
  return {
    id: c._id || c.id,
    volunteer_id: c.volunteer_id || c.volunteerId,
    activity_id: c.activity_id || c.activityId,
    checkin_time: c.checkin_time || c.checkInTime || '',
    checkout_time: c.checkout_time || c.checkOutTime || null,
    hours_spent: c.hours_spent ?? c.hoursSpent ?? 0,
    status: computedStatus,
    check_in_code: c.check_in_code || c.checkInCode || '',
    volunteer: c.volunteerId || c.volunteer || null,
    activity: c.activityId || c.activity || null,
  };
}

// ---------- Invitation ----------
export function adaptInvitation(i: any) {
  if (!i) return null;
  return {
    id: i._id || i.id,
    volunteer_id: i.volunteer_id || i.volunteerId,
    activity_id: i.activity_id || i.activityId,
    status: i.status || 'pending',
    message: i.message || '',
    responded_at: i.responded_at || i.respondedAt || null,
    created_at: i.createdAt || i.created_at || new Date().toISOString(),
    // Joined data
    activities: i.activities || (i.activityId && typeof i.activityId === 'object' ? adaptActivity(i.activityId) : null),
    volunteer: i.volunteer || (i.volunteerId && typeof i.volunteerId === 'object' ? adaptUser(i.volunteerId) : null),
  };
}

// ---------- Task ----------
export function adaptTask(t: any) {
  if (!t) return null;
  return {
    id: t._id || t.id,
    title: t.title,
    description: t.description || '',
    status: t.status || 'todo',
    priority: t.priority || 'medium',
    assigned_to: t.assigned_to || t.assignedTo,
    due_date: t.due_date || t.dueDate || null,
    activity_id: t.activity_id || t.activityId,
    created_at: t.createdAt || t.created_at || new Date().toISOString(),
    assignee: t.assignedTo && typeof t.assignedTo === 'object' ? adaptUser(t.assignedTo) : null,
  };
}

// ---------- Notification ----------
export function adaptNotification(n: any) {
  if (!n) return null;
  return {
    id: n._id || n.id,
    user_id: n.user_id || n.userId,
    notification_type: n.notification_type || n.type || 'general',
    title: n.title || '',
    message: n.message || '',
    read: n.read || false,
    related_id: n.related_id || n.relatedId || null,
    created_at: n.createdAt || n.created_at || new Date().toISOString(),
  };
}
