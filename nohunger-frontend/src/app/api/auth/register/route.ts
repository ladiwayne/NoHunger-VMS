import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:5000';
  return `${proto}://${host}/api`;
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const BACKEND_URL = getBackendUrl(request);

    const backendRes = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({ message: 'Failed to parse backend response' }));

    if (!backendRes.ok) {
      console.error('[Register] Backend error:', backendRes.status, data);
      return NextResponse.json(data, { status: backendRes.status });
    }

    const response = NextResponse.json({
      user: data.user,
      token: data.token,
      message: data.message,
    });

    if (data.token) {
      response.cookies.set('auth-token', data.token, COOKIE_OPTS);
    }

    return response;
  } catch (err: any) {
    console.error('[Register] Server error:', err.message);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
