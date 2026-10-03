import { NextRequest, NextResponse } from 'next/server';
import { initiatePayment } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    // Guest checkout is allowed — a guest's order was already created and
    // scoped to the right Customer at /api/checkout time; paying for it needs
    // no session, just the order id (Razorpay's own signature check is what
    // actually protects the payment itself in /api/payment/verify).
    const token = await getToken();

    const { orderId } = await req.json();
    const result = await initiatePayment(orderId, token);
    return NextResponse.json({ payment: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to start payment' }, { status: 400 });
  }
}
