'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getActivities } from '@/lib/api/activities';
import { getVolunteer } from '@/lib/api/volunteers';
import { apiFetch } from '@/lib/api/client';
import { Calendar, MapPin, Users, CheckCircle2, Loader2, Search, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [applications, setApplications] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const acts = await getActivities();
      const visible = acts
        .filter((a) => ['published', 'ongoing'].includes(a.status))
        .sort(
          (a, b) => new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime()
        );
      setActivities(visible || []);

      if (user) {
        const volunteer = await getVolunteer(user.id);
        const appMap: Record<string, any> = {};
        const appliedIds: string[] =
          volunteer?.appliedActivities?.map((a: any) => a._id || a.id) || [];
        appliedIds.forEach((id) => {
          appMap[id] = { activity_id: id, status: 'pending' };
        });
        visible.forEach((a) => {
          const approved = (a as any).volunteersApproved?.some(
            (v: any) => (v._id || v.id) === user.id
          );
          if (approved) appMap[a.id] = { activity_id: a.id, status: 'approved' };
        });
        setApplications(appMap);
      }
    } catch (err) {
      console.log('Activities fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (activityId: string) => {
    if (!user) return;
    setApplying(activityId);
    try {
      await apiFetch(`/volunteers/${user.id}/apply-activity`, {
        method: 'POST',
        body: JSON.stringify({ activityId, message: message[activityId] || '' }),
      });
      toast.success('✅ Application submitted! Our team will review and notify you soon. Thank you for your interest!');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Unable to submit your application. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  const filtered = activities.filter(
    (a) =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.location?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    if (status === 'ongoing') return 'bg-success/10 text-success border-success/25';
    if (status === 'published') return 'bg-primary/10 text-primary border-primary/25';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <AppLayout activePath="/activities">
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-700 text-foreground">Browse Activities</h1>
          <p className="text-[13px] sm:text-[14px] text-muted-foreground mt-1">
            Find where No Hunger Champions can jump in and help
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities or locations…"
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-card border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-card border border-border rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-[15px] font-600 text-foreground">No activities found</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              No worries, new No Hunger Initiatives opportunities are coming soon
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((activity) => {
              const app = applications[activity.id];
              const isPast = new Date(activity.end_date || activity.endDate || 0) < new Date();
              return (
                <div
                  key={activity.id}
                  className="bg-card border border-border rounded-2xl shadow-card hover:shadow-[0_4px_16px_0_rgba(22,101,52,0.12)] hover:border-[hsl(142,72%,78%)] transition-all flex flex-col"
                >
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span
                        className={`text-[11px] font-700 px-2.5 py-1 rounded-full border uppercase tracking-wide ${getStatusColor(activity.status)}`}
                      >
                        {activity.status}
                      </span>
                      {activity.activity_type && (
                        <span className="text-[11px] text-muted-foreground font-500 capitalize">
                          {(activity.activity_type || '').replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[15px] font-700 text-foreground mb-2 leading-snug">
                      {activity.title}
                    </h3>
                    {activity.description && (
                      <p className="text-[13px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                        <Calendar size={13} className="flex-shrink-0" />
                        <span>
                          {new Date(activity.start_date || activity.startDate).toLocaleDateString(
                            'en',
                            { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
                          )}
                        </span>
                      </div>
                      {activity.location && (
                        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                          <MapPin size={13} className="flex-shrink-0" />
                          <span className="truncate">{activity.location}</span>
                        </div>
                      )}
                      {activity.max_volunteers && (
                        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                          <Users size={13} className="flex-shrink-0" />
                          <span>Up to {activity.max_volunteers} No Hunger Champions</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    {app ? (
                      <div
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-600 ${
                          app.status === 'approved'
                            ? 'bg-success/10 text-success'
                            : app.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-warning/10 text-warning'
                        }`}
                      >
                        <CheckCircle2 size={14} />
                        Application {app.status}
                      </div>
                    ) : isPast ? (
                      <div className="px-4 py-2.5 bg-muted rounded-xl text-[13px] font-600 text-muted-foreground text-center">
                        Event ended
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={message[activity.id] || ''}
                          onChange={(e) =>
                            setMessage((prev) => ({ ...prev, [activity.id]: e.target.value }))
                          }
                          placeholder="Optional: Tell us why you want to join as a No Hunger Champion"
                          rows={2}
                          className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                        />
                        <button
                          onClick={() => handleApply(activity.id)}
                          disabled={applying === activity.id}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[hsl(142,72%,29%)] text-white font-700 rounded-xl hover:bg-[hsl(142,72%,22%)] hover:shadow-[0_4px_14px_0_rgba(22,101,52,0.28)] transition-all disabled:opacity-60 text-[13.5px] active:scale-[0.98]"
                        >
                          {applying === activity.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <>
                              <Send size={14} /> Join as No Hunger Champion
                            </>
                          )}
                        </button>
                      </div>
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
