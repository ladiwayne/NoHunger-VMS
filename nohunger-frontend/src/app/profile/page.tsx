'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { updateVolunteerProfile } from '@/lib/api/volunteers';
import { getMyCheckins } from '@/lib/api/checkins';
import {
  UserCircle,
  Save,
  Loader2,
  Camera,
  MapPin,
  Phone,
  FileText,
  Wrench,
  Share2,
  Check,
  Award,
  Clock,
  CalendarCheck,
  ExternalLink,
  Heart,
  Shirt,
  Calendar,
  AtSign,
  Link2,
  Building2,
  MessageSquare,
  Briefcase,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { GENDER_OPTIONS, NIGERIA_STATES } from '@/lib/constants/nigeria';

const SKILL_OPTIONS = [
  'cooking',
  'driving',
  'logistics',
  'teaching',
  'medical',
  'counseling',
  'fundraising',
  'social-media',
  'photography',
  'translation',
  'administration',
  'construction',
];

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

type Panel = 'profile' | 'achievements' | 'security';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [activePanel, setActivePanel] = useState<Panel>('profile');
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    alternatePhone: '',
    region: '',
    streetAddress: '',
    addressLine2: '',
    city: '',
    stateProvRegion: '',
    postalZip: '',
    gender: '',
    birthdayMM: '',
    birthdayDD: '',
    birthdayYYYY: '',
    occupation: '',
    organization: '',
    instagramHandle: '',
    twitterHandle: '',
    shirtSize: '',
    whyVolunteer: '',
    bio: '',
    skills: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ totalHours: 0, eventsAttended: 0 });
  const [sessions, setSessions] = useState<any[]>([]);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (profile) {
      // Parse birthday if available
      const birthday = profile.birthday ? new Date(profile.birthday) : null;
      
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        alternatePhone: profile.alternate_phone || '',
        region: profile.region || '',
        streetAddress: profile.street_address || '',
        addressLine2: profile.address_line2 || '',
        city: profile.city || '',
        stateProvRegion: profile.state_prov_region || '',
        postalZip: profile.postal_zip || '',
        gender: profile.gender || '',
        birthdayMM: birthday ? (birthday.getMonth() + 1).toString().padStart(2, '0') : '',
        birthdayDD: birthday ? birthday.getDate().toString().padStart(2, '0') : '',
        birthdayYYYY: birthday ? birthday.getFullYear().toString() : '',
        occupation: profile.occupation || '',
        organization: profile.organization || '',
        instagramHandle: profile.instagram_handle || '',
        twitterHandle: profile.twitter_handle || '',
        shirtSize: profile.shirt_size || '',
        whyVolunteer: profile.why_volunteer || '',
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
      
      // Construct birthday
      const birthday = form.birthdayMM && form.birthdayDD && form.birthdayYYYY
        ? `${form.birthdayYYYY}-${form.birthdayMM.padStart(2, '0')}-${form.birthdayDD.padStart(2, '0')}`
        : null;

      // Construct full address
      const fullAddress = [form.streetAddress, form.addressLine2, form.city, form.stateProvRegion]
        .filter(Boolean)
        .join(', ');

      // Construct bio from why volunteer and other info
      const bioText = [
        form.whyVolunteer,
        form.occupation ? `Occupation: ${form.occupation}` : '',
        form.organization ? `Organization: ${form.organization}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      await updateVolunteerProfile(user.id, {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: form.phone,
        alternatePhone: form.alternatePhone,
        region: fullAddress || form.region,
        streetAddress: form.streetAddress,
        addressLine2: form.addressLine2,
        city: form.city,
        stateProvRegion: form.stateProvRegion,
        postalZip: form.postalZip,
        gender: form.gender,
        birthday,
        occupation: form.occupation,
        organization: form.organization,
        instagramHandle: form.instagramHandle,
        twitterHandle: form.twitterHandle,
        shirtSize: form.shirtSize,
        whyVolunteer: form.whyVolunteer,
        bio: bioText || form.bio,
        skills: form.skills,
        onboardingCompleted: true, // Mark as completed when saving from profile page
      } as any);
      await refreshProfile?.();
      toast.success('Profile saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setForm((p) => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter((s) => s !== skill) : [...p.skills, skill],
    }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
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

  const earnedBadges = achievementBadges.filter((b) => b.value >= b.threshold);

  const panels: { id: Panel; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Edit Profile', icon: UserCircle },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'achievements', label: 'Achievements', icon: Award },
  ];

  return (
    <AppLayout activePath="/profile">
      <div className="space-y-6 animate-fade-in max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-700 text-foreground">My Profile</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Manage your volunteer profile and view achievements
            </p>
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
          {panels.map((p) => {
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
                      {form.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'V'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Camera size={11} className="text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-[14px] font-700 text-foreground">
                    {form.full_name || 'Your Name'}
                  </p>
                  <p className="text-[12px] text-muted-foreground">{profile?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-600 text-primary bg-primary/8 px-2 py-0.5 rounded-full capitalize">
                      {profile?.volunteer_status}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {stats.totalHours} hrs · {stats.eventsAttended} events
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-card border border-border rounded-2xl shadow-card p-4 sm:p-5 space-y-4">
              <h2 className="text-[15px] font-700 text-foreground">Personal Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserCircle
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      value={form.full_name}
                      onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+234 (0) 800 000 0000"
                      className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-600 text-foreground mb-1.5">
                  Region / Location
                </label>
                <div className="relative">
                  <MapPin
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    value={form.region}
                    onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
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
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    rows={3}
                    placeholder="Tell us about yourself and your Nohunger Champion story…"
                    className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Additional Profile Information */}
            <div className="bg-card border border-border rounded-2xl shadow-card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Heart size={16} className="text-primary mt-0.5" />
                <div>
                  <h2 className="text-[15px] font-700 text-foreground">Complete Your Profile</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Help us get to know you better! These details are optional but help us match you with the perfect volunteering opportunities and create a more personalized experience.
                  </p>
                </div>
              </div>

              {/* Birthday */}
              <div>
                <label className="block text-[13px] font-600 text-foreground mb-1.5">
                  Birthday <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      value={form.birthdayMM}
                      onChange={(e) => setForm((p) => ({ ...p, birthdayMM: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                      placeholder="MM"
                      className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-center"
                    />
                  </div>
                  <div>
                    <input
                      value={form.birthdayDD}
                      onChange={(e) => setForm((p) => ({ ...p, birthdayDD: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                      placeholder="DD"
                      className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-center"
                    />
                  </div>
                  <div>
                    <input
                      value={form.birthdayYYYY}
                      onChange={(e) => setForm((p) => ({ ...p, birthdayYYYY: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      placeholder="YYYY"
                      className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Gender and Shirt Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Gender <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Shirt Size <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Shirt size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={form.shirtSize}
                      onChange={(e) => setForm((p) => ({ ...p, shirtSize: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="">Select size</option>
                      {SHIRT_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[13px] font-600 text-foreground mb-1.5">
                  Address <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <div className="space-y-2">
                  <input
                    value={form.streetAddress}
                    onChange={(e) => setForm((p) => ({ ...p, streetAddress: e.target.value }))}
                    placeholder="Street address"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <input
                    value={form.addressLine2}
                    onChange={(e) => setForm((p) => ({ ...p, addressLine2: e.target.value }))}
                    placeholder="Address line 2 (optional)"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="City"
                      className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <select
                      value={form.stateProvRegion}
                      onChange={(e) => setForm((p) => ({ ...p, stateProvRegion: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="">State/Province</option>
                      {NIGERIA_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <input
                      value={form.postalZip}
                      onChange={(e) => setForm((p) => ({ ...p, postalZip: e.target.value }))}
                      placeholder="Postal/Zip"
                      className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Alternate Phone <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.alternatePhone}
                      onChange={(e) => setForm((p) => ({ ...p, alternatePhone: e.target.value }))}
                      placeholder="+234 (0) 800 000 0000"
                      className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Occupation <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.occupation}
                      onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
                      placeholder="Your profession"
                      className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-[13px] font-600 text-foreground mb-1.5">
                  Organization <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={form.organization}
                    onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))}
                    placeholder="School, company, or organization you represent"
                    className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Social Media */}
              <div>
                <label className="block text-[13px] font-600 text-foreground mb-1.5">
                  Social Media <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative">
                    <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.instagramHandle}
                      onChange={(e) => setForm((p) => ({ ...p, instagramHandle: e.target.value }))}
                      placeholder="@yourinstagram or full URL"
                      className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.twitterHandle}
                      onChange={(e) => setForm((p) => ({ ...p, twitterHandle: e.target.value }))}
                      placeholder="@yourtwitter or full URL"
                      className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Why Volunteer */}
              <div>
                <label className="block text-[13px] font-600 text-foreground mb-1.5">
                  Why do you want to volunteer? <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare size={15} className="absolute left-3 top-3 text-muted-foreground" />
                  <textarea
                    value={form.whyVolunteer}
                    onChange={(e) => setForm((p) => ({ ...p, whyVolunteer: e.target.value }))}
                    rows={3}
                    placeholder="Share your motivation for volunteering with No Hunger Initiatives Nigeria..."
                    className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
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
              <p className="text-[12px] text-muted-foreground mb-3">
                Select all skills that apply to you
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => {
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

        {/* Security Panel */}
        {activePanel === 'security' && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-primary" />
                <h2 className="text-[15px] font-700 text-foreground">Change Password</h2>
              </div>
              <p className="text-[12px] text-muted-foreground mb-4">
                Update your password to keep your account secure.
              </p>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Enter a new password"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-600 text-foreground mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Confirm your new password"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-700 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60 text-[14px]"
                  >
                    {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {changingPassword ? 'Changing…' : 'Change Password'}
                  </button>
                </div>
              </form>
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
                {
                  label: 'Events Attended',
                  value: stats.eventsAttended,
                  unit: 'events',
                  icon: CalendarCheck,
                },
                {
                  label: 'Badges Earned',
                  value: earnedBadges.length,
                  unit: `/ ${achievementBadges.length}`,
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
                    <div className="text-2xl font-800 font-tabular text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{stat.unit}</div>
                    <div className="text-[10px] font-600 text-muted-foreground uppercase tracking-wide mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Badges */}
            <div className="bg-card border border-border rounded-2xl shadow-card p-5">
              <h2 className="text-[15px] font-700 text-foreground mb-4">Achievement Badges</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {achievementBadges.map((badge) => {
                  const earned = badge.value >= badge.threshold;
                  return (
                    <div
                      key={badge.label}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${earned ? 'bg-primary/6 border-primary/20' : 'bg-muted/50 border-border opacity-50'}`}
                    >
                      <span className="text-3xl">{badge.icon}</span>
                      <span className="text-[12px] font-700 text-center text-foreground">
                        {badge.label}
                      </span>
                      <span
                        className={`text-[10px] font-600 ${earned ? 'text-success' : 'text-muted-foreground'}`}
                      >
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
                    <div
                      key={i}
                      className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                    >
                      <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                        <CalendarCheck size={15} className="text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-600 text-foreground truncate">
                          {s.activity?.title || 'Event'}
                        </p>
                        {s.activity?.start_date && (
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(s.activity.start_date).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      <span className="text-[13px] font-700 text-primary font-tabular">
                        {s.hours_spent} hrs
                      </span>
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
                    <p className="text-[14px] font-700 text-[hsl(142,72%,22%)]">
                      Certificate of Volunteer Service
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      You've earned a certificate for {stats.totalHours} hours of service
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const cert = `CERTIFICATE OF VOLUNTEER SERVICE\n\nThis certifies that\n\n${profile?.full_name}\n\nhas volunteered ${stats.totalHours} hours across ${stats.eventsAttended} events\nwith the No Hunger Initiatives.\n\nIssued: ${new Date().toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}`;
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
