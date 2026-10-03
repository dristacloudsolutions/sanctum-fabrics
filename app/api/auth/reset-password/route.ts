import { NextRequest, NextResponse } from 'next/server';
import { submitPasswordReset } from '@/lib/dristaService';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    await submitPasswordReset(token, password);
    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You may now sign in with your new password.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to reset password. The link may have expired.' },
      { status: 400 }
    );
  }
}
