'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Clock, Users, ChevronRight, CalendarDays, Loader2 } from 'lucide-react';
import { getEvents } from '@/lib/api/events';

interface EventItem {
  id: string;
  title: string;
  startDate: string;
  location: string;
  maxVolunteers?: number;
  status: string;
}

export default function UpcomingEventsList() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getEvents();
        const upcoming = (data || [])
          .filter((event) => event?.status && ['published', 'ongoing'].includes(event.status))
          .map((event) => ({
            id: event.id,
            title: event.title,
            startDate: event.start_date,
            location: event.location,
            maxVolunteers: event.max_volunteers,
            status: event.status,
          }))
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 3);
        setEvents(upcoming);
      } catch (error) {
        console.error('Failed to load upcoming events', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl shadow-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={16} className="text-primary" />
          <h3 className="text-[15px] font-700 text-foreground">Upcoming Events</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          <h3 className="text-[15px] font-700 text-foreground">Upcoming Events</h3>
        </div>
        <span className="text-[11px] font-600 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {events.length} upcoming
        </span>
      </div>

      <div className="divide-y divide-border">
        {events.length === 0 ? (
          <div className="px-5 py-6 text-center text-[12.5px] text-muted-foreground">
            No upcoming events are available right now.
          </div>
        ) : events.map((event) => (
          <div
            key={event.id}
            className="px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-600 text-foreground truncate group-hover:text-primary transition-colors">
                  {event.title}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap gap-y-1">
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-muted-foreground" />
                    <span className="text-[11.5px] text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={11} className="text-muted-foreground" />
                    <span className="text-[11.5px] text-muted-foreground truncate max-w-[120px]">
                      {event.location}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-600 bg-primary/8 text-primary px-2 py-0.5 rounded-md">
                    Event
                  </span>
                  <div className="flex items-center gap-1">
                    <Users size={10} className="text-muted-foreground" />
                    <span
                      className={`text-[11px] font-500 ${event.slotsLeft <= 3 ? 'text-warning' : 'text-muted-foreground'}`}
                    >
                      {event.maxVolunteers ? `${event.maxVolunteers} slots` : 'Open event'}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight
                size={15}
                className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-border">
        <button className="w-full text-[12.5px] font-600 text-primary hover:underline flex items-center justify-center gap-1">
          View all events
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
