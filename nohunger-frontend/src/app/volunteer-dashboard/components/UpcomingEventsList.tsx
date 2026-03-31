'use client';

import React from 'react';
import { MapPin, Clock, Users, ChevronRight, CalendarDays } from 'lucide-react';


// TODO: Backend — GET /api/volunteers/:id/events?status=accepted&upcoming=true
const upcomingEvents = [
  {
    id: 'evt-002',
    name: 'Chorkor Fish Drying Support',
    date: 'Sat, Mar 22',
    time: '07:00 AM',
    location: 'Chorkor Fishing Village',
    role: 'Logistics',
    slotsLeft: 4,
    status: 'upcoming' as const,
  },
  {
    id: 'evt-003',
    name: 'Madina Food Bank Pack Day',
    date: 'Sat, Mar 29',
    time: '08:30 AM',
    location: 'Madina Market Square',
    role: 'Food Packing',
    slotsLeft: 8,
    status: 'upcoming' as const,
  },
  {
    id: 'evt-004',
    name: 'Adenta Community Kitchen',
    date: 'Sun, Apr 6',
    time: '09:00 AM',
    location: 'Adenta Municipal Hall',
    role: 'Cooking',
    slotsLeft: 2,
    status: 'upcoming' as const,
  },
];

export default function UpcomingEventsList() {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-card">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          <h3 className="text-[15px] font-700 text-foreground">Upcoming Events</h3>
        </div>
        <span className="text-[11px] font-600 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {upcomingEvents.length} accepted
        </span>
      </div>

      <div className="divide-y divide-border">
        {upcomingEvents.map((event) => (
          <div
            key={event.id}
            className="px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-600 text-foreground truncate group-hover:text-primary transition-colors">
                  {event.name}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap gap-y-1">
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-muted-foreground" />
                    <span className="text-[11.5px] text-muted-foreground">{event.date} · {event.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={11} className="text-muted-foreground" />
                    <span className="text-[11.5px] text-muted-foreground truncate max-w-[120px]">{event.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-600 bg-primary/8 text-primary px-2 py-0.5 rounded-md">
                    {event.role}
                  </span>
                  <div className="flex items-center gap-1">
                    <Users size={10} className="text-muted-foreground" />
                    <span className={`text-[11px] font-500 ${event.slotsLeft <= 3 ? 'text-warning' : 'text-muted-foreground'}`}>
                      {event.slotsLeft} slots left
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight size={15} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
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