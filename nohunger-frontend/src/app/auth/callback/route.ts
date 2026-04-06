import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

// OAuth callback is not used — redirect to sign-in
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/sign-up-login-screen`);
}
