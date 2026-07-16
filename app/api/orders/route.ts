import { NextResponse } from 'next/server';
import { getMyOrders } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function GET() {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const orders = await getMyOrders(token);
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load orders' }, { status: 400 });
  }
}
