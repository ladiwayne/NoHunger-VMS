import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

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
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
