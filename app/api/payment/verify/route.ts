import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const body = await req.json();
    const order = await verifyPayment(body, token);
    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 400 });
  }
}
