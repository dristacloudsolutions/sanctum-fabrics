import { NextRequest, NextResponse } from 'next/server';
import { requestCustomerOtp } from '@/lib/dristaService';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    const result = await requestCustomerOtp(phone);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send OTP';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
