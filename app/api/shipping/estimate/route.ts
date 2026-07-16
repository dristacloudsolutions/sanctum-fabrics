import { NextRequest, NextResponse } from 'next/server';
import { listShippingOptions } from '@/lib/dristaService';
import { getToken, getCartId } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { pincode } = await req.json();
    const cartId = await getCartId();
    if (!cartId) return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });

    const token = await getToken();
    const options = await listShippingOptions(cartId, pincode, token);
    return NextResponse.json({ options });
  } catch (error: any) {
    // Not surfaced as scary UI errors — the checkout page just shows no
    // delivery options if this fails (e.g. courier not yet configured for
    // this store, or the pincode isn't serviceable by anyone).
    return NextResponse.json({ error: error.message || 'Shipping options unavailable' }, { status: 400 });
  }
}
