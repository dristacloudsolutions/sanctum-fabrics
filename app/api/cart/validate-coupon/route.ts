import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/dristaService';
import { getToken, getCartId } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    const cartId = await getCartId();
    if (!cartId) return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });

    const token = await getToken();
    const preview = await validateCoupon(cartId, code, token);
    return NextResponse.json({ preview });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invalid coupon' }, { status: 400 });
  }
}
