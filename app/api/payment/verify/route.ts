import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyPayment } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken();

    const body = await req.json();
    const order = await verifyPayment(body, token);

    // Payment completed successfully — drop the cart cookie now
    const store = await cookies();
    store.delete('sanctum_cart_id');

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 400 });
  }
}
