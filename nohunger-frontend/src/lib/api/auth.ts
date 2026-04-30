import { setToken, clearToken } from './client';
import { adaptUser } from './adapters';

export interface LoginResult {
  user: any;
  profile: any;
  token: string;
}

export interface SignUpOptions {
  fullName: string;
  phone?: string;
  region?: string;
  skills?: string[];
}

/** Helper for calling the Next.js auth API routes (same-origin, httpOnly cookie handling). */
async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...((options.headers as Record<string, string>) || {}) },
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
  return data;
}

export async function login(email: string, password: string): Promise<LoginResult | null> {
  // Let errors propagate so callers can show the backend's message
  const data = await authFetch<any>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token && data.user) {
    setToken(data.token); // store in memory only
    const profile = adaptUser(data.user);
    localStorage.setItem('auth-user', JSON.stringify(profile));
    return { user: data.user, profile, token: data.token };
  }
  return null;
}

export async function register(
  email: string,
  password: string,
  options: SignUpOptions
): Promise<any> {
  const nameParts = options.fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const data = await authFetch<any>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName,
      phone: options.phone || '',
      country: options.region || '',
      skills: options.skills || [],
    }),
  });

  if (data.token && data.user) {
    setToken(data.token); // store in memory only
    const profile = adaptUser(data.user);
    localStorage.setItem('auth-user', JSON.stringify(profile));
    return { user: data.user, profile, token: data.token };
  }
  return data;
}

export async function getMe(): Promise<any | null> {
  try {
    // Calls the Next.js API route which reads the httpOnly cookie server-side
    const data = await authFetch<any>('/api/auth/me');
    if (data.user) {
      setToken(data.token); // restore token to memory from cookie session
      return adaptUser(data.user);
    }
    return null;
  } catch {
    return null;
  }
}

export function logout(): void {
  clearToken(); // clears memory + localStorage profile + fires cookie clear
}
