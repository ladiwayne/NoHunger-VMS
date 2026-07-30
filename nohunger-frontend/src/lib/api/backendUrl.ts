import { NextRequest } from 'next/server';

const stripTrailingSlash = (url: string) => url.replace(/\/+$|\/+(?=\?|#|$)/, '');

export function getBackendUrl(request: NextRequest): string {
  const explicitUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  if (explicitUrl) {
    return stripTrailingSlash(explicitUrl);
  }

  const rawProto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol || 'http';
  const proto = rawProto.replace(/:$/, '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:5000';
  // In local development without an explicit backend URL, default to the local backend port.
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'http://localhost:5002/api';
  }

  // Avoid proxying back into this same Next.js deployment in production.
  // That creates recursive self-calls and eventually a response timeout.
  throw new Error('Missing BACKEND_URL or NEXT_PUBLIC_API_URL for production backend API.');
}
