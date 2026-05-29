import { NextRequest } from 'next/server';

const stripTrailingSlash = (url: string) => url.replace(/\/+$|\/+(?=\?|#|$)/, '');

export function getBackendUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL);
  }

  if (process.env.BACKEND_URL) {
    return stripTrailingSlash(process.env.BACKEND_URL);
  }

  const rawProto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol || 'http';
  const proto = rawProto.replace(/:$/, '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:5000';
  const origin = `${proto}://${host}`;

  // In local development without an explicit backend URL, default to the backend port.
  if (host.includes('localhost') && !host.includes('5001')) {
    return 'http://localhost:5001/api';
  }

  return `${origin}/api`;
}
