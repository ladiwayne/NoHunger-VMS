import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api/client';
import { apiFetch } from '@/lib/api/client';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'New password must be at least 8 characters' }, { status: 400 });
    }

    // Get the token from cookies
    const token = getToken();
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Call backend API
    const response = await apiFetch('/api/auth/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Change password API error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to change password' },
      { status: error.status || 500 }
    );
  }
}