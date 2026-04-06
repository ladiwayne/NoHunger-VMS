'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppLogo from '@/components/ui/AppLogo';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

type ResetFormData = { password: string; confirmPassword: string };

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

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1 text-[12px] text-destructive mt-1.5">
      <AlertCircle size={11} className="flex-shrink-0" />
      {message}
    </p>
  ) : null;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormData>({
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const watchedPassword = watch('password');
  const passwordStrength = getPasswordStrength(watchedPassword);

  const onSubmit = async (_data: ResetFormData) => {
    setError(
      'Password reset via email is not available. Please contact an administrator to reset your password.'
    );
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[hsl(142,72%,92%)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-[hsl(142,72%,22%)]" />
          </div>
          <h2 className="text-2xl font-700 text-foreground mb-2">Password updated!</h2>
          <p className="text-[14px] text-muted-foreground">
            Your password has been changed successfully. Redirecting to sign in…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8">
          <AppLogo size={36} />
          <div>
            <p className="font-display font-700 text-lg text-foreground">Nohunger Initiative</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Nohunger Champion Hub
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <div className="mb-6">
            <h2 className="text-2xl font-700 text-foreground">Set new password</h2>
            <p className="text-[14px] text-muted-foreground mt-1">
              Choose a strong password for your account
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-destructive/8 border border-destructive/20 rounded-xl mb-5">
              <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-[13px] font-600 text-foreground mb-1.5">
                New password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.password ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                />
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    validate: (v: string) =>
                      /[A-Z]/.test(v) || 'Include at least one uppercase letter',
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className={`w-full pl-10 pr-10 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${errors.password ? 'border-destructive/60 focus:ring-destructive/20 focus:border-destructive bg-destructive/5' : 'border-border focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[hsl(142,72%,29%)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
              <FieldError message={errors.password?.message} />
            </div>

            <div>
              <label className="block text-[13px] font-600 text-foreground mb-1.5">
                Confirm new password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.confirmPassword ? 'text-destructive' : 'text-[hsl(142,72%,35%)]'}`}
                />
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (v: string) => v === watchedPassword || 'Passwords do not match',
                  })}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-muted border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${errors.confirmPassword ? 'border-destructive/60 focus:ring-destructive/20 focus:border-destructive bg-destructive/5' : 'border-border focus:ring-[hsl(142,72%,29%)]/25 focus:border-[hsl(142,72%,29%)]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[hsl(142,72%,29%)] transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError message={errors.confirmPassword?.message} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[hsl(142,72%,29%)] text-white font-700 rounded-xl hover:bg-[hsl(142,72%,22%)] hover:shadow-[0_4px_14px_0_rgba(22,101,52,0.30)] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
