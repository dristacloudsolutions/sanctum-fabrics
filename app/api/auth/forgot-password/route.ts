import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/dristaService';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    await requestPasswordReset(cleanEmail);
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to request password reset' },
      { status: 500 }
    );
  }
}
