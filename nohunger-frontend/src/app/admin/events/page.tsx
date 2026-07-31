'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getEvents, createEvent, updateEvent, sendInvitesForEvent, deleteEvent } from '@/lib/api/events';
import { getVolunteers } from '@/lib/api/volunteers';
import { Calendar, MapPin, Users, Send, Loader2, X, Copy, CheckCircle2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface EventForm {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  endDate: string;
  status: string;
  maxVolunteers: string;
}

const defaultForm: EventForm = {
  title: '',
  description: '',
  location: '',
  eventDate: '',
  endDate: '',
  status: 'draft',
  maxVolunteers: '0',
};

export default function AdminEventsPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EventForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  const [volunteerSearchResults, setVolunteerSearchResults] = useState<any[]>([]);
  const [activeSearchEventId, setActiveSearchEventId] = useState<string | null>(null);
  const [loadingVolunteerSearch, setLoadingVolunteerSearch] = useState(false);
  const [formVolunteerSearch, setFormVolunteerSearch] = useState('');
  const [formVolunteerSearchResults, setFormVolunteerSearchResults] = useState<any[]>([]);
  const [formSelectedVolunteers, setFormSelectedVolunteers] = useState<any[]>([]);
  const [formLoadingVolunteerSearch, setFormLoadingVolunteerSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data || []);
    } catch (err) {
      console.log('Events fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalEvents = events.length;
  const publishedEvents = events.filter((event) => event.status === 'published').length;
  const upcomingEvents = events.filter(
    (event) => event.start_date && new Date(event.start_date) > new Date()
  ).length;
  const draftEvents = events.filter((event) => event.status === 'draft').length;

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title?.toLowerCase().includes(search.toLowerCase()) ||
      event.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-primary/10 text-primary border-primary/25';
      case 'ongoing':
        return 'bg-success/10 text-success border-success/25';
      case 'completed':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-warning/10 text-warning border-warning/25';
    }
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required.';
    if (!form.description.trim()) nextErrors.description = 'Description is required.';
    if (!form.location.trim()) nextErrors.location = 'Location is required.';
    if (!form.eventDate) nextErrors.eventDate = 'Event date and time are required.';
    if (!form.endDate) nextErrors.endDate = 'Event end date and time are required.';

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    const eventDate = new Date(form.eventDate);
    const endDate = new Date(form.endDate);
    if (Number.isNaN(eventDate.getTime())) {
      setFormErrors({ eventDate: 'Enter a valid date and time.' });
      toast.error('Provide a valid event date and time.');
      return;
    }
    if (Number.isNaN(endDate.getTime())) {
      setFormErrors({ endDate: 'Enter a valid end date and time.' });
      toast.error('Provide a valid event end date and time.');
      return;
    }
    if (endDate <= eventDate) {
      setFormErrors({ endDate: 'End date/time must be after event start date/time.' });
      toast.error('End date/time must be after event start date/time.');
      return;
    }

    const maxVolunteers = Math.max(0, Number(form.maxVolunteers) || 0);

    setSaving(true);
    try {
      if (editEventId) {
        await updateEvent(editEventId, {
          title: form.title,
          description: form.description,
          location: form.location,
          eventDate: eventDate.toISOString(),
          endDate: endDate.toISOString(),
          status: form.status,
          max_volunteers: maxVolunteers,
        });
        toast.success('🎉 Event updated successfully!');
      } else {
        const invitedVolunteers = formSelectedVolunteers.map((vol) => vol.id);

        await createEvent({
          title: form.title,
          description: form.description,
          location: form.location,
          eventDate: eventDate.toISOString(),
          endDate: endDate.toISOString(),
          status: form.status,
          invitedVolunteers,
          max_volunteers: maxVolunteers,
        });
        toast.success('🎉 Event created successfully!');
      }

      setForm(defaultForm);
      setShowForm(false);
      setEditEventId(null);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Unable to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvites = async (
    eventId: string,
    selectedIds: string[] = [],
    inviteAll = false
  ) => {
    const volunteerIds = selectedIds;

    if (!inviteAll && volunteerIds.length === 0) {
      toast.error('Select at least one volunteer or choose Send to all approved volunteers.');
      return;
    }

    setSendingId(eventId);
    try {
      await sendInvitesForEvent(eventId, volunteerIds, inviteAll);
      toast.success('Invitations queued for delivery.');
      fetchEvents();
      setVolunteerSearchResults([]);
      setActiveSearchEventId(null);
    } catch (err: any) {
      toast.error(err.message || 'Unable to send invitations. Please try again.');
    } finally {
      setSendingId(null);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Check-in link copied!');
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Delete this event? Volunteer records will remain intact, but the event and its invitations will be removed.')) return;
    try {
      await deleteEvent(eventId);
      toast.success('🗑️ Event deleted successfully.');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Unable to delete event. Please try again.');
    }
  };

  const handleEdit = (event: any) => {
    setEditEventId(event.id);
    setForm({
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      eventDate: event.start_date ? event.start_date.slice(0, 16) : '',
      endDate: event.end_date ? event.end_date.slice(0, 16) : '',
      status: event.status || 'draft',
      maxVolunteers: event.max_volunteers?.toString() || '0',
    });
    setFormErrors({});
    setFormVolunteerSearch('');
    setFormVolunteerSearchResults([]);
    setFormSelectedVolunteers([]);
    setShowForm(true);
  };

  const searchVolunteers = async (query: string, eventId?: string) => {
    if (!query.trim()) {
      if (eventId) {
        setVolunteerSearchResults([]);
        setActiveSearchEventId(null);
      } else {
        setFormVolunteerSearchResults([]);
      }
      return;
    }

    if (eventId) {
      setActiveSearchEventId(eventId);
      setLoadingVolunteerSearch(true);
    } else {
      setFormLoadingVolunteerSearch(true);
      setFormVolunteerSearch(query);
    }

    try {
      const result = await getVolunteers({ status: 'approved', search: query, limit: 20 });
      if (eventId) {
        setVolunteerSearchResults(result.data || []);
      } else {
        setFormVolunteerSearchResults(result.data || []);
      }
    } catch (err) {
      console.log('Volunteer search error:', err);
    } finally {
      if (eventId) {
        setLoadingVolunteerSearch(false);
      } else {
        setFormLoadingVolunteerSearch(false);
      }
    }
  };

  const addVolunteerSelection = (eventId: string, volunteer: any) => {
    setEvents((prev) =>
      prev.map((item) => {
        if (item.id !== eventId) return item;
        const selectedIds = Array.from(new Set([...(item._selectedVolunteerIds || []), volunteer.id]));
        const selectedVolunteers = Array.from(
          new Map([...(item._selectedVolunteers || []).map((v: any) => [v.id, v]), [volunteer.id, volunteer]]).values()
        );
        return { ...item, _selectedVolunteerIds: selectedIds, _selectedVolunteers: selectedVolunteers };
      })
    );
  };

  const removeVolunteerSelection = (eventId: string, volunteerId: string) => {
    setEvents((prev) =>
      prev.map((item) => {
        if (item.id !== eventId) return item;
        return {
          ...item,
          _selectedVolunteerIds: (item._selectedVolunteerIds || []).filter((id: string) => id !== volunteerId),
          _selectedVolunteers: (item._selectedVolunteers || []).filter((v: any) => v.id !== volunteerId),
        };
      })
    );
  };

  return (
    <AppLayout activePath="/admin/events">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Events</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Create and manage event experiences for No Hunger Champions.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditEventId(null);
              setForm(defaultForm);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all text-[13.5px]"
          >
            <Plus size={16} /> New Event
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Total Events</p>
            <p className="text-3xl font-800 text-foreground">{totalEvents}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Published</p>
            <p className="text-3xl font-800 text-foreground">{publishedEvents}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Upcoming</p>
            <p className="text-3xl font-800 text-foreground">{upcomingEvents}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Drafts</p>
            <p className="text-3xl font-800 text-foreground">{draftEvents}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by title or location…"
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
          </select>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-card border border-border rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-[17px] font-700 text-foreground">
                  {editEventId ? 'Edit Event' : 'Create Event'}
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
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, title: e.target.value }));
                      setFormErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                    placeholder="Event title"
                    className={`w-full px-3.5 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${formErrors.title ? 'border-destructive' : 'border-border'}`}
                  />
                  {formErrors.title && <p className="text-[12px] text-destructive mt-2">{formErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, description: e.target.value }));
                      setFormErrors((prev) => ({ ...prev, description: undefined }));
                    }}
                    rows={4}
                    placeholder="Describe the event..."
                    className={`w-full px-3.5 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none ${formErrors.description ? 'border-destructive' : 'border-border'}`}
                  />
                  {formErrors.description && <p className="text-[12px] text-destructive mt-2">{formErrors.description}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">Location *</label>
                    <input
                      value={form.location}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, location: e.target.value }));
                        setFormErrors((prev) => ({ ...prev, location: undefined }));
                      }}
                      placeholder="Event venue or address"
                      className={`w-full px-3.5 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${formErrors.location ? 'border-destructive' : 'border-border'}`}
                    />
                    {formErrors.location && <p className="text-[12px] text-destructive mt-2">{formErrors.location}</p>}
                  </div>
                  <div>
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">Event Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={form.eventDate}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, eventDate: e.target.value }));
                        setFormErrors((prev) => ({ ...prev, eventDate: undefined }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${formErrors.eventDate ? 'border-destructive' : 'border-border'}`}
                    />
                    {formErrors.eventDate && <p className="text-[12px] text-destructive mt-2">{formErrors.eventDate}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">Event End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, endDate: e.target.value }));
                        setFormErrors((prev) => ({ ...prev, endDate: undefined }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${formErrors.endDate ? 'border-destructive' : 'border-border'}`}
                    />
                    {formErrors.endDate && <p className="text-[12px] text-destructive mt-2">{formErrors.endDate}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[240px_minmax(0,1fr)] gap-3">
                  <div>
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">Max Volunteers</label>
                    <input
                      type="number"
                      min={0}
                      value={form.maxVolunteers}
                      onChange={(e) => setForm((prev) => ({ ...prev, maxVolunteers: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-600 text-foreground mb-1.5">Invite volunteers</label>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                      <input
                        value={formVolunteerSearch}
                        onChange={(e) => setFormVolunteerSearch(e.target.value)}
                        placeholder="Search approved volunteers by name or email…"
                        className="w-full px-4 py-3 bg-muted border border-border rounded-2xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      <button
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
                            onClick={() => {
                              setFormSelectedVolunteers((prev) =>
                                Array.from(new Map([...prev, vol].map((item) => [item.id, item])).values())
                              );
                            }}
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
                            onClick={() => setFormSelectedVolunteers((prev) => prev.filter((item) => item.id !== vol.id))}
                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 text-primary border border-primary/25 text-[12px] font-600"
                          >
                            {vol.full_name || vol.email}
                            <X size={12} />
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-[12px] text-muted-foreground mt-2">
                      Selected volunteers will receive invitations when the event is created.
                    </p>
                  </div>
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
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {editEventId ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="h-40 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Calendar size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-[15px] font-600 text-foreground">No events yet</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Create your first event so volunteers can be invited and check in with a code.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-card border border-border rounded-2xl shadow-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 items-center mb-3">
                      <span className={`text-[11px] font-700 px-2.5 py-1 rounded-full border uppercase tracking-wide ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{new Date(event.start_date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <h3 className="text-[17px] font-700 text-foreground mb-2">{event.title}</h3>
                    <p className="text-[13px] text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                    <div className="flex flex-wrap gap-3 text-[13px] text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <MapPin size={14} /> {event.location || 'Location not set'}
                      </span>
                      <span className="flex items-center gap-2">
                        <Users size={14} /> {event.invitedVolunteers?.length ?? 0} invited
                      </span>
                      {event.max_volunteers > 0 && (
                        <span className="flex items-center gap-2">
                          <span className="font-600">Max</span> {event.max_volunteers}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      onClick={() => handleEdit(event)}
                      className="px-3 py-2 rounded-2xl bg-muted text-muted-foreground hover:bg-border transition-all text-[13px] font-600"
                    >
                      Edit
                    </button>
                    {profile?.role === 'super_admin' && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="px-3 py-2 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all text-[13px] font-600"
                      >
                        Delete
                      </button>
                    )}
                    {event.check_in_code && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-primary/8 text-primary text-[13px] font-600">
                        <span>Code:</span>
                        <code className="font-700">{event.check_in_code}</code>
                      </div>
                    )}
                    {event.checkin_link && (
                      <button
                        onClick={() => copyLink(event.checkin_link)}
                        className="flex items-center gap-2 text-[13px] font-700 text-primary hover:underline"
                      >
                        <Copy size={14} /> Copy check-in link
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                    <input
                      value={event._inviteSearch || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEvents((prev) => prev.map((item) => (item.id === event.id ? { ...item, _inviteSearch: value } : item)));
                      }}
                      placeholder="Search approved volunteers by name…"
                      className="w-full px-4 py-3 bg-muted border border-border rounded-2xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <button
                      onClick={() => searchVolunteers(event._inviteSearch || '', event.id)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground font-700 rounded-2xl border border-border hover:bg-secondary/90 transition-all"
                    >
                      Search
                    </button>
                  </div>

                  {activeSearchEventId === event.id && (
                    <div className="space-y-3">
                      {loadingVolunteerSearch ? (
                        <div className="text-[13px] text-muted-foreground">Searching volunteers…</div>
                      ) : volunteerSearchResults.length > 0 ? (
                        <div className="grid gap-2">
                          {volunteerSearchResults.map((vol) => (
                            <button
                              key={vol.id}
                              onClick={() => addVolunteerSelection(event.id, vol)}
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
                        <div className="text-[13px] text-muted-foreground">No approved volunteers found for this search.</div>
                      )}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                    <div>
                      {event._selectedVolunteers?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {event._selectedVolunteers.map((vol: any) => (
                            <button
                              key={vol.id}
                              type="button"
                              onClick={() => removeVolunteerSelection(event.id, vol.id)}
                              className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 text-primary border border-primary/25 text-[12px] font-600"
                            >
                              {vol.full_name || vol.email}
                              <X size={12} />
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleSendInvites(event.id, event._selectedVolunteerIds || [])}
                        disabled={sendingId === event.id}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-700 rounded-2xl hover:bg-primary-dark transition-all disabled:opacity-60"
                      >
                        {sendingId === event.id ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
                        Send Invites
                      </button>
                    </div>

                    <button
                      onClick={() => handleSendInvites(event.id, [], true)}
                      disabled={sendingId === event.id}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-primary border border-primary/25 rounded-2xl hover:bg-primary/20 transition-all disabled:opacity-60"
                    >
                      {sendingId === event.id ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
                      Send to all approved volunteers
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
