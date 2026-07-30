import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/backendUrl';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const BACKEND_URL = getBackendUrl(request);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const backendRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!backendRes.ok) {
      // Cookie is expired or invalid — clear it
      const response = NextResponse.json({ message: 'Session expired' }, { status: 401 });
      response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
      return response;
    }

    const user = await backendRes.json();
    // Return the token so the client can restore it in memory
    return NextResponse.json({ user, token });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json(
        { message: 'Backend auth service timed out. Check BACKEND_URL / NEXT_PUBLIC_API_URL and backend deployment health.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
