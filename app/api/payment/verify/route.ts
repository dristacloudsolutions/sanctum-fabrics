import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    // Guest checkout is allowed — see /api/payment/initiate for why this needs
    // no session.
    const token = await getToken();

    const body = await req.json();
    const order = await verifyPayment(body, token);
    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 400 });
  }
}
