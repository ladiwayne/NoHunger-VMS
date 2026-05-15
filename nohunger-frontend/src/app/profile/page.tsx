'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { updateVolunteerProfile } from '@/lib/api/volunteers';
import { COUNTRIES } from '@/lib/constants/countries';
import { NIGERIA_STATES } from '@/lib/constants/nigeria';
import {
  UserCircle,
  Save,
  Loader2,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Shield,
  Info,
  Sparkles,
  Building2,
  Plus,
  X,
} from 'lucide-react';

const SKILLS = [
  'Food Packing',
  'Logistics',
  'Community Outreach',
  'Medical Outreach',
  'Cooking',
  'Event Planning',
  'Research',
  'Fundraising',
  'Social Media',
  'Content Creation',
  'Videography/Photography',
  'Administration',
];

const AVAILABILITY_OPTIONS = ['Weekdays', 'Weekends', 'Anyday'];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

const CANADA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
];

const AUSTRALIA_STATES = [
  'New South Wales', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
  'Northern Territory', 'Australian Capital Territory',
];

const UK_REGIONS = ['England', 'Scotland', 'Wales', 'Northern Ireland'];

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Eastern', 'Western', 'Northern', 'Volta', 'Central',
  'Upper East', 'Upper West', 'Bono', 'Ahafo', 'Oti', 'North East', 'Savannah', 'Bono East',
];

const COUNTRY_STATE_MAP: Record<string, string[]> = {
  Nigeria: NIGERIA_STATES as unknown as string[],
  'United States': US_STATES,
  Canada: CANADA_PROVINCES,
  Australia: AUSTRALIA_STATES,
  'United Kingdom': UK_REGIONS,
  India: INDIA_STATES,
  Ghana: GHANA_REGIONS,
};

const fieldClass =
  'w-full rounded-2xl border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const chipClass =
  'inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-sm text-foreground';

export default function ProfilePage() {
  const { profile, loading, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    alternatePhone: '',
    gender: '',
    birthday: '',
    occupation: '',
    organization: '',
    instagramHandle: '',
    twitterHandle: '',
    country: '',
    region: '',
    city: '',
    streetAddress: '',
    addressLine2: '',
    postalZip: '',
    shirtSize: '',
    whyVolunteer: '',
    bio: '',
  });
  const normalizeDateValue = (d?: string) => {
    if (!d) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    if (typeof d === 'string' && d.includes('T')) return d.split('T')[0];
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    return '';
  };

  useEffect(() => {
    if (!profile) return;
    setForm({
      fullName: profile.full_name || '',
      phone: profile.phone || '',
      alternatePhone: profile.alternate_phone || '',
      gender: profile.gender || '',
      birthday: normalizeDateValue(profile.birthday || ''),
      occupation: profile.occupation || '',
      organization: profile.organization || '',
      instagramHandle: profile.instagram_handle || '',
      twitterHandle: profile.twitter_handle || '',
      country: profile.country || '',
      region: profile.region || '',
      city: profile.city || '',
      streetAddress: profile.street_address || '',
      addressLine2: profile.address_line2 || '',
      postalZip: profile.postal_zip || '',
      shirtSize: profile.shirt_size || '',
      whyVolunteer: profile.why_volunteer || '',
      bio: profile.bio || '',
    });
    setSelectedSkills(profile.skills || []);
    setSelectedAvailability(profile.availability || []);
  }, [profile]);

  const regionOptions = useMemo(() => COUNTRY_STATE_MAP[form.country] || [], [form.country]);

  const filteredSkills = useMemo(() => {
    const q = skillSearch.trim().toLowerCase();
    if (!q) return SKILLS;
    return SKILLS.filter((s) => s.toLowerCase().includes(q));
  }, [skillSearch]);

  const missingFields = useMemo(() => {
    return [
      { label: 'Full name', value: form.fullName },
      { label: 'Phone', value: form.phone },
      { label: 'Gender', value: form.gender },
      { label: 'Country', value: form.country },
      { label: 'Region / State', value: form.region },
      { label: 'City', value: form.city },
      { label: 'Street address', value: form.streetAddress },
      { label: 'Postal / Zip', value: form.postalZip },
      { label: 'Skills', value: selectedSkills.length ? selectedSkills.join(', ') : '' },
      { label: 'Shirt size', value: form.shirtSize },
    ]
      .filter((item) => !item.value || !String(item.value).trim())
      .map((item) => item.label);
  }, [form, selectedSkills]);

  const isComplete = missingFields.length === 0;

  const setField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]
    );
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills((current) => current.filter((item) => item !== skill));
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed || selectedSkills.includes(trimmed)) return;
    setSelectedSkills((current) => [...current, trimmed]);
    setCustomSkill('');
  };

  const validateForm = () => {
    const next: Record<string, string> = {};
    // required fields
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.phone.trim()) next.phone = 'Phone is required';
    else if (!/^\+?[0-9 \-()]{7,20}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number';
    if (form.birthday) {
      const dt = new Date(form.birthday);
      if (!isNaN(dt.getTime())) {
        const today = new Date();
        if (dt > today) next.birthday = 'Birthday cannot be in the future';
      } else {
        next.birthday = 'Enter a valid date';
      }
    }
    if (!form.gender) next.gender = 'Please select your gender';
    if (!form.country) next.country = 'Country is required';
    if (!form.region) next.region = 'Region / State is required';
    if (!form.city) next.city = 'City is required';
    if (!form.streetAddress) next.streetAddress = 'Street address is required';
    if (!form.postalZip) next.postalZip = 'Postal / Zip is required';
    if (!form.shirtSize) next.shirtSize = 'Please select a shirt size';
    if (selectedSkills.length === 0) next.skills = 'Add at least one skill';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const toggleAvailability = (option: string) => {
    setSelectedAvailability((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [option]
    );
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    setSuccessMessage('');
    setErrors({});
    const ok = validateForm();
    if (!ok) {
      setSaving(false);
      return;
    }
    try {
      const [firstName, ...rest] = form.fullName.trim().split(' ');
      const lastName = rest.join(' ');

      await updateVolunteerProfile(profile.id, {
        firstName: firstName || '',
        lastName,
        phone: form.phone,
        alternatePhone: form.alternatePhone,
        gender: form.gender,
        birthday: form.birthday,
        occupation: form.occupation,
        organization: form.organization,
        instagramHandle: form.instagramHandle,
        twitterHandle: form.twitterHandle,
        country: form.country,
        region: form.region,
        city: form.city,
        streetAddress: form.streetAddress,
        addressLine2: form.addressLine2,
        postalZip: form.postalZip,
        shirtSize: form.shirtSize,
        whyVolunteer: form.whyVolunteer,
        bio: form.bio,
        skills: selectedSkills,
        availability: selectedAvailability,
        onboardingCompleted: isComplete,
      });
      await refreshProfile();
        toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to save profile', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <Shield size={36} className="text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold text-foreground">Profile unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No volunteer profile is loaded. Please sign in again or refresh the page.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {successMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{successMessage}</div>
        )}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-center gap-3">
                <UserCircle size={24} className="text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Champion Profile</h1>
                  <p className="text-sm text-muted-foreground">
                    Edit your volunteer details and complete onboarding information.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                  <CheckCircle2 size={16} /> {isComplete ? 'Complete' : 'Incomplete'}
                </span>
                {!isComplete && <p className="text-sm text-muted-foreground">Required volunteer fields are still missing.</p>}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Personal Details</h2>
                    <p className="text-sm text-muted-foreground">Editable personal and volunteer profile information.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Full name</span>
                    <input
                      type="text"
                      className={fieldClass}
                      value={form.fullName}
                      onChange={(e) => setField('fullName', e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</span>
                    <input type="email" className={`${fieldClass} cursor-not-allowed bg-slate-100`} value={profile.email || ''} readOnly />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Phone</span>
                    <input
                      type="tel"
                      className={fieldClass}
                      value={form.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                      placeholder="+234 800 000 0000"
                    />
                    {errors.phone && <p className="text-xs text-rose-600">{errors.phone}</p>}
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Alternate phone</span>
                    <input
                      type="tel"
                      className={fieldClass}
                      value={form.alternatePhone}
                      onChange={(e) => setField('alternatePhone', e.target.value)}
                      placeholder="Optional"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Gender</span>
                    <select
                      value={form.gender}
                      onChange={(e) => setField('gender', e.target.value)}
                      className={fieldClass}
                    >
                      <option value="">Select gender</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                    {errors.gender && <p className="text-xs text-rose-600">{errors.gender}</p>}
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Birthday</span>
                    <input
                      type="date"
                      className={fieldClass}
                      value={form.birthday}
                      onChange={(e) => setField('birthday', e.target.value)}
                    />
                    {errors.birthday && <p className="text-xs text-rose-600">{errors.birthday}</p>}
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Occupation</span>
                    <input
                      type="text"
                      className={fieldClass}
                      value={form.occupation}
                      onChange={(e) => setField('occupation', e.target.value)}
                      placeholder="Occupation"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Organization</span>
                    <input
                      type="text"
                      className={fieldClass}
                      value={form.organization}
                      onChange={(e) => setField('organization', e.target.value)}
                      placeholder="Organization"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Location</h2>
                    <p className="text-sm text-muted-foreground">Your address and region for local volunteer matching.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Country</span>
                    <select
                      value={form.country}
                      onChange={(e) => {
                        setField('country', e.target.value);
                        setField('region', '');
                      }}
                      className={fieldClass}
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className="text-xs text-rose-600">{errors.country}</p>}
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Region / State</span>
                    {regionOptions.length > 0 ? (
                      <select
                        value={form.region}
                        onChange={(e) => setField('region', e.target.value)}
                        className={fieldClass}
                      >
                        <option value="">Select region / state</option>
                        {regionOptions.map((regionOption) => (
                          <option key={regionOption} value={regionOption}>
                            {regionOption}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className={fieldClass}
                        value={form.region}
                        onChange={(e) => setField('region', e.target.value)}
                        placeholder="Region / province / state"
                      />
                    )}
                    {errors.region && <p className="text-xs text-rose-600">{errors.region}</p>}
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">City</span>
                    <input
                      type="text"
                      className={fieldClass}
                      value={form.city}
                      onChange={(e) => setField('city', e.target.value)}
                      placeholder="Ikeja"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Postal / Zip</span>
                    <input
                      type="text"
                      className={fieldClass}
                      value={form.postalZip}
                      onChange={(e) => setField('postalZip', e.target.value)}
                      placeholder="Postal code"
                    />
                    {errors.postalZip && <p className="text-xs text-rose-600">{errors.postalZip}</p>}
                  </label>
                  <label className="space-y-2 lg:col-span-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Street address</span>
                    <input
                      type="text"
                      className={fieldClass}
                      value={form.streetAddress}
                      onChange={(e) => setField('streetAddress', e.target.value)}
                      placeholder="123 Main St"
                    />
                    {errors.streetAddress && <p className="text-xs text-rose-600">{errors.streetAddress}</p>}
                  </label>
                  <label className="space-y-2 lg:col-span-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Address line 2</span>
                    <input
                      type="text"
                      className={fieldClass}
                      value={form.addressLine2}
                      onChange={(e) => setField('addressLine2', e.target.value)}
                      placeholder="Suite, apartment, etc."
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Volunteer Details</h2>
                    <p className="text-sm text-muted-foreground">Skills, availability, and volunteer preference data.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Skills</span>
                      <span className="text-xs text-muted-foreground">Tap a skill or add your own</span>
                    </div>
                    <div className="mt-3">
                      <input
                        type="text"
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        placeholder="Search skills"
                        className={`${fieldClass} mb-2`}
                      />
                      <div className="flex flex-wrap gap-2">
                        {filteredSkills.map((skill) => {
                          const active = selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkill(skill)}
                              className={`rounded-full border px-3 py-1 text-sm transition ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted text-foreground'}`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedSkills.map((skill) => (
                        <span key={skill} className={chipClass}>
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    {errors.skills && <p className="text-xs text-rose-600 mt-2">{errors.skills}</p>}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        className={fieldClass}
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        placeholder="Add a custom skill"
                      />
                      <button
                        type="button"
                        onClick={addCustomSkill}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                      >
                        <Plus size={14} /> Add skill
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Availability</span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {AVAILABILITY_OPTIONS.map((option) => {
                        const active = selectedAvailability.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleAvailability(option)}
                            className={`rounded-full border px-3 py-1 text-sm transition ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted text-foreground'}`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Shirt size</span>
                      <select
                        value={form.shirtSize}
                        onChange={(e) => setField('shirtSize', e.target.value)}
                        className={fieldClass}
                      >
                        <option value="">Select size</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                      {errors.shirtSize && <p className="text-xs text-rose-600">{errors.shirtSize}</p>}
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Why volunteer?</span>
                      <input
                        type="text"
                        className={fieldClass}
                        value={form.whyVolunteer}
                        onChange={(e) => setField('whyVolunteer', e.target.value)}
                        placeholder="What motivates you"
                      />
                    </label>
                  </div>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Bio</span>
                    <textarea
                      className={`${fieldClass} min-h-[112px] resize-none`}
                      value={form.bio}
                      onChange={(e) => setField('bio', e.target.value)}
                      placeholder="Write a short bio or volunteer summary"
                    />
                  </label>
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <MapPin size={16} /> Summary
                </div>
                <div className="mt-4 space-y-3 text-sm text-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} /> {profile.volunteer_status?.toUpperCase() || 'PENDING'} status
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} /> {form.region || 'Region not set'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} /> {form.phone || 'No phone'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} /> {profile.email || 'No email'}
                  </div>
                  <div className="pt-3">
                    <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Profile completeness</div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.round(((10 - missingFields.length) / 10) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{Math.round(((10 - missingFields.length) / 10) * 100)}% complete</div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Building2 size={16} /> Required fields
                </div>
                <div className="mt-4 text-sm text-foreground space-y-2">
                  {missingFields.length > 0 ? (
                    <>
                      <p className="text-sm font-medium">These fields are required:</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {missingFields.map((label) => (
                          <li key={label}>{label}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">All required volunteer fields are completed.</p>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
