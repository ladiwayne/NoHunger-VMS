/**
 * Base API client that communicates with the Express/MongoDB backend.
 * JWT is stored in memory only (not localStorage) to prevent XSS token theft.
 * Session persistence is handled by the httpOnly cookie set by Next.js API routes.
 */

const stripTrailingSlash = (url: string) => url.replace(/\/+$|\/+(?=\?|#|$)/, '');

const normalizeApiBaseUrl = (url: string): string => {
  const trimmed = stripTrailingSlash(url.trim());
  const absolute = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(absolute);
  if (!parsed.pathname || parsed.pathname === '/') {
    parsed.pathname = '/api';
  } else if (!parsed.pathname.endsWith('/api')) {
    parsed.pathname = `${stripTrailingSlash(parsed.pathname)}/api`;
  }
  return stripTrailingSlash(parsed.toString());
};

const resolveDefaultBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://127.0.0.1:5002/api';
    }
    return `${window.location.protocol}//${host}/api`;
  }
  return 'http://127.0.0.1:5002/api';
};

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL)
  : resolveDefaultBaseUrl();

// In-memory token — survives the current page session but is cleared on refresh.
// Restored from the httpOnly cookie via /api/auth/me on each page load.
let _memoryToken: string | null = null;

// Simple response cache for GET requests (5-minute TTL)
const _responseCache = new Map<string, { data: any; expiry: number }>();

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

export function invalidateCache(path?: string): void {
  if (!path) {
    _responseCache.clear();
    return;
  }
  _responseCache.delete(`${BASE_URL}${path}`);
}

async function parseApiResponse<T>(response: Response, cacheKey: string, method?: string): Promise<T> {
  const text = await response.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text as unknown as T;
    }
  }

  if (method && method.toUpperCase() !== 'GET') {
    invalidateCache();
  }

  if (!method || method.toUpperCase() === 'GET') {
    _responseCache.set(cacheKey, {
      data,
      expiry: Date.now() + 5 * 60 * 1000,
    });
  }

  return data as T;
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fullUrl = `${BASE_URL}${path}`;
  const cacheKey = fullUrl;

  if (options.method?.toUpperCase() === 'GET' || !options.method) {
    const cached = _responseCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
  }

  const controller = new AbortController();
  const timeoutId = (typeof window !== 'undefined' ? window.setTimeout : setTimeout)(() => controller.abort(), 15000);

  try {
    const response = await fetch(fullUrl, { ...options, headers, credentials: 'include', signal: controller.signal });

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

    return await parseApiResponse<T>(response, cacheKey, options.method);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('The server is taking too long to respond. Please try again shortly.');
    }
    if (error instanceof TypeError) {
      throw new Error('Unable to reach the server. Please make sure the backend is running and refresh the page.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
