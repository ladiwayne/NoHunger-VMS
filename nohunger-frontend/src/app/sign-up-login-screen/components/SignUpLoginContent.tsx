'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { requestPasswordReset, resetPassword } from '@/lib/api/password-reset';
import { COUNTRIES } from '@/lib/constants/countries';
import { SECURITY_QUESTIONS } from '@/lib/constants/security-questions';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Heart,
  Users,
  Package,
  Truck,
  ChefHat,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Leaf,
  Globe,
  HandHeart,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Search,
  DollarSign,
  MessageSquare,
  FileText,
  Camera,
  Briefcase,
  HelpCircle,
  Shield,
} from 'lucide-react';

type LoginFormData = { email: string; password: string; rememberMe: boolean };
type SignupFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  securityQuestion: string;
  securityAnswer: string;
};
type ForgotFormData = { email: string; securityQuestion: string; securityAnswer: string };
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

const IMPACT_STATS = [
  { value: '10+', label: 'Active Programs' },
  { value: '10+', label: 'Causes we are handling' },
  { value: '1,500', label: 'Registered Volunteers' },
];

const PROGRAMS = [
  { icon: Package, label: 'Temporary Food Assistance Program (TFAP)', desc: 'Providing emergency food support to families in need' },
  {
    icon: Leaf,
    label: 'Vertical Backyard Farming (VERT2FAMNN)',
    desc: 'Family nutritional needs through home gardening',
  },
  {
    icon: HandHeart,
    label: 'Support A Girl Child Back To School',
    desc: 'Ensuring girls have access to quality education',
  },
  {
    icon: Leaf,
    label: 'Climate-Smart Food Recovery (CSFRIEND)',
    desc: 'Nutrition security through sustainable practices',
  },
];

// Password strength checker
const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-warning' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-success' };
};

// Field error helper
const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1 text-[12px] text-destructive mt-1.5">
      <AlertCircle size={11} className="flex-shrink-0" />
      {message}
    </p>
  ) : null;

// Rate limit error helper
const isRateLimitError = (err: any): boolean => {
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('rate limit') ||
    msg.includes('over_email_send_rate_limit') ||
    msg.includes('too many requests') ||
    err?.status === 429
  );
};

const getRateLimitMessage = (): string =>
  'Too many requests. Please wait a few minutes before trying again.';

// Input class helper
const inputClass = (hasError: boolean) =>
  `w-full pl-10 pr-4 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
    hasError
      ? 'border-destructive/60 focus:ring-destructive/20 focus:border-destructive bg-destructive/5'
      : 'border-border focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)]'
  }`;

const inputClassSm = (hasError: boolean) =>
  `w-full pl-9 pr-3 py-2.5 bg-muted border rounded-xl text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
    hasError
      ? 'border-destructive/60 focus:ring-destructive/20 focus:border-destructive bg-destructive/5'
      : 'border-border focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)]'
  }`;

export default function SignUpLoginContent() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Retry / lockout state
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotValidated, setForgotValidated] = useState(false);
  const [resetPasswordToken, setResetPasswordToken] = useState('');
  const [allowDirectReset, setAllowDirectReset] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Show session expired toast if redirected from middleware
  useEffect(() => {
    if (searchParams.get('session_expired') === '1') {
      toast.error('Your session has expired. Please sign in again.', {
        id: 'session-expired-msg',
        duration: 5000,
      });
    }
  }, [searchParams]);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setLockCountdown(0);
        setLoginAttempts(0);
        setLoginError('');
        clearInterval(interval);
      } else {
        setLockCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const loginForm = useForm<LoginFormData>({
    defaultValues: { email: '', password: '', rememberMe: false },
    mode: 'onTouched',
  });

  const signupForm = useForm<SignupFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
      securityQuestion: '',
      securityAnswer: '',
    },
    mode: 'onTouched',
  });

  const forgotForm = useForm<ForgotFormData>({
    defaultValues: { email: '', securityQuestion: '', securityAnswer: '' },
    mode: 'onTouched',
  });

  const watchedPassword = signupForm.watch('password');
  const passwordStrength = getPasswordStrength(watchedPassword);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const handleLogin = async (data: LoginFormData) => {
    if (isLocked) return;
    setLoginError('');
    setLoginLoading(true);
    try {
      const result = await signIn(data.email, data.password);
      if (result?.user) {
        const role =
          (result as any)?.profile?.role || result.user.user_metadata?.role || 'volunteer';
        toast.success('Welcome back! Redirecting…', { duration: 2000, icon: '👋' });
        setLoginAttempts(0);
        setLoginLoading(false);
        if (role === 'admin' || role === 'super_admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/volunteer-dashboard');
        }
      } else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_SECONDS * 1000;
          setLockedUntil(until);
          setLockCountdown(LOCKOUT_SECONDS);
          setLoginError(
            `Too many failed attempts. Please wait ${LOCKOUT_SECONDS} seconds before trying again.`
          );
        } else {
          const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
          setLoginError(
            `Login failed. Please check your credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          );
        }
        setLoginLoading(false);
      }
    } catch (err: any) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (isRateLimitError(err)) {
        setLoginError(getRateLimitMessage());
        setLoginLoading(false);
        return;
      }
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_SECONDS * 1000;
        setLockedUntil(until);
        setLockCountdown(LOCKOUT_SECONDS);
        setLoginError(
          `Too many failed attempts. Please wait ${LOCKOUT_SECONDS} seconds before trying again.`
        );
      } else {
        const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
        setLoginError(
          `${err?.message || 'Invalid email or password.'} ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
        );
      }
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotFormData) => {
    setForgotError('');
    setForgotLoading(true);

    try {
      const result = await requestPasswordReset(data.email, data.securityQuestion, data.securityAnswer);

      if (result?.resetToken) {
        // Direct reset when backend returns a token for development/testing
        setResetPasswordToken(result.resetToken);
      }
      setAllowDirectReset(!!result?.allowDirectReset);

      setForgotValidated(true);
      toast.success('Security verified!', {
        description: result?.resetToken || result?.allowDirectReset
          ? 'You can now set your new password.'
          : 'Check your email for instructions.',
        duration: 3000,
      });
      setForgotLoading(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setForgotError(message);
      toast.error('Password reset failed', { description: message });
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }
    if (resetPasswordForm.password.length < 8) {
      setForgotError('Password must be at least 8 characters');
      return;
    }
    setResetPasswordLoading(true);
    setForgotError('');
    try {
      await resetPassword(resetPasswordToken, resetPasswordForm.password, resetPasswordForm.confirmPassword);
      toast.success('Password reset successfully!', {
        description: 'Redirecting to sign in...',
        duration: 2000,
      });
      setTimeout(() => {
        setForgotValidated(false);
        setShowForgotPassword(false);
        forgotForm.reset();
        setResetPasswordForm({ password: '', confirmPassword: '' });
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setForgotError(message);
      toast.error('Password reset failed', { description: message });
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    if (data.password !== data.confirmPassword) {
      signupForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    setSignupLoading(true);
    try {
      await signUp(data.email, data.password, {
        fullName: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        country: data.country,
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer,
      });
      setSignupLoading(false);
      setSignupSuccess(true);
      toast.success('Account created! You can update your profile from the dashboard anytime.', {
        duration: 4000,
      });
      setTimeout(() => router.push('/volunteer-dashboard'), 1500);
    } catch (err: any) {
      setSignupLoading(false);
      if (isRateLimitError(err)) {
        toast.error(getRateLimitMessage(), { duration: 6000 });
      } else {
        toast.error(err?.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Hero copy - hidden on mobile, shown on desktop */}
      <div className="hidden lg:flex flex-1 flex-col justify-center bg-gradient-to-br from-green-600 to-green-800 px-8 xl:px-12">

        <h1 className="text-3xl xl:text-5xl font-800 text-white leading-tight mb-4 xl:mb-5">
              Nourishing Lives, Empowering Communities
            </h1>
            <p className="text-green-100/90 text-sm xl:text-[15px] leading-relaxed max-w-sm mb-6 xl:mb-8">
              No Hunger Initiatives is committed to ending hunger and building stronger communities by providing nutritious food, hope, and practical support to vulnerable families, powered by caring Champions like you.
            </p>

            {/* Impact stats */}
            <div className="grid grid-cols-3 gap-2 mb-6 xl:mb-8">
              {IMPACT_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-3 xl:p-4 border border-white/15 hover:bg-white/15 transition-colors"
                >
                  <p className="text-xl xl:text-2xl font-800 text-white font-tabular">{stat.value}</p>
                  <p className="text-[10px] xl:text-[11px] text-green-100/80 mt-0.5 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Programs */}
            <div className="space-y-2.5 mb-8">
              <p className="text-[11px] font-700 text-green-200/80 uppercase tracking-widest mb-3">
                Our Programs
              </p>
              {PROGRAMS.map((prog) => {
                const PIcon = prog.icon;
                return (
                  <div
                    key={prog.label}
                    className="flex items-center gap-3 bg-white/8 rounded-xl px-3.5 py-2.5 border border-white/10 hover:bg-white/12 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                      <PIcon size={14} className="text-green-200" />
                    </div>
                    <div>
                      <p className="text-[12px] font-700 text-white">{prog.label}</p>
                      <p className="text-[11px] text-green-100/70">{prog.desc}</p>
                    </div>
                  </div>
                );
              })}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15 mt-3">
                <p className="text-[12px] text-green-50">
                  Visit our website to see more programs -{' '}
                  <a
                    href="https://www.nohungerfoodbank.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-700 underline hover:text-white transition-colors"
                  >
                    www.nohungerfoodbank.org
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto scrollbar-thin">
            <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-6 sm:mb-8 lg:hidden">
            <AppLogo src="/assets/images/NoHunger-Logo-Main2-1774544336394.png" size={36} />
            <div>
              <p className="font-display font-700 text-base sm:text-lg text-foreground">No Hunger Initiatives Nigeria</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest">
                No Hunger Champion Hub
              </p>
            </div>
          </div>

          {/* FORGOT PASSWORD VIEW */}
          {showForgotPassword ? (
            <div className="animate-slide-up">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotValidated(false);
                  setForgotError('');
                  forgotForm.reset();
                  setResetPasswordForm({ password: '', confirmPassword: '' });
                }}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>

              {forgotValidated ? (
                <div className="animate-slide-up">
                  <div className="mb-6">
                    <h2 className="text-2xl font-700 text-foreground">Set new password</h2>
                    <p className="text-[14px] text-muted-foreground mt-1">
                      {resetPasswordToken || allowDirectReset
                        ? 'Choose a strong password for your account'
                        : 'Check your email for the password reset link.'}
                    </p>
                  </div>

                  {forgotError && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-destructive/8 border border-destructive/20 rounded-xl mb-5">
                      <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] text-destructive">{forgotError}</p>
                    </div>
                  )}

                  {(resetPasswordToken || allowDirectReset) ? (
                    <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          New password
                        </label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(142,72%,35%)]"
                        />
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          placeholder="Min. 8 characters"
                          value={resetPasswordForm.password}
                          onChange={(e) => setResetPasswordForm((p) => ({ ...p, password: e.target.value }))}
                          className="w-full pl-10 pr-10 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 border-border focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[hsl(142,72%,29%)] transition-colors"
                        >
                          {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Confirm new password
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(142,72%,35%)]"
                        />
                        <input
                          type={showResetConfirm ? 'text' : 'password'}
                          placeholder="Repeat password"
                          value={resetPasswordForm.confirmPassword}
                          onChange={(e) => setResetPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                          className="w-full pl-10 pr-10 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 border-border focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(!showResetConfirm)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[hsl(142,72%,29%)] transition-colors"
                        >
                          {showResetConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={resetPasswordLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[hsl(142,72%,29%)] text-white font-700 rounded-xl hover:bg-[hsl(142,72%,22%)] hover:shadow-[0_4px_14px_0_rgba(22,101,52,0.30)] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {resetPasswordLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <span>Update Password</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                  ) : (
                    <div className="rounded-2xl border border-border bg-muted p-5 text-[14px] text-foreground">
                      <p className="font-medium mb-2">Reset link sent</p>
                      <p className="text-sm text-muted-foreground">
                        We have sent an email with your password reset link. Open that link to set your new password.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-700 text-foreground">Reset your password</h2>
                    <p className="text-[14px] text-muted-foreground mt-1">
                      Answer your security question to reset your password
                    </p>
                  </div>

                  {forgotError && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-destructive/8 border border-destructive/20 rounded-xl mb-5">
                      <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] text-destructive">{forgotError}</p>
                    </div>
                  )}

                  <form
                    onSubmit={forgotForm.handleSubmit(handleForgotPassword)}
                    className="space-y-4"
                    noValidate
                  >
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail
                          size={16}
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${forgotForm.formState.errors.email ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                        />
                        <input
                          {...forgotForm.register('email', {
                            required: 'Email address is required',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Please enter a valid email address',
                            },
                          })}
                          type="email"
                          placeholder="you@example.com"
                          className={inputClass(!!forgotForm.formState.errors.email)}
                        />
                      </div>
                      <FieldError message={forgotForm.formState.errors.email?.message} />
                    </div>

                    {/* Security Question */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Security Question
                      </label>
                      <div className="relative">
                        <HelpCircle
                          size={16}
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 ${forgotForm.formState.errors.securityQuestion ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                        />
                        <select
                          {...forgotForm.register('securityQuestion', {
                            required: 'Security question is required',
                          })}
                          className={`w-full pl-10 pr-4 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground focus:outline-none focus:ring-2 transition-all appearance-none ${forgotForm.formState.errors.securityQuestion ? 'border-destructive/60 focus:ring-destructive/20 focus:border-destructive bg-destructive/5' : 'border-border focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)]'}`}
                        >
                          <option value="">Select your security question…</option>
                          {SECURITY_QUESTIONS.map((question) => (
                            <option key={question} value={question}>
                              {question}
                            </option>
                          ))}
                        </select>
                      </div>
                      <FieldError message={forgotForm.formState.errors.securityQuestion?.message} />
                    </div>

                    {/* Security Answer */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Security Answer
                      </label>
                      <div className="relative">
                        <Shield
                          size={16}
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${forgotForm.formState.errors.securityAnswer ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                        />
                        <input
                          {...forgotForm.register('securityAnswer', {
                            required: 'Security answer is required',
                          })}
                          type="text"
                          placeholder="Your answer to the security question"
                          className={inputClass(!!forgotForm.formState.errors.securityAnswer)}
                        />
                      </div>
                      <FieldError message={forgotForm.formState.errors.securityAnswer?.message} />
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[hsl(142,72%,29%)] text-white font-700 rounded-xl hover:bg-[hsl(142,72%,22%)] hover:shadow-[0_4px_14px_0_rgba(22,101,52,0.30)] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {forgotLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="flex bg-muted rounded-xl p-1 mb-8">
                {(['login', 'signup'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setLoginError('');
                      loginForm.clearErrors();
                      signupForm.clearErrors();
                    }}
                    className={`flex-1 py-2.5 text-[13.5px] font-600 rounded-lg transition-all duration-200 ${activeTab === tab ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {tab === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              {/* LOGIN FORM */}
              {activeTab === 'login' && (
                <div className="animate-slide-up">
                  <div className="mb-6">
                    <h2 className="text-2xl font-700 text-foreground">Welcome back</h2>
                    <p className="text-[14px] text-muted-foreground mt-1">
                      Sign in to your No Hunger Champion account
                    </p>
                  </div>

                  {loginError && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-destructive/8 border border-destructive/20 rounded-xl mb-5">
                      <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[13px] text-destructive">{loginError}</p>
                        {isLocked && lockCountdown > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <RefreshCw size={12} className="text-destructive animate-spin" />
                            <p className="text-[12px] text-destructive font-600">
                              Retry available in {lockCountdown}s
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attempt indicator */}
                  {loginAttempts > 0 && !isLocked && (
                    <div className="flex items-center gap-1.5 mb-4">
                      {Array.from({ length: MAX_LOGIN_ATTEMPTS }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${i < loginAttempts ? 'bg-destructive' : 'bg-muted'}`}
                        />
                      ))}
                      <span className="text-[11px] text-muted-foreground ml-1 whitespace-nowrap">
                        {loginAttempts}/{MAX_LOGIN_ATTEMPTS}
                      </span>
                    </div>
                  )}

                  <form
                    onSubmit={loginForm.handleSubmit(handleLogin)}
                    className="space-y-4"
                    noValidate
                  >
                    {/* Email */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail
                          size={16}
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${loginForm.formState.errors.email ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                        />
                        <input
                          {...loginForm.register('email', {
                            required: 'Email address is required',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Please enter a valid email address',
                            },
                          })}
                          type="email"
                          placeholder="you@example.com"
                          disabled={isLocked}
                          className={`${inputClass(!!loginForm.formState.errors.email)} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      <FieldError message={loginForm.formState.errors.email?.message} />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[13px] font-600 text-foreground">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setLoginError('');
                          }}
                          className="text-[12px] text-[hsl(142,72%,29%)] font-600 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock
                          size={16}
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${loginForm.formState.errors.password ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                        />
                        <input
                          {...loginForm.register('password', { required: 'Password is required' })}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          disabled={isLocked}
                          className={`${inputClass(!!loginForm.formState.errors.password)} pr-10 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[hsl(142,72%,29%)] transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <FieldError message={loginForm.formState.errors.password?.message} />
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading || isLocked}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[hsl(142,72%,29%)] text-white font-700 rounded-xl hover:bg-[hsl(142,72%,22%)] hover:shadow-[0_4px_14px_0_rgba(22,101,52,0.30)] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {loginLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : isLocked ? (
                        <>
                          <RefreshCw size={16} />
                          <span>Locked — wait {lockCountdown}s</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* SIGNUP FORM */}
              {activeTab === 'signup' && (
                <div className="animate-slide-up">
                  <div className="mb-6">
                    <h2 className="text-2xl font-700 text-foreground">Join No Hunger Initiatives Nigeria</h2>
                    <p className="text-[14px] text-muted-foreground mt-1">
                      Create your No Hunger Champion account and start making a difference
                    </p>
                  </div>

                  <form
                    onSubmit={signupForm.handleSubmit(handleSignup)}
                    className="space-y-4"
                    noValidate
                  >
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          First name
                        </label>
                        <div className="relative">
                          <User
                            size={15}
                            className={`absolute left-3 top-1/2 -translate-y-1/2 ${signupForm.formState.errors.firstName ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                          />
                          <input
                            {...signupForm.register('firstName', {
                              required: 'First name is required',
                              minLength: { value: 2, message: 'Min. 2 characters' },
                            })}
                            placeholder="Emeka"
                            className={inputClassSm(!!signupForm.formState.errors.firstName)}
                          />
                        </div>
                        <FieldError message={signupForm.formState.errors.firstName?.message} />
                      </div>
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          Last name
                        </label>
                        <input
                          {...signupForm.register('lastName', {
                            required: 'Last name is required',
                            minLength: { value: 2, message: 'Min. 2 characters' },
                          })}
                          placeholder="Aliu"
                          className={`w-full px-3 py-2.5 bg-muted border rounded-xl text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all appearance-none ${signupForm.formState.errors.lastName ? 'border-destructive/60 focus:ring-destructive/20 focus:border-destructive bg-destructive/5' : 'border-border focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)]'}`}
                        />
                        <FieldError message={signupForm.formState.errors.lastName?.message} />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail
                          size={15}
                          className={`absolute left-3 top-1/2 -translate-y-1/2 ${signupForm.formState.errors.email ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                        />
                        <input
                          {...signupForm.register('email', {
                            required: 'Email address is required',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Please enter a valid email address',
                            },
                          })}
                          type="email"
                          placeholder="you@example.com"
                          className={inputClassSm(!!signupForm.formState.errors.email)}
                        />
                      </div>
                      <FieldError message={signupForm.formState.errors.email?.message} />
                    </div>

                    {/* Phone + State */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          Phone
                        </label>
                        <div className="relative">
                          <Phone
                            size={15}
                            className={`absolute left-3 top-1/2 -translate-y-1/2 ${signupForm.formState.errors.phone ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                          />
                          <input
                            {...signupForm.register('phone', {
                              required: 'Phone number is required',
                              pattern: {
                                value: /^[+]?[\d\s\-()]{7,15}$/,
                                message: 'Enter a valid phone number',
                              },
                            })}
                            placeholder="+1 (555) 000-0000"
                            className={inputClassSm(!!signupForm.formState.errors.phone)}
                          />
                        </div>
                        <FieldError message={signupForm.formState.errors.phone?.message} />
                      </div>
                      <div>
                        <label className="block text-[13px] font-600 text-foreground mb-1.5">
                          Country
                        </label>
                        <div className="relative">
                          <Globe
                            size={15}
                            className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 ${signupForm.formState.errors.country ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                          />
                          <select
                            {...signupForm.register('country', {
                              required: 'Please select your state',
                            })}
                            className={`w-full pl-9 pr-3 py-2.5 bg-muted border rounded-xl text-[13.5px] text-foreground focus:outline-none focus:ring-2 transition-all appearance-none ${signupForm.formState.errors.country ? 'border-destructive/60 focus:ring-destructive/20 focus:border-destructive bg-destructive/5' : 'border-border focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)]'}`}
                          >
                            <option value="">Select…</option>
                            {COUNTRIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <FieldError message={signupForm.formState.errors.country?.message} />
                      </div>
                    </div>

                    {/* Security Question */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Security Question{' '}
                        <span className="text-muted-foreground font-400 text-[12px]">
                          (for password recovery)
                        </span>
                      </label>
                      <div className="relative">
                        <HelpCircle
                          size={15}
                          className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 ${signupForm.formState.errors.securityQuestion ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                        />
                        <select
                          {...signupForm.register('securityQuestion', {
                            required: 'Please select a security question',
                          })}
                          className={`w-full pl-9 pr-3 py-2.5 bg-muted border rounded-xl text-[13.5px] text-foreground focus:outline-none focus:ring-2 transition-all appearance-none ${signupForm.formState.errors.securityQuestion ? 'border-destructive/60 focus:ring-destructive/20 focus:border-destructive bg-destructive/5' : 'border-border focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)]'}`}
                        >
                          <option value="">Select a security question…</option>
                          {SECURITY_QUESTIONS.map((question) => (
                            <option key={question} value={question}>
                              {question}
                            </option>
                          ))}
                        </select>
                      </div>
                      <FieldError message={signupForm.formState.errors.securityQuestion?.message} />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        This will be used to reset your password if forgotten. Keep it safe and memorable.
                      </p>
                    </div>

                    {/* Security Answer */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Security Answer
                      </label>
                      <div className="relative">
                        <Shield
                          size={15}
                          className={`absolute left-3 top-1/2 -translate-y-1/2 ${signupForm.formState.errors.securityAnswer ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                        />
                        <input
                          {...signupForm.register('securityAnswer', {
                            required: 'Security answer is required',
                            minLength: {
                              value: 2,
                              message: 'Security answer must be at least 2 characters',
                            },
                          })}
                          type="text"
                          placeholder="Your answer to the security question"
                          className={inputClassSm(!!signupForm.formState.errors.securityAnswer)}
                        />
                      </div>
                      <FieldError message={signupForm.formState.errors.securityAnswer?.message} />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock
                          size={15}
                          className={`absolute left-3 top-1/2 -translate-y-1/2 ${signupForm.formState.errors.password ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                        />
                        <input
                          {...signupForm.register('password', {
                            required: 'Password is required',
                            minLength: {
                              value: 8,
                              message: 'Password must be at least 8 characters',
                            },
                            validate: (v: string) =>
                              /[A-Z]/.test(v) || 'Include at least one uppercase letter',
                          })}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 8 characters"
                          className={`${inputClassSm(!!signupForm.formState.errors.password)} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[hsl(142,72%,29%)] transition-colors"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {watchedPassword && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength.score ? passwordStrength.color : 'bg-muted'}`}
                              />
                            ))}
                          </div>
                          <p
                            className={`text-[11px] font-600 ${passwordStrength.score <= 1 ? 'text-destructive' : passwordStrength.score <= 2 ? 'text-warning' : passwordStrength.score <= 3 ? 'text-blue-500' : 'text-success'}`}
                          >
                            {passwordStrength.label} password
                          </p>
                        </div>
                      )}
                      <FieldError message={signupForm.formState.errors.password?.message} />
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="block text-[13px] font-600 text-foreground mb-1.5">
                        Confirm password
                      </label>
                      <div className="relative">
                        <Lock
                          size={15}
                          className={`absolute left-3 top-1/2 -translate-y-1/2 ${signupForm.formState.errors.confirmPassword ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                        />
                        <input
                          {...signupForm.register('confirmPassword', {
                            required: 'Please confirm your password',
                            validate: (v: string) =>
                              v === watchedPassword || 'Passwords do not match',
                          })}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repeat password"
                          className={`${inputClassSm(!!signupForm.formState.errors.confirmPassword)} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[hsl(142,72%,29%)] transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        {signupForm.watch('confirmPassword') && (
                          <div className="absolute right-9 top-1/2 -translate-y-1/2">
                            {signupForm.watch('confirmPassword') === watchedPassword ? (
                              <CheckCircle size={14} className="text-success" />
                            ) : (
                              <XCircle size={14} className="text-destructive" />
                            )}
                          </div>
                        )}
                      </div>
                      <FieldError message={signupForm.formState.errors.confirmPassword?.message} />
                    </div>

                    {/* Terms */}
                    <div>
                      <div className="flex items-start gap-2.5">
                        <input
                          {...signupForm.register('agreeTerms', {
                            required: 'You must agree to the terms to continue',
                          })}
                          type="checkbox"
                          id="agreeTerms"
                          className={`mt-0.5 w-4 h-4 rounded border-border accent-[hsl(142,72%,29%)] ${signupForm.formState.errors.agreeTerms ? 'outline outline-1 outline-destructive' : ''}`}
                        />
                        <label
                          htmlFor="agreeTerms"
                          className="text-[13px] text-muted-foreground leading-relaxed"
                        >
                          I agree to the{' '}
                          <span className="text-[hsl(142,72%,29%)] font-600 hover:underline cursor-pointer">
                            Terms of Service
                          </span>{' '}
                          and{' '}
                          <span className="text-[hsl(142,72%,29%)] font-600 hover:underline cursor-pointer">
                            Privacy Policy
                          </span>
                        </label>
                      </div>
                      <FieldError message={signupForm.formState.errors.agreeTerms?.message} />
                    </div>

                    <button
                      type="submit"
                      disabled={signupLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[hsl(142,72%,29%)] text-white font-700 rounded-xl hover:bg-[hsl(142,72%,22%)] hover:shadow-[0_4px_14px_0_rgba(22,101,52,0.30)] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {signupLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
