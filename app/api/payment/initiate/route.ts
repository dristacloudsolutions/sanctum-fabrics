import { NextRequest, NextResponse } from 'next/server';
import { initiatePayment } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const { orderId } = await req.json();
    const result = await initiatePayment(orderId, token);
    return NextResponse.json({ payment: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to start payment' }, { status: 400 });
  }
}
