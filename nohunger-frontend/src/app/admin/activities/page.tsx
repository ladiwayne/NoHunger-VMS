'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  sendInvitesForActivity,
  resetCheckinCode,
} from '@/lib/api/activities';
import { getVolunteers } from '@/lib/api/volunteers';
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Copy,
  Send,
  Loader2,
  X,
  CheckCircle2,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface ActivityForm {
  title: string;
  description: string;
  activity_type: string;
  location: string;
  start_date: string;
  end_date: string;
  max_volunteers: string;
  status: string;
}

interface ActivityFormErrors {
  title?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
}

const ACTIVITY_TYPES = [
  { value: 'general_event', label: 'General Event' },
  { value: 'community_outreach', label: 'Community Outreach' },
  { value: 'food_bank', label: 'Food Bank Activity' },
  { value: 'training_education', label: 'Training & Education' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'health', label: 'Health' },
  { value: 'virtual', label: 'Virtual Event' },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  ACTIVITY_TYPES.map((t) => [t.value, t.label])
);

const defaultForm: ActivityForm = {
  title: '',
  description: '',
  activity_type: 'general_event',
  location: '',
  start_date: '',
  end_date: '',
  max_volunteers: '',
  status: 'draft',
};

export default function AdminActivitiesPage() {
  const { user, profile } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ActivityForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [sendingInvites, setSendingInvites] = useState<string | null>(null);
  const [resettingCode, setResettingCode] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<ActivityFormErrors>({});
  const [formVolunteerSearch, setFormVolunteerSearch] = useState('');
  const [formVolunteerSearchResults, setFormVolunteerSearchResults] = useState<any[]>([]);
  const [formSelectedVolunteers, setFormSelectedVolunteers] = useState<any[]>([]);
  const [formLoadingVolunteerSearch, setFormLoadingVolunteerSearch] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const data = await getActivities();
      setActivities(data || []);
    } catch (err) {
      console.log('Activities fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalActivities = activities.length;
  const publishedActivities = activities.filter((activity) => activity.status === 'published').length;
  const ongoingActivities = activities.filter((activity) => activity.status === 'ongoing').length;
  const draftActivities = activities.filter((activity) => activity.status === 'draft').length;

  const filteredActivities = activities.filter((activity) => {
    const searchValue = search.toLowerCase();
    const matchesSearch =
      activity.title?.toLowerCase().includes(searchValue) ||
      activity.location?.toLowerCase().includes(searchValue) ||
      activity.description?.toLowerCase().includes(searchValue);
    const matchesType = typeFilter === 'all' || activity.activity_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSave = async () => {
    const nextErrors: ActivityFormErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required.';
    if (!form.description.trim()) nextErrors.description = 'Description is required.';
    if (!form.location.trim()) nextErrors.location = 'Location is required.';
    if (!form.start_date) nextErrors.start_date = 'Start date/time is required.';
    if (!form.end_date) nextErrors.end_date = 'End date/time is required.';

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      toast.error('Please fix the highlighted fields.');
      return;
    }
    setFormErrors({});

    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setFormErrors({
        start_date: 'Provide a valid start date/time.',
        end_date: 'Provide a valid end date/time.',
      });
      toast.error('Please provide valid start and end date/time values.');
      return;
    }

    if (endDate <= startDate) {
      setFormErrors({ end_date: 'End date/time must be after start date/time.' });
      toast.error('End date/time must be after start date/time.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        activity_type: form.activity_type,
        location: form.location,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        max_volunteers: form.max_volunteers ? parseInt(form.max_volunteers) : 0,
        status: form.status,
        invitedVolunteers: formSelectedVolunteers.map((vol) => vol.id),
      };

      if (editId) {
        await updateActivity(editId, payload);
        toast.success('Activity updated!');
      } else {
        await createActivity(payload);
        toast.success('🎉 Event/activity created! Selected volunteers will receive invitations.');
      }

      setShowForm(false);
      setForm(defaultForm);
      setFormErrors({});
      setFormVolunteerSearch('');
      setFormVolunteerSearchResults([]);
      setFormSelectedVolunteers([]);
      setEditId(null);
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message || 'Unable to save activity. Please review and try again.');
    } finally {
      setSaving(false);
    }
  };

  const searchVolunteers = async (query: string) => {
    if (!query.trim()) {
      setFormVolunteerSearchResults([]);
      return;
    }

    setFormVolunteerSearch(query);
    setFormLoadingVolunteerSearch(true);
    try {
      const result = await getVolunteers({ status: 'approved', search: query, limit: 20 });
      setFormVolunteerSearchResults(result.data || []);
    } catch (err) {
      console.log('Volunteer search error:', err);
    } finally {
      setFormLoadingVolunteerSearch(false);
    }
  };

  const addVolunteerSelection = (volunteer: any) => {
    setFormSelectedVolunteers((prev) =>
      Array.from(new Map([...prev, volunteer].map((item) => [item.id, item])).values())
    );
  };

  const removeVolunteerSelection = (volunteerId: string) => {
    setFormSelectedVolunteers((prev) => prev.filter((item) => item.id !== volunteerId));
  };

  const handleEdit = (activity: any) => {
    setForm({
      title: activity.title || '',
      description: activity.description || '',
      activity_type: activity.activity_type || 'general_event',
      location: activity.location || '',
      start_date: activity.start_date
        ? new Date(activity.start_date).toISOString().slice(0, 16)
        : '',
      end_date: activity.end_date ? new Date(activity.end_date).toISOString().slice(0, 16) : '',
      max_volunteers: activity.max_volunteers?.toString() || '',
      status: activity.status || 'draft',
    });
    setFormErrors({});
    setFormVolunteerSearch('');
    setFormVolunteerSearchResults([]);
    setFormSelectedVolunteers(activity.invitedVolunteers || []);
    setEditId(activity.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this activity? This cannot be undone.')) return;
    try {
      await deleteActivity(id);
      toast.success('🗑️ Activity deleted. The schedule has been updated.');
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message || 'Unable to save activity. Please review and try again.');
    }
  };

  const sendInvitationsToAll = async (activity: any) => {
    setSendingInvites(activity.id);
    try {
      await sendInvitesForActivity(activity.id);
      toast.success('Invitations sent to approved No Hunger Champions!');
    } catch (err: any) {
      toast.error(err.message || 'Unable to send invitations. Please try again.');
    } finally {
      setSendingInvites(null);
    }
  };

  const handleResetCode = async (id: string) => {
    if (!confirm('Reset the check-in code for this activity? The old code will no longer work.')) return;
    setResettingCode(id);
    try {
      const updated = await resetCheckinCode(id);
      setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success('Check-in code reset successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Unable to reset the check-in code. Please try again.');
    } finally {
      setResettingCode(null);
    }
  };

  const copyCheckinLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Check-in link copied!');
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      published: 'bg-primary/10 text-primary border-primary/25',
      ongoing: 'bg-success/10 text-success border-success/25',
      completed: 'bg-muted text-muted-foreground border-border',
      draft: 'bg-warning/10 text-warning border-warning/25',
      cancelled: 'bg-destructive/10 text-destructive border-destructive/25',
    };
    return map[status] || 'bg-muted text-muted-foreground border-border';
  };

  return (
    <AppLayout activePath="/admin/activities">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Activities</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Create and manage activities for No Hunger Champions.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditId(null);
              setForm(defaultForm);
              setFormErrors({});
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all text-[13.5px]"
          >
            <Plus size={16} /> New Activity
          </button>
        </div>

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-card border border-border rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-[17px] font-700 text-foreground">
                  {editId ? 'Edit Activity' : 'Create New Activity'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Title *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, title: e.target.value }));
                      setFormErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                    placeholder="Activity title"
                    className={`w-full px-3.5 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${formErrors.title ? 'border-destructive' : 'border-border'}`}
                  />
                  {formErrors.title && (
                    <p className="text-[12px] text-destructive mt-1">{formErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, description: e.target.value }));
                      setFormErrors((prev) => ({ ...prev, description: undefined }));
                    }}
                    rows={3}
                    placeholder="Describe the activity…"
                    className={`w-full px-3.5 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none ${formErrors.description ? 'border-destructive' : 'border-border'}`}
                  />
                  {formErrors.description && (
                    <p className="text-[12px] text-destructive mt-1">{formErrors.description}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Location *
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, location: e.target.value }));
                      setFormErrors((prev) => ({ ...prev, location: undefined }));
                    }}
                    placeholder="Event venue / address"
                    className={`w-full px-3.5 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${formErrors.location ? 'border-destructive' : 'border-border'}`}
                  />
                  {formErrors.location && (
                    <p className="text-[12px] text-destructive mt-1">{formErrors.location}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={form.start_date}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, start_date: e.target.value }));
                        setFormErrors((prev) => ({ ...prev, start_date: undefined }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${formErrors.start_date ? 'border-destructive' : 'border-border'}`}
                    />
                    {formErrors.start_date && (
                      <p className="text-[12px] text-destructive mt-1">{formErrors.start_date}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={form.end_date}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, end_date: e.target.value }));
                        setFormErrors((prev) => ({ ...prev, end_date: undefined }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${formErrors.end_date ? 'border-destructive' : 'border-border'}`}
                    />
                    {formErrors.end_date && (
                      <p className="text-[12px] text-destructive mt-1">{formErrors.end_date}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Max No Hunger Champions
                  </label>
                  <input
                    type="number"
                    value={form.max_volunteers}
                    onChange={(e) => setForm((p) => ({ ...p, max_volunteers: e.target.value }))}
                    placeholder="e.g. 50"
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div className="grid gap-4">
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">Invite volunteers</label>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                    <input
                      value={formVolunteerSearch}
                      onChange={(e) => setFormVolunteerSearch(e.target.value)}
                      placeholder="Search approved volunteers by name or email…"
                      className="w-full px-4 py-3 bg-muted border border-border rounded-2xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => searchVolunteers(formVolunteerSearch)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground font-700 rounded-2xl border border-border hover:bg-secondary/90 transition-all"
                    >
                      Search
                    </button>
                  </div>
                  {formLoadingVolunteerSearch ? (
                    <p className="text-[13px] text-muted-foreground mt-2">Searching volunteers…</p>
                  ) : formVolunteerSearchResults.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {formVolunteerSearchResults.map((vol) => (
                        <button
                          key={vol.id}
                          type="button"
                          onClick={() => addVolunteerSelection(vol)}
                          className="flex items-center justify-between gap-3 px-4 py-3 bg-card border border-border rounded-2xl text-left text-[13px] text-foreground hover:bg-muted transition-all"
                        >
                          <div>
                            <div className="font-600">{vol.full_name || vol.email}</div>
                            <div className="text-[12px] text-muted-foreground">{vol.email}</div>
                          </div>
                          <span className="text-primary font-700">Add</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    formVolunteerSearch && (
                      <p className="text-[13px] text-muted-foreground mt-2">No approved volunteers found for that search.</p>
                    )
                  )}
                  {formSelectedVolunteers.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formSelectedVolunteers.map((vol) => (
                        <button
                          key={vol.id}
                          type="button"
                          onClick={() => removeVolunteerSelection(vol.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 text-primary border border-primary/25 text-[12px] font-600"
                        >
                          {vol.full_name || vol.email}
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[12px] text-muted-foreground mt-2">
                    Selected volunteers will receive invitations when the activity is created.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-muted text-muted-foreground font-600 rounded-xl hover:bg-border transition-all text-[13.5px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60 text-[13.5px]"
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {editId ? 'Update Activity' : 'Create Activity'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Total activities</p>
            <p className="text-3xl font-800 text-foreground">{totalActivities}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Published</p>
            <p className="text-3xl font-800 text-foreground">{publishedActivities}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Ongoing</p>
            <p className="text-3xl font-800 text-foreground">{ongoingActivities}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Drafts</p>
            <p className="text-3xl font-800 text-foreground">{draftActivities}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities by title, location, or description…"
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-2xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-56 px-3.5 py-2.5 bg-card border border-border rounded-2xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Type filter bar */}
        {!loading && activities.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-600 border transition-all ${
                typeFilter === 'all'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-muted text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              }`}
            >
              All Types
            </button>
            {ACTIVITY_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-600 border transition-all ${
                  typeFilter === t.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Activities list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-40 bg-card border border-border rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Calendar size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-[15px] font-600 text-foreground">No activities match your filters</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Adjust your search or filters, or create a new activity.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="bg-card border border-border rounded-2xl shadow-card p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[11px] font-700 px-2.5 py-1 rounded-full border uppercase tracking-wide ${statusColor(act.status)}`}
                      >
                        {act.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {TYPE_LABEL[act.activity_type] || act.activity_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-700 text-foreground mb-2">{act.title}</h3>
                    {act.description && (
                      <p className="text-[13px] text-muted-foreground mb-3 line-clamp-2">
                        {act.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                        <Calendar size={13} />
                        <span>
                          {new Date(act.start_date).toLocaleDateString('en', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {act.location && (
                        <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                          <MapPin size={13} />
                          <span>{act.location}</span>
                        </div>
                      )}
                      {act.max_volunteers && (
                        <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                          <Users size={13} />
                          <span>Max {act.max_volunteers}</span>
                        </div>
                      )}
                    </div>

                    {/* Check-in code */}
                    {act.check_in_code && (
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/8 border border-primary/20 rounded-lg">
                          <span className="text-[11px] font-600 text-muted-foreground">Code:</span>
                          <code className="text-[13px] font-800 text-primary">
                            {act.check_in_code}
                          </code>
                        </div>
                        {act.checkin_link && (
                          <button
                            onClick={() => copyCheckinLink(act.checkin_link)}
                            className="flex items-center gap-1.5 text-[12px] font-600 text-primary hover:underline"
                          >
                            <Copy size={12} /> Copy link
                          </button>
                        )}
                        <button
                          onClick={() => handleResetCode(act.id)}
                          disabled={resettingCode === act.id}
                          className="flex items-center gap-1.5 text-[12px] font-600 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        >
                          {resettingCode === act.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <RefreshCw size={12} />
                          )}
                          Reset code
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => sendInvitationsToAll(act)}
                      disabled={sendingInvites === act.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary border border-primary/25 rounded-xl text-[12px] font-700 hover:bg-primary/20 transition-colors disabled:opacity-60"
                    >
                      {sendingInvites === act.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      Invite All
                    </button>
                    <button
                      onClick={() => handleEdit(act)}
                      className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(act.id)}
                      className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
