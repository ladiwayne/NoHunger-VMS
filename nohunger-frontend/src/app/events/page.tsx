'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getEvents } from '@/lib/api/events';
import { getMyInvitations } from '@/lib/api/invitations';
import { Calendar, MapPin, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EventsPage() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const [eventsData, invitationsData] = await Promise.all([getEvents(), getMyInvitations()]);
      setEvents(eventsData);
      setInvitations(invitationsData.filter((invite) => invite.event_id));
    } catch (err) {
      console.log('Events fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInvitationStatus = (eventId: string) => {
    const invite = invitations.find((inv) => inv.event_id === eventId);
    return invite?.status || null;
  };

  const filteredEvents = events.filter((event) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      event.title?.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query)
    );
  });

  return (
    <AppLayout activePath="/events">
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-700 text-foreground">Browse Events</h1>
            <p className="text-[13px] sm:text-[14px] text-muted-foreground mt-1">
              See upcoming No Hunger events and track your invitation status.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
            <div className="relative w-full">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events by title, location, or description…"
                className="w-full pl-4 pr-4 py-3 bg-card border border-border rounded-2xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-700 text-foreground">{filteredEvents.length}</span> of{' '}
              <span className="font-700 text-foreground">{events.length}</span> events
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Calendar size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-[15px] font-600 text-foreground">No matching events</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Try another search term or clear the filter to see all upcoming events.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => {
              const status = getInvitationStatus(event.id);
              return (
                <div key={event.id} className="bg-card border border-border rounded-2xl shadow-card p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-700 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/25 uppercase tracking-wide">
                        {event.status}
                      </span>
                      {status && (
                        <span className="text-[11px] font-700 px-2.5 py-1 rounded-full bg-warning/10 text-warning border border-warning/25 uppercase tracking-wide">
                          {status}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[16px] font-700 text-foreground mb-2 leading-snug">{event.title}</h3>
                    <p className="text-[13px] text-muted-foreground mb-3 line-clamp-3">{event.description}</p>
                    <div className="space-y-2 text-[13px] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{new Date(event.start_date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.max_volunteers > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="font-600">Max Champions:</span>
                          <span>{event.max_volunteers}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-2">
                    {status === 'accepted' ? (
                      <Link
                        href={`/checkin/${event.check_in_code}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-700 text-white bg-primary rounded-2xl hover:bg-primary-dark transition-all"
                      >
                        <CheckCircle2 size={14} />
                        <span>Go to Check-in</span>
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <p className="text-[12.5px] text-muted-foreground">
                        {status === 'pending'
                          ? 'Your RSVP is pending. Visit My Invitations to respond.'
                          : status === 'rejected'
                          ? 'You declined this event invitation.'
                          : 'If you have an invitation, accept it from My Invitations.'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
