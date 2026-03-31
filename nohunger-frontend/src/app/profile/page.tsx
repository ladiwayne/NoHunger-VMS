'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { updateVolunteerProfile } from '@/lib/api/volunteers';
import { getMyCheckins } from '@/lib/api/checkins';
import { UserCircle, Save, Loader2, Camera, MapPin, Phone, FileText, Wrench, Share2, Check, Award, Clock, CalendarCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';


const SKILL_OPTIONS = [
  'cooking', 'driving', 'logistics', 'teaching', 'medical', 'counseling',
  'fundraising', 'social-media', 'photography', 'translation', 'administration', 'construction',
];

type Panel = 'profile' | 'achievements';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [activePanel, setActivePanel] = useState<Panel>('profile');
  const [form, setForm] = useState({ full_name: '', phone: '', region: '', bio: '', skills: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ totalHours: 0, eventsAttended: 0 });
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        region: profile.region || '',
        bio: profile.bio || '',
        skills: profile.skills || [],
      });
    }
    if (user) fetchStats();
  }, [profile, user]);

  const fetchStats = async () => {
    const data = await getMyCheckins();
    const records = (data || []).filter((r) => r.status === 'checked_out');
    const totalHours = records.reduce((s: number, r: any) => s + (r.hours_spent || 0), 0);
    setStats({ totalHours: Math.round(totalHours * 10) / 10, eventsAttended: records.length });
    setSessions(records.slice(0, 5));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const nameParts = form.full_name.trim().split(' ');
      await updateVolunteerProfile(user.id, {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: form.phone,
        region: form.region,
        bio: form.bio,
        skills: form.skills,
      });
      await refreshProfile?.();
      toast.success('Profile saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setForm(p => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter(s => s !== skill) : [...p.skills, skill],
    }));
  };

  const handleShare = async () => {
    if (!user) return;
    const url = `${window.location.origin}/profile/${user.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Public profile link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const achievementBadges = [
    { label: 'First Event', icon: '🎉', threshold: 1, unit: 'events', value: stats.eventsAttended },
    { label: '10 Hours', icon: '⏱️', threshold: 10, unit: 'hours', value: stats.totalHours },
    { label: '5 Events', icon: '🌟', threshold: 5, unit: 'events', value: stats.eventsAttended },
    { label: '25 Hours', icon: '🏆', threshold: 25, unit: 'hours', value: stats.totalHours },
    { label: '50 Hours', icon: '💎', threshold: 50, unit: 'hours', value: stats.totalHours },
    { label: '10 Events', icon: '🎖️', threshold: 10, unit: 'events', value: stats.eventsAttended },
    { label: '100 Hours', icon: '👑', threshold: 100, unit: 'hours', value: stats.totalHours },
    { label: '20 Events', icon: '🌈', threshold: 20, unit: 'events', value: stats.eventsAttended },
  ];

  const earnedBadges = achievementBadges.filter(b => b.value >= b.threshold);

  const panels: { id: Panel; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Edit Profile', icon: UserCircle },
    { id: 'achievements', label: 'Achievements', icon: Award },
  ];

  return (
    <AppLayout activePath="/profile">
      <div className="space-y-6 animate-fade-in max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-700 text-foreground">My Profile</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">Manage your volunteer profile and view achievements</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-xl text-[13px] font-600 text-foreground hover:bg-muted transition-all"
            >
              {copied ? <Check size={14} className="text-success" /> : <Share2 size={14} />}
              {copied ? 'Copied!' : 'Share Profile'}
            </button>
            {user && (
              <Link
                href={`/profile/${user.id}`}
                target="_blank"
                className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-xl text-[13px] font-600 text-foreground hover:bg-muted transition-all"
              >
                <ExternalLink size={14} />
                View Public
              </Link>
            )}
          </div>
        </div>

        {/* Panel Tabs */}
        <div className="flex gap-2 border-b border-border">
          {panels.map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setActivePanel(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-600 border-b-2 transition-all -mb-px ${activePanel === p.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <Icon size={15} />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Edit Profile Panel */}
        {activePanel === 'profile' && (
          <div className="space-y-5">
            {/* Avatar */}
            <div className="bg-card border border-border rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <span className="text-xl font-800 text-primary">
                      {form.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'V'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Camera size={11} className="text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-[14px] font-700 text-foreground">{form.full_name || 'Your Name'}</p>
                  <p className="text-[12px] text-muted-foreground">{profile?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-600 text-primary bg-primary/8 px-2 py-0.5 rounded-full capitalize">{profile?.volunteer_status}</span>
                    <span className="text-[11px] text-muted-foreground">{stats.totalHours} hrs · {stats.eventsAttended} events</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-card border border-border rounded-2xl shadow-card p-5 space-y-4">
              <h2 className="text-[15px] font-700 text-foreground">Personal Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserCircle size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.full_name}
                      onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+234 (0) 800 000 0000"
                      className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-600 text-foreground mb-1.5">Region / Location</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={form.region}
                    onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                    placeholder="e.g. Lagos State, Nigeria"
                    className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-600 text-foreground mb-1.5">Bio</label>
                <div className="relative">
                  <FileText size={15} className="absolute left-3 top-3 text-muted-foreground" />
                  <textarea
                    value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    rows={3}
                    placeholder="Tell us about yourself and your Nohunger Champion story…"
                    className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-card border border-border rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wrench size={15} className="text-primary" />
                <h2 className="text-[15px] font-700 text-foreground">Skills</h2>
              </div>
              <p className="text-[12px] text-muted-foreground mb-3">Select all skills that apply to you</p>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map(skill => {
                  const selected = form.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-[12.5px] font-600 transition-all border ${selected ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/30'}`}
                    >
                      {skill.replace(/-/g, ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60 text-[14px]"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Achievements Panel */}
        {activePanel === 'achievements' && (
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Hours', value: stats.totalHours, unit: 'hrs', icon: Clock },
                { label: 'Events Attended', value: stats.eventsAttended, unit: 'events', icon: CalendarCheck },
                { label: 'Badges Earned', value: earnedBadges.length, unit: `/ ${achievementBadges.length}`, icon: Award },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 text-center shadow-card">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <div className="text-2xl font-800 font-tabular text-foreground">{stat.value}</div>
                    <div className="text-[11px] text-muted-foreground">{stat.unit}</div>
                    <div className="text-[10px] font-600 text-muted-foreground uppercase tracking-wide mt-0.5">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Badges */}
            <div className="bg-card border border-border rounded-2xl shadow-card p-5">
              <h2 className="text-[15px] font-700 text-foreground mb-4">Achievement Badges</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {achievementBadges.map(badge => {
                  const earned = badge.value >= badge.threshold;
                  return (
                    <div key={badge.label} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${earned ? 'bg-primary/6 border-primary/20' : 'bg-muted/50 border-border opacity-50'}`}>
                      <span className="text-3xl">{badge.icon}</span>
                      <span className="text-[12px] font-700 text-center text-foreground">{badge.label}</span>
                      <span className={`text-[10px] font-600 ${earned ? 'text-success' : 'text-muted-foreground'}`}>
                        {earned ? '✓ Earned' : `${badge.threshold} ${badge.unit} needed`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Sessions */}
            {sessions.length > 0 && (
              <div className="bg-card border border-border rounded-2xl shadow-card p-5">
                <h2 className="text-[15px] font-700 text-foreground mb-4">Recent Sessions</h2>
                <div className="space-y-3">
                  {sessions.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                        <CalendarCheck size={15} className="text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-600 text-foreground truncate">{s.activity?.title || 'Event'}</p>
                        {s.activity?.start_date && (
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(s.activity.start_date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <span className="text-[13px] font-700 text-primary font-tabular">{s.hours_spent} hrs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificate Download */}
            {stats.totalHours >= 10 && (
              <div className="bg-[hsl(142,72%,94%)] border border-[hsl(142,72%,78%)] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏅</span>
                  <div>
                    <p className="text-[14px] font-700 text-[hsl(142,72%,22%)]">Certificate of Volunteer Service</p>
                    <p className="text-[12px] text-muted-foreground">You've earned a certificate for {stats.totalHours} hours of service</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const cert = `CERTIFICATE OF VOLUNTEER SERVICE\n\nThis certifies that\n\n${profile?.full_name}\n\nhas volunteered ${stats.totalHours} hours across ${stats.eventsAttended} events\nwith the NoHunger Initiative.\n\nIssued: ${new Date().toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                    const blob = new Blob([cert], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `nohunger-certificate-${profile?.full_name?.replace(' ', '-')}.txt`;
                    a.click();
                    toast.success('Certificate downloaded!');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[13px] font-600 hover:bg-primary-dark transition-all"
                >
                  <Award size={14} /> Download Certificate
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
