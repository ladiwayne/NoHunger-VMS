import { apiFetch, setToken, clearToken } from './client';
import { adaptUser } from './adapters';

export interface LoginResult {
  user: any;
  profile: any;
  token: string;
}

export interface SignUpOptions {
  fullName: string;
  role?: string;
  phone?: string;
  region?: string;
  skills?: string[];
}

export async function login(email: string, password: string): Promise<LoginResult | null> {
  try {
    const data = await apiFetch<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token && data.user) {
      setToken(data.token);
      const profile = adaptUser(data.user);
      localStorage.setItem('auth-user', JSON.stringify(profile));
      return { user: data.user, profile, token: data.token };
    }
    return null;
  } catch {
    return null;
  }
}

export async function register(
  email: string,
  password: string,
  options: SignUpOptions
): Promise<any> {
  const nameParts = options.fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const data = await apiFetch<any>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName,
      phone: options.phone || '',
      role: options.role || 'volunteer',
      country: options.region || '',
      skills: options.skills || [],
    }),
  });

  if (data.token && data.user) {
    setToken(data.token);
    const profile = adaptUser(data.user);
    localStorage.setItem('auth-user', JSON.stringify(profile));
    return { user: data.user, profile, token: data.token };
  }
  return data;
}

export async function getMe(): Promise<any | null> {
  try {
    const data = await apiFetch<any>('/auth/me');
    return adaptUser(data.user || data);
  } catch {
    return null;
  }
}

export function logout(): void {
  clearToken();
}
