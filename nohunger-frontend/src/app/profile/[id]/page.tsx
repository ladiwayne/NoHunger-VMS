'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import AppLogo from '@/components/ui/AppLogo';
import {
  MapPin,
  Clock,
  CalendarCheck,
  Share2,
  CheckCircle2,
  Loader2,
  Award,
  Copy,
  Check,
} from 'lucide-react';
import { formatHoursHHMM } from '@/lib/formatHours';
import { toast } from 'sonner';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function PublicProfilePage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalHours: 0, eventsAttended: 0, achievements: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/volunteers/public-profile/${id}`);
      const prof = data?.volunteer;
      if (!prof) {
        router.push('/not-found');
        return;
      }

      const mappedProfile = {
        id: prof._id || prof.id,
        full_name: `${prof.firstName || ''} ${prof.lastName || ''}`.trim(),
        region: prof.region || '',
        email: prof.email || '',
        avatar_url: prof.profilePicture || prof.avatar_url || prof.profile_picture || '',
        bio: prof.bio || '',
        skills: prof.skills || [],
        volunteer_status: prof.status || 'pending',
        created_at: prof.createdAt,
      };
      setProfile(mappedProfile);

      const completed = (data?.checkins || []).map((c: any) => ({
        hours_spent: c.hoursSpent,
        activities: {
          title: c.activityId?.title,
          start_date: c.activityId?.startDate,
        },
      }));
      const totalHours = completed.reduce((s: number, c: any) => s + (c.hours_spent || 0), 0);

      setStats({
        totalHours: Math.round(totalHours * 10) / 10,
        eventsAttended: completed.length,
        achievements: Math.floor(totalHours / 10),
      });
      setRecentActivity(completed);
    } catch (err) {
      console.log('Public profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Profile link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleCopyEmail = async () => {
    if (!profile?.email) {
      toast.error('No email available');
      return;
    }
    try {
      await navigator.clipboard.writeText(profile.email);
      toast.success('Email copied!');
    } catch {
      toast.error('Could not copy email');
    }
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'V';

  const formatHours = (hours: number) => formatHoursHHMM(hours);

  const achievementBadges = [
    { label: 'First Event', icon: '🎉', threshold: 1, unit: 'events', value: stats.eventsAttended },
    { label: '10 Hours', icon: '⏱️', threshold: 10, unit: 'hours', value: stats.totalHours },
    { label: '5 Events', icon: '🌟', threshold: 5, unit: 'events', value: stats.eventsAttended },
    { label: '25 Hours', icon: '🏆', threshold: 25, unit: 'hours', value: stats.totalHours },
    { label: '50 Hours', icon: '💎', threshold: 50, unit: 'hours', value: stats.totalHours },
    { label: '10 Events', icon: '🎖️', threshold: 10, unit: 'events', value: stats.eventsAttended },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href="/volunteer-dashboard" className="flex items-center gap-2.5">
          <AppLogo size={28} />
          <span className="font-display font-700 text-[15px] text-foreground">NoHunger</span>
        </Link>
        <div className="flex items-center gap-2">
          {profile.email && (
            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl text-[13px] font-600 hover:bg-border transition"
            >
              <Copy size={14} /> Copy email
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary text-white rounded-xl text-[13px] font-600 hover:bg-primary-dark transition-all"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? 'Copied!' : 'Share Profile'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span className="text-2xl font-800 text-primary">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-700 text-foreground">{profile.full_name}</h1>
                {profile.volunteer_status === 'approved' && (
                  <span className="flex items-center gap-1 text-[11px] font-700 text-success bg-success/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} /> Verified Volunteer
                  </span>
                )}
              </div>
              {profile.region && (
                <div className="flex items-center gap-1.5 mt-1 text-[13px] text-muted-foreground">
                  <MapPin size={13} />
                  <span>{profile.region}</span>
                </div>
              )}
              {profile.bio && (
                <p className="text-[13.5px] text-muted-foreground mt-2 leading-relaxed">
                  {profile.bio}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-2">
                Volunteer since{' '}
                {new Date(profile.created_at).toLocaleDateString('en', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[11px] font-700 text-muted-foreground uppercase tracking-wide mb-2">
                Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s: string) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 bg-primary/8 text-primary text-[12px] font-600 rounded-full capitalize"
                  >
                    {s.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Hours Volunteered', value: formatHours(stats.totalHours), unit: '', icon: Clock },
            {
              label: 'Events Attended',
              value: stats.eventsAttended,
              unit: 'events',
              icon: CalendarCheck,
            },
            {
              label: 'Achievements',
              value: achievementBadges.filter((b) => b.value >= b.threshold).length,
              unit: 'earned',
              icon: Award,
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-2xl p-4 text-center shadow-card"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Icon size={18} className="text-primary" />
                </div>
                <div className="text-2xl font-800 font-tabular text-foreground">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground font-500">{stat.unit}</div>
                <div className="text-[10px] font-600 text-muted-foreground uppercase tracking-wide mt-0.5">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Achievements */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5">
          <h2 className="text-[15px] font-700 text-foreground mb-4">Achievements</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {achievementBadges.map((badge) => {
              const earned = badge.value >= badge.threshold;
              return (
                <div
                  key={badge.label}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${earned ? 'bg-primary/6 border-primary/20' : 'bg-muted/50 border-border opacity-40'}`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-[10px] font-600 text-center text-foreground leading-tight">
                    {badge.label}
                  </span>
                  {earned && <span className="text-[9px] text-success font-700">Earned</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="bg-card border border-border rounded-2xl shadow-card p-5">
            <h2 className="text-[15px] font-700 text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((c: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CalendarCheck size={15} className="text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-600 text-foreground truncate">
                      {c.activities?.title || 'Event'}
                    </p>
                    {c.activities?.start_date && (
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(c.activities.start_date).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <span className="text-[13px] font-700 text-primary font-tabular">
                    {formatHours(c.hours_spent || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share CTA */}
        <div className="bg-[hsl(142,72%,94%)] border border-[hsl(142,72%,78%)] rounded-2xl p-5 text-center">
          <p className="text-[14px] font-700 text-[hsl(142,72%,22%)] mb-1">Share this profile</p>
          <p className="text-[12px] text-muted-foreground mb-3">
            Let others see {profile.full_name.split(' ')[0]}'s volunteer impact
          </p>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[13px] font-600 hover:bg-primary-dark transition-all mx-auto"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Link Copied!' : 'Copy Profile Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
