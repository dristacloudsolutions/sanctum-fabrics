import { NextResponse } from 'next/server';
import { getToken } from '@/lib/session';
import { resolveCart } from '@/lib/cart-helpers';

export async function GET() {
  try {
    const token = await getToken();
    const { cart } = await resolveCart(token);
    return NextResponse.json({ cart });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load cart' }, { status: 400 });
  }
}
