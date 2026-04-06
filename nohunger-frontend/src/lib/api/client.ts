/**
 * Base API client that communicates with the Express/MongoDB backend.
 * JWT is stored in memory only (not localStorage) to prevent XSS token theft.
 * Session persistence is handled by the httpOnly cookie set by Next.js API routes.
 */

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// In-memory token — survives the current page session but is cleared on refresh.
// Restored from the httpOnly cookie via /api/auth/me on each page load.
let _memoryToken: string | null = null;

export function getToken(): string | null {
  return _memoryToken;
}

export function setToken(token: string): void {
  _memoryToken = token;
}

export function clearToken(): void {
  _memoryToken = null;
  if (typeof window === 'undefined') return;
  // Clean up any legacy localStorage token from older versions
  localStorage.removeItem('auth-token');
  localStorage.removeItem('auth-user');
  // Fire-and-forget: clear the httpOnly session cookie
  fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.replace('/sign-up-login-screen?session_expired=1');
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(err.message || `HTTP ${response.status}`);
  }

  // Handle empty responses (204 No Content)
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}
