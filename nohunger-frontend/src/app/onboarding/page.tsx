'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateVolunteerProfile } from '@/lib/api/volunteers';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import {
  Heart,
  Package,
  Truck,
  ChefHat,
  ClipboardList,
  Users,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Star,
  Shield,
  Bell,
  Mail,
  Briefcase,
  AtSign,
  Link2,
  Shirt,
  MessageSquare,
  Building2,
  Calendar,
  Search,
  DollarSign,
  FileText,
  Camera,
} from 'lucide-react';
import { GENDER_OPTIONS, NIGERIA_STATES } from '@/lib/constants/nigeria';
import { COUNTRIES } from '@/lib/constants/countries';

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

const COUNTRY_STATE_MAP: Record<string, string[]> = {
  Ghana: ['Accra', 'Kumasi', 'Cape Coast', 'Takoradi', 'Tamale', 'Koforidua', 'Sunyani', 'Ho', 'Bolgatanga'],
  Nigeria: NIGERIA_STATES,
};

const SKILLS = [
  {
    id: 'food-packing',
    label: 'Food Packing',
    icon: Package,
    desc: 'Sorting and packing food items',
  },
  {
    id: 'logistics',
    label: 'Logistics',
    icon: ClipboardList,
    desc: 'Coordinating operations and transportation',
  },
  {
    id: 'community-outreach',
    label: 'Community Outreach',
    icon: Users,
    desc: 'Engaging with communities and building relationships',
  },
  {
    id: 'medical-outreach',
    label: 'Medical Outreach',
    icon: Heart,
    desc: 'Health and wellness support services',
  },
  { id: 'cooking', label: 'Cooking', icon: ChefHat, desc: 'Preparing meals for events and distribution' },
  { id: 'event-planning', label: 'Event Planning', icon: Calendar, desc: 'Organizing and coordinating events' },
  { id: 'research', label: 'Research', icon: Search, desc: 'Data collection and analysis' },
  { id: 'fundraising', label: 'Fundraising', icon: DollarSign, desc: 'Raising funds and sponsorships' },
  { id: 'social-media', label: 'Social Media', icon: MessageSquare, desc: 'Social media management and engagement' },
  { id: 'content-creation', label: 'Content Creation', icon: FileText, desc: 'Creating written and visual content' },
  { id: 'videography-photography', label: 'Videography/Photography', icon: Camera, desc: 'Video and photo production' },
  { id: 'administration', label: 'Administration', icon: Briefcase, desc: 'Administrative and organizational tasks' },
];

const AVAILABILITY = [
  { id: 'weekday-morning', label: 'Weekday Mornings' },
  { id: 'weekday-afternoon', label: 'Weekday Afternoons' },
  { id: 'weekday-evening', label: 'Weekday Evenings' },
  { id: 'weekend-morning', label: 'Weekend Mornings' },
  { id: 'weekend-afternoon', label: 'Weekend Afternoons' },
];

type Step = 'welcome' | 'profile' | 'skills' | 'review' | 'pending';

interface ProfileForm {
  email: string;
  firstName: string;
  lastName: string;
  streetAddress: string;
  addressLine2: string;
  city: string;
  country: string;
  stateProvRegion: string;
  postalZip: string;
  gender: string;
  phone: string;
  birthdayMM: string;
  birthdayDD: string;
  birthdayYYYY: string;
  occupation: string;
  alternatePhone: string;
  instagramHandle: string;
  twitterHandle: string;
  shirtSize: string;
  organization: string;
}

interface ProfileErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  city?: string;
  country?: string;
  stateProvRegion?: string;
  gender?: string;
  phone?: string;
  birthdayMM?: string;
  birthdayDD?: string;
  birthdayYYYY?: string;
  shirtSize?: string;
}

const inputBase =
  'w-full px-3 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all';
const inputOk = 'border-border focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)]';
const inputErr =
  'border-destructive/60 focus:ring-destructive/20 focus:border-destructive bg-destructive/5';
const inputWithIcon = 'pl-9';

const fieldCls = (hasErr: boolean) => `${inputBase} ${hasErr ? inputErr : inputOk}`;
const fieldIconCls = (hasErr: boolean) =>
  `${inputBase} ${inputWithIcon} ${hasErr ? inputErr : inputOk}`;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-[12px] text-destructive mt-1 flex items-center gap-1">⚠ {msg}</p> : null;

export default function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('welcome');
  const [saving, setSaving] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [errors, setErrors] = useState<ProfileErrors>({});

  const totalSteps = 4;
  const currentStepIndex = ['welcome', 'profile', 'skills', 'review'].indexOf(step) + 1;
  const progress = Math.round((currentStepIndex / totalSteps) * 100);

  const [form, setForm] = useState<ProfileForm>({
    email: '',
    firstName: '',
    lastName: '',
    streetAddress: '',
    addressLine2: '',
    city: '',
    stateProvRegion: '',
    country: '',
  postalZip: '',
    gender: '',
    phone: '',
    birthdayMM: '',
    birthdayDD: '',
    birthdayYYYY: '',
    occupation: '',
    alternatePhone: '',
    instagramHandle: '',
    twitterHandle: '',
    shirtSize: '',
    organization: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-up-login-screen');
      return;
    }
    if (!loading && profile) {
      if (profile.role === 'admin') {
        router.push('/admin/dashboard');
        return;
      }
      if (profile.onboarding_completed) {
        router.push('/volunteer-dashboard');
        return;
      }
      const nameParts = (profile.full_name || '').split(' ');
      setForm((f) => ({
        ...f,
        email: user?.email || '',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
      }));
      if (profile.skills?.length) setSelectedSkills(profile.skills);
      if (profile.availability?.length) setSelectedAvailability(profile.availability);
      if (profile.onboarding_completed) setStep('pending');
    }
  }, [user, profile, loading]);

  const setField = (key: keyof ProfileForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const getProfileErrors = (): ProfileErrors => {
    const e: ProfileErrors = {};
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Valid email address is required';
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.streetAddress.trim()) e.streetAddress = 'Street address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.country) e.country = 'Please select a country / region';
    if (!form.stateProvRegion) e.stateProvRegion = 'Please select a state / area';
    if (!form.gender) e.gender = 'Please select your gender';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.shirtSize) e.shirtSize = 'Please select a shirt size';
    // Birthday validation (if any part is filled, all must be valid)
    const anyBirthday = form.birthdayMM || form.birthdayDD || form.birthdayYYYY;
    if (anyBirthday) {
      const mm = parseInt(form.birthdayMM, 10);
      const dd = parseInt(form.birthdayDD, 10);
      const yyyy = parseInt(form.birthdayYYYY, 10);
      if (!form.birthdayMM || mm < 1 || mm > 12) e.birthdayMM = 'Invalid month (01–12)';
      if (!form.birthdayDD || dd < 1 || dd > 31) e.birthdayDD = 'Invalid day (01–31)';
      if (
        !form.birthdayYYYY ||
        form.birthdayYYYY.length !== 4 ||
        yyyy < 1900 ||
        yyyy > new Date().getFullYear()
      )
        e.birthdayYYYY = 'Invalid year';
    }
    return e;
  };

  const validateProfile = (): boolean => {
    const e = getProfileErrors();
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProfileNext = () => {
    const errorsResult = getProfileErrors();
    setErrors(errorsResult);
    if (Object.keys(errorsResult).length === 0) {
      setStep('skills');
      return;
    }

    const firstError = Object.values(errorsResult).find((message) => message);
    toast.error(firstError || 'Please fix the highlighted fields before continuing.');
  };

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    setSelectedSkills((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setCustomSkill('');
  };

  const handleSkillInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSkill();
    }
  };

  const toggleAvailability = (id: string) => {
    setSelectedAvailability((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSkillsNext = () => {
    if (selectedSkills.length === 0) {
      toast.error('Please select at least one skill area');
      return;
    }
    setStep('review');
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (selectedSkills.length === 0) {
      toast.error('Please select at least one skill area');
      return;
    }
    setSaving(true);
    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      const birthday =
        form.birthdayMM && form.birthdayDD && form.birthdayYYYY
          ? `${form.birthdayYYYY}-${form.birthdayMM.padStart(2, '0')}-${form.birthdayDD.padStart(2, '0')}`
          : null;

      const fullAddress = [form.streetAddress, form.addressLine2, form.city, form.stateProvRegion]
        .filter(Boolean)
        .join(', ');

      const regionValue = form.country
        ? `${form.country} – ${form.stateProvRegion || form.city}`
        : fullAddress || form.stateProvRegion;

      const bioText = [
        form.occupation ? `Occupation: ${form.occupation}` : '',
        form.organization ? `Organization: ${form.organization}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      await updateVolunteerProfile(user.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        gender: form.gender,
        region: regionValue,
        bio: bioText,
        skills: selectedSkills,
        availability: selectedAvailability,
        onboardingCompleted: true,
      } as any);
      await refreshProfile?.();
      toast.success('Profile completed! Redirecting to your dashboard.', { duration: 3000 });
      router.push('/volunteer-dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-[hsl(142,72%,29%)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AppLogo size={32} />
            <div>
              <p className="font-display font-700 text-sm sm:text-base text-foreground">
                No Hunger Initiatives
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:block">
                No Hunger Champion Onboarding
              </p>
            </div>
          </div>
          {step !== 'pending' && (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-1 sm:gap-1.5">
                {(['welcome', 'profile', 'skills', 'review'] as Step[]).map((s, i) => (
                  <div key={s} className="flex items-center gap-1 sm:gap-1.5">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-700 transition-colors ${
                        step === s
                          ? 'bg-[hsl(142,72%,29%)] text-white'
                          : ['welcome', 'profile', 'skills', 'review'].indexOf(step) > i
                            ? 'bg-[hsl(142,72%,90%)] text-[hsl(142,72%,22%)]'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {['welcome', 'profile', 'skills', 'review'].indexOf(step) > i ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i < 3 && (
                      <div
                        className={`w-5 sm:w-8 h-0.5 rounded-full ${['welcome', 'profile', 'skills', 'review'].indexOf(step) > i ? 'bg-[hsl(142,72%,29%)]' : 'bg-border'}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="w-full">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Step {currentStepIndex} of {totalSteps}</span>
                  <span>{progress}% complete</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden border border-border mt-2">
                  <div className="h-full bg-[hsl(142,72%,29%)] transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center p-4 sm:p-6 py-8">
        <div className="w-full max-w-3xl">
          {/* STEP: Welcome */}
          {step === 'welcome' && (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-[hsl(142,72%,92%)] flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Heart size={36} className="text-[hsl(142,72%,22%)]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-800 text-foreground mb-3">
                Welcome to No Hunger Initiatives Nigeria!
              </h1>
              <p className="text-muted-foreground text-[14px] sm:text-[15px] max-w-md mx-auto mb-8 leading-relaxed">
                Thanks for joining our mission to end hunger in Nigeria. Let&apos;s set up your
                No Hunger Champion profile so we can match you with the best opportunities.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {[
                  {
                    icon: User,
                    title: 'Complete Profile',
                    desc: 'Tell us about yourself and your location',
                  },
                  { icon: Star, title: 'Select Skills', desc: 'Choose your areas of expertise' },
                  {
                    icon: Shield,
                    title: 'Start as a No Hunger Champion',
                    desc: 'Get matched and join upcoming activities immediately',
                  },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="bg-card border border-border rounded-xl p-5 text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[hsl(142,72%,92%)] flex items-center justify-center mb-3">
                        <ItemIcon size={18} className="text-[hsl(142,72%,22%)]" />
                      </div>
                      <p className="font-700 text-foreground text-[14px] mb-1">{item.title}</p>
                      <p className="text-muted-foreground text-[12px] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep('profile')}
                className="inline-flex items-center gap-2 bg-[hsl(142,72%,29%)] hover:bg-[hsl(142,72%,24%)] text-white font-600 px-8 py-3 rounded-xl transition-colors text-[15px]"
              >
                Get Started <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* STEP: Profile */}
          {step === 'profile' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-800 text-foreground mb-1">
                  Complete your profile
                </h2>
                <p className="text-muted-foreground text-[14px]">
                  Help us know you better so we can connect you with the right activities.
                </p>
              </div>

              <div className="space-y-5">
                {/* Section: Personal Info */}
                <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
                  <h3 className="text-[13px] font-700 text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                    <User size={14} className="text-[hsl(142,72%,29%)]" /> Personal Information
                  </h3>
                  <div className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Email Address <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => setField('email', e.target.value)}
                          className={fieldIconCls(!!errors.email)}
                        />
                      </div>
                      <FieldError msg={errors.email} />
                    </div>

                    {/* First + Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          First Name <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <User
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <input
                            type="text"
                            placeholder="Jane"
                            value={form.firstName}
                            onChange={(e) => setField('firstName', e.target.value)}
                            className={fieldIconCls(!!errors.firstName)}
                          />
                        </div>
                        <FieldError msg={errors.firstName} />
                      </div>
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          Last Name <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Doe"
                          value={form.lastName}
                          onChange={(e) => setField('lastName', e.target.value)}
                          className={fieldCls(!!errors.lastName)}
                        />
                        <FieldError msg={errors.lastName} />
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Gender <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={form.gender}
                        onChange={(e) => setField('gender', e.target.value)}
                        className={fieldCls(!!errors.gender)}
                      >
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                      <FieldError msg={errors.gender} />
                    </div>

                    {/* Phone + Alternate Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          Phone Number <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <Phone
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <input
                            type="tel"
                            placeholder="+234 (0) 800 000 0000"
                            value={form.phone}
                            onChange={(e) => setField('phone', e.target.value)}
                            className={fieldIconCls(!!errors.phone)}
                          />
                        </div>
                        <FieldError msg={errors.phone} />
                      </div>
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          Alternate Phone Number
                        </label>
                        <div className="relative">
                          <Phone
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <input
                            type="tel"
                            placeholder="+234 (0) 800 000 0000"
                            value={form.alternatePhone}
                            onChange={(e) => setField('alternatePhone', e.target.value)}
                            className={fieldIconCls(false)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Birthday */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Birthday{' '}
                        <span className="text-muted-foreground font-400 text-[12px]">
                          (optional)
                        </span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <input
                            type="text"
                            placeholder="MM"
                            maxLength={2}
                            value={form.birthdayMM}
                            onChange={(e) =>
                              setField('birthdayMM', e.target.value.replace(/\D/g, ''))
                            }
                            className={`${fieldCls(!!errors.birthdayMM)} text-center`}
                          />
                          <p className="text-[11px] text-muted-foreground text-center mt-1">
                            Month
                          </p>
                          <FieldError msg={errors.birthdayMM} />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="DD"
                            maxLength={2}
                            value={form.birthdayDD}
                            onChange={(e) =>
                              setField('birthdayDD', e.target.value.replace(/\D/g, ''))
                            }
                            className={`${fieldCls(!!errors.birthdayDD)} text-center`}
                          />
                          <p className="text-[11px] text-muted-foreground text-center mt-1">Day</p>
                          <FieldError msg={errors.birthdayDD} />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="YYYY"
                            maxLength={4}
                            value={form.birthdayYYYY}
                            onChange={(e) =>
                              setField('birthdayYYYY', e.target.value.replace(/\D/g, ''))
                            }
                            className={`${fieldCls(!!errors.birthdayYYYY)} text-center`}
                          />
                          <p className="text-[11px] text-muted-foreground text-center mt-1">Year</p>
                          <FieldError msg={errors.birthdayYYYY} />
                        </div>
                      </div>
                    </div>

                    {/* Occupation + Organization */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          Occupation
                        </label>
                        <div className="relative">
                          <Briefcase
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <input
                            type="text"
                            placeholder="e.g. Teacher, Engineer"
                            value={form.occupation}
                            onChange={(e) => setField('occupation', e.target.value)}
                            className={fieldIconCls(false)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          Organization / Place of Work
                        </label>
                        <div className="relative">
                          <Building2
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <input
                            type="text"
                            placeholder="Company or school name"
                            value={form.organization}
                            onChange={(e) => setField('organization', e.target.value)}
                            className={fieldIconCls(false)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shirt Size */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Shirt Size <span className="text-destructive">*</span>
                      </label>
                      <div className={`flex flex-wrap gap-2 p-2 rounded-2xl ${errors.shirtSize ? 'border border-destructive/40 bg-destructive/10' : ''}`}>
                        {SHIRT_SIZES.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setField('shirtSize', size)}
                            className={`px-4 py-2 rounded-xl border text-[13px] font-600 transition-all ${
                              form.shirtSize === size
                                ? 'bg-[hsl(142,72%,29%)] text-white border-[hsl(142,72%,29%)]'
                                : 'bg-muted border-border text-foreground hover:border-[hsl(142,72%,60%)]'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      <FieldError msg={errors.shirtSize} />
                    </div>

                    {/* Social */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          Instagram Handle
                        </label>
                        <div className="relative">
                          <AtSign
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <input
                            type="text"
                            placeholder="@username"
                            value={form.instagramHandle}
                            onChange={(e) => setField('instagramHandle', e.target.value)}
                            className={fieldIconCls(false)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          Twitter Handle
                        </label>
                        <div className="relative">
                          <Link2
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <input
                            type="text"
                            placeholder="@username"
                            value={form.twitterHandle}
                            onChange={(e) => setField('twitterHandle', e.target.value)}
                            className={fieldIconCls(false)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Address */}
                <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
                  <h3 className="text-[13px] font-700 text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                    <MapPin size={14} className="text-[hsl(142,72%,29%)]" /> Address
                  </h3>
                  <div className="space-y-4">
                    {/* Street Address */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Street Address <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="123 Main Street"
                        value={form.streetAddress}
                        onChange={(e) => setField('streetAddress', e.target.value)}
                        className={fieldCls(!!errors.streetAddress)}
                      />
                      <FieldError msg={errors.streetAddress} />
                    </div>

                    {/* Address Line 2 */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        placeholder="Apt, Suite, Unit (optional)"
                        value={form.addressLine2}
                        onChange={(e) => setField('addressLine2', e.target.value)}
                        className={fieldCls(false)}
                      />
                    </div>

                    {/* City + State */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[13px] font-600 text-foreground mb-1.5">
                            Country / Region <span className="text-destructive">*</span>
                          </label>
                          <select
                            value={form.country}
                            onChange={(e) => {
                              setField('country', e.target.value);
                              if (e.target.value) {
                                setField('stateProvRegion', '');
                              }
                            }}
                            className={fieldCls(!!errors.country)}
                          >
                            <option value="">Select country</option>
                            {COUNTRIES.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                          <FieldError msg={errors.country} />
                        </div>
                        <div>
                          <label className="block text-[13px] font-600 text-foreground mb-1.5">
                            State / Area <span className="text-destructive">*</span>
                          </label>
                          {COUNTRY_STATE_MAP[form.country]?.length ? (
                            <select
                              value={form.stateProvRegion}
                              onChange={(e) => setField('stateProvRegion', e.target.value)}
                              className={fieldCls(!!errors.stateProvRegion)}
                            >
                              <option value="">Select state / area</option>
                              {COUNTRY_STATE_MAP[form.country].map((state) => (
                                <option key={state} value={state}>
                                  {state}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Enter state / region"
                              value={form.stateProvRegion}
                              onChange={(e) => setField('stateProvRegion', e.target.value)}
                              className={fieldCls(!!errors.stateProvRegion)}
                            />
                          )}
                          <FieldError msg={errors.stateProvRegion} />
                        </div>
                      </div>
                    {/* Postal */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Postal / Zip Code
                      </label>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={form.postalZip}
                        onChange={(e) => setField('postalZip', e.target.value)}
                        className={fieldCls(false)}
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setStep('welcome')}
                  className="flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleProfileNext}
                  className="flex items-center gap-2 bg-[hsl(142,72%,29%)] hover:bg-[hsl(142,72%,24%)] text-white font-600 px-6 py-2.5 rounded-xl transition-colors text-[14px]"
                >
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP: Skills */}
          {step === 'skills' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-xl sm:text-2xl font-800 text-foreground mb-1">
                  Your skills & availability
                </h2>
                <p className="text-muted-foreground text-[14px]">
                  Select the areas where you can contribute most. You can update these later.
                </p>
              </div>

              {/* Skills */}
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 mb-4">
                <p className="text-[13px] font-700 text-foreground mb-3">
                  Skill Areas <span className="text-destructive">*</span>
                </p>
                <p className="text-[12px] text-muted-foreground mb-4">
                  Type the skills you have and press Enter, or choose from the suggestions below.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyDown={handleSkillInputKey}
                        placeholder="e.g. Curriculum design, Community organising"
                        className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={addCustomSkill}
                        className="px-4 py-2 text-[13px] font-600 text-white bg-[hsl(142,72%,29%)] rounded-xl hover:bg-[hsl(142,72%,22%)] transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {selectedSkills.filter((skill) => !SKILLS.some((s) => s.id === skill)).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSkills
                          .filter((skill) => !SKILLS.some((s) => s.id === skill))
                          .map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => setSelectedSkills((prev) => prev.filter((s) => s !== skill))}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(142,72%,92%)] text-[13px] font-600 text-[hsl(142,72%,20%)] border border-[hsl(142,72%,65%)]"
                            >
                              {skill}
                              ×
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SKILLS.map((skill) => {
                    const SkillIcon = skill.icon;
                    const selected = selectedSkills.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        onClick={() => toggleSkill(skill.id)}
                        className={`flex flex-col items-start p-3 sm:p-3.5 rounded-xl border-2 transition-all text-left ${
                          selected
                            ? 'border-[hsl(142,72%,29%)] bg-[hsl(142,72%,96%)]'
                            : 'border-border bg-muted hover:border-[hsl(142,72%,60%)]'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${selected ? 'bg-[hsl(142,72%,29%)]' : 'bg-border'}`}
                        >
                          <SkillIcon
                            size={15}
                            className={selected ? 'text-white' : 'text-muted-foreground'}
                          />
                        </div>
                        <p
                          className={`text-[12px] font-700 ${selected ? 'text-[hsl(142,72%,22%)]' : 'text-foreground'}`}
                        >
                          {skill.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight hidden sm:block">
                          {skill.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability */}
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 mb-6">
                <p className="text-[13px] font-700 text-foreground mb-3">
                  Availability <span className="text-muted-foreground font-400">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY.map((slot) => {
                    const selected = selectedAvailability.includes(slot.id);
                    return (
                      <button
                        key={slot.id}
                        onClick={() => toggleAvailability(slot.id)}
                        className={`px-3.5 py-1.5 rounded-full text-[12px] font-600 border transition-all ${
                          selected
                            ? 'bg-[hsl(142,72%,29%)] text-white border-[hsl(142,72%,29%)]'
                            : 'bg-muted text-muted-foreground border-border hover:border-[hsl(142,72%,60%)]'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('profile')}
                  className="flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSkillsNext}
                  disabled={selectedSkills.length === 0}
                  className="flex items-center gap-2 bg-[hsl(142,72%,29%)] hover:bg-[hsl(142,72%,24%)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-600 px-6 py-2.5 rounded-xl transition-colors text-[14px]"
                >
                  Review Profile <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP: Review Summary */}
          {step === 'review' && (
            <div className="animate-fade-in max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-800 text-foreground mb-2">Review Your Profile</h2>
                <p className="text-muted-foreground text-[14px] sm:text-[15px]">
                  Please review your information before submitting. You can edit it anytime in your profile later.
                </p>
              </div>

              {/* Personal Info Summary */}
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-4 space-y-4">
                <h3 className="text-[14px] font-700 text-foreground uppercase tracking-wide">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[12px] text-muted-foreground uppercase tracking-wide">Name</p>
                    <p className="text-[15px] font-600 text-foreground">{form.firstName} {form.lastName}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground uppercase tracking-wide">Phone</p>
                    <p className="text-[15px] font-600 text-foreground">{form.phone}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground uppercase tracking-wide">Gender</p>
                    <p className="text-[15px] font-600 text-foreground capitalize">{form.gender || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground uppercase tracking-wide">Shirt Size</p>
                    <p className="text-[15px] font-600 text-foreground">{form.shirtSize}</p>
                  </div>
                </div>
              </div>

              {/* Location Summary */}
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-4 space-y-4">
                <h3 className="text-[14px] font-700 text-foreground uppercase tracking-wide">Location</h3>
                <div className="space-y-3">
                  {form.country && (
                    <div>
                      <p className="text-[12px] text-muted-foreground uppercase tracking-wide">Country / Region</p>
                      <p className="text-[15px] font-600 text-foreground">{form.country}</p>
                    </div>
                  )}
                  {form.stateProvRegion && (
                    <div>
                      <p className="text-[12px] text-muted-foreground uppercase tracking-wide">State / Area</p>
                      <p className="text-[15px] font-600 text-foreground">{form.stateProvRegion}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[12px] text-muted-foreground uppercase tracking-wide">Address</p>
                    <p className="text-[15px] font-600 text-foreground">{form.streetAddress}, {form.city}</p>
                  </div>
                </div>
              </div>

              {/* Skills Summary */}
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-4 space-y-4">
                <h3 className="text-[14px] font-700 text-foreground uppercase tracking-wide">Volunteer Focus Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <span key={skill} className="px-3 py-1.5 rounded-full bg-[hsl(142,72%,92%)] text-[13px] font-600 text-[hsl(142,72%,22%)]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Availability Summary */}
              {selectedAvailability.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-4 space-y-4">
                  <h3 className="text-[14px] font-700 text-foreground uppercase tracking-wide">Availability</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAvailability.map((slot) => {
                      const label = AVAILABILITY.find((a) => a.id === slot)?.label;
                      return (
                        <span key={slot} className="px-3 py-1.5 rounded-full bg-muted text-[13px] font-600 text-foreground">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setStep('skills')}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-[14px] font-600 text-muted-foreground hover:text-foreground transition-colors px-4 py-2.5"
                >
                  <ArrowLeft size={15} /> Back to Skills
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[hsl(142,72%,29%)] hover:bg-[hsl(142,72%,24%)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-600 px-6 py-2.5 rounded-xl transition-colors text-[14px]"
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      Complete Profile <CheckCircle2 size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP: Pending Approval */}
          {step === 'pending' && (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
                <Clock size={36} className="text-amber-600" />
              </div>
              <h2 className="text-2xl font-800 text-foreground mb-3">Awaiting Approval</h2>
              <p className="text-muted-foreground text-[15px] max-w-md mx-auto mb-8 leading-relaxed">
                Your Champion profile has been submitted and is under review by our admin team.
                You&apos;ll get an email as soon as you&apos;re approved.
              </p>

              <div className="bg-card border border-border rounded-2xl p-6 max-w-md mx-auto mb-8 text-left space-y-4">
                <p className="text-[13px] font-700 text-foreground">What happens next?</p>
                {[
                  {
                    icon: CheckCircle2,
                    color: 'text-[hsl(142,72%,29%)]',
                    bg: 'bg-[hsl(142,72%,92%)]',
                    title: 'Profile Review',
                    desc: 'Our team reviews your skills and location',
                  },
                  {
                    icon: Bell,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    title: 'Email Notification',
                    desc: "You'll get an email when approved",
                  },
                  {
                    icon: Heart,
                    color: 'text-rose-600',
                    bg: 'bg-rose-50',
                    title: 'Start Your Champion Journey',
                    desc: 'Access activities and events across Nigeria',
                  },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                      >
                        <ItemIcon size={15} className={item.color} />
                      </div>
                      <div>
                        <p className="text-[13px] font-700 text-foreground">{item.title}</p>
                        <p className="text-[12px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[13px] text-muted-foreground">
                Questions? Contact us at{' '}
                <a
                  href="mailto:champions@nohungerfoodbank.org"
                  className="text-[hsl(142,72%,29%)] font-600 hover:underline"
                >
                  champions@nohungerfoodbank.org
                </a>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
