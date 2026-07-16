import { NextRequest, NextResponse } from 'next/server';
import { getMyOrderDetails } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const { id } = await params;
    const order = await getMyOrderDetails(id, token);
    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Order not found' }, { status: 404 });
  }
}
