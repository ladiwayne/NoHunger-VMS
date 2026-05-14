'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
  logout as apiLogout,
} from '@/lib/api/auth';

const AuthContext = createContext<any>({});

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARN_BEFORE_MS = 5 * 60 * 1000;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<any>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warnRef.current) clearTimeout(warnRef.current);
  }, []);

  const signOut = useCallback(async () => {
    clearTimers();
    apiLogout();
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      window.location.replace('/sign-up-login-screen');
    }
  }, [clearTimers]);

  const startSessionTimer = useCallback(() => {
    clearTimers();
    if (!userRef.current) return;

    warnRef.current = setTimeout(() => {
      if (userRef.current) {
        toast.warning('Your session will expire in 5 minutes due to inactivity.', {
          duration: 8000,
          id: 'session-warn',
        });
      }
    }, SESSION_TIMEOUT_MS - WARN_BEFORE_MS);

    timeoutRef.current = setTimeout(async () => {
      if (userRef.current) {
        toast.error('Session expired due to inactivity. Please sign in again.', {
          duration: 5000,
          id: 'session-expired',
        });
        await signOut();
      }
    }, SESSION_TIMEOUT_MS);
  }, [clearTimers, signOut]);

  const resetActivityTimer = useCallback(() => {
    if (!userRef.current) return;
    startSessionTimer();
  }, [startSessionTimer]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }
    startSessionTimer();

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handler = () => resetActivityTimer();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    return () => {
      clearTimers();
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [user, startSessionTimer, resetActivityTimer, clearTimers]);

  // On mount: restore session from localStorage JWT
  useEffect(() => {
    const initAuth = async () => {
      // Temporarily skip the getMe() call to debug page load issues
      const stored = localStorage.getItem('auth-user');
      if (!stored) {
        setLoading(false);
        return;
      }

      // Show stored profile immediately for instant UI, then verify via httpOnly cookie
      try {
        const p = JSON.parse(stored);
        setUser({ id: p.id, email: p.email });
        setProfile(p);
      } catch {
        /* ignore malformed storage */
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result) {
      setUser({ id: result.profile.id, email: result.profile.email });
      setProfile(result.profile);
      return result;
    }
    return null;
  };

  const signUp = async (email: string, password: string, metadata: any = {}) => {
    const result = await apiRegister(email, password, {
      fullName: metadata?.fullName || '',
      phone: metadata?.phone || '',
      region: metadata?.region || '',
      skills: metadata?.skills || [],
      securityQuestion: metadata?.securityQuestion || '',
      securityAnswer: metadata?.securityAnswer || '',
    });
    if (result?.profile) {
      setUser({ id: result.profile.id, email: result.profile.email });
      setProfile(result.profile);
    }
    return result;
  };

  const refreshProfile = async () => {
    const fresh = await getMe();
    if (fresh) {
      setProfile(fresh);
      localStorage.setItem('auth-user', JSON.stringify(fresh));
    }
    return fresh;
  };

  const isAdmin = () => profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = () => profile?.role === 'super_admin';
  const isVolunteer = () => profile?.role === 'volunteer';
  const isApproved = () => profile?.volunteer_status === 'approved';

  const value = {
    user,
    profile,
    session: null,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isSuperAdmin,
    isVolunteer,
    isApproved,
    refreshProfile,
    resetActivityTimer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
