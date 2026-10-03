import { NextRequest, NextResponse } from 'next/server';
import { verifyCustomerOtp } from '@/lib/dristaService';
import { setToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await verifyCustomerOtp(body);
    await setToken(session.access_token);
    return NextResponse.json({ user: session.user, is_new: session.is_new });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'OTP verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
