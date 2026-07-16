import { NextRequest, NextResponse } from 'next/server';
import { addToCart, getCart } from '@/lib/dristaService';
import { getToken } from '@/lib/session';
import { resolveCartId } from '@/lib/cart-helpers';

export async function POST(req: NextRequest) {
  try {
    const { itemId, quantity, variantId } = await req.json();
    const token = await getToken();
    const cartId = await resolveCartId(token);

    await addToCart(cartId, itemId, quantity, variantId, token);
    const cart = await getCart(cartId, token);
    return NextResponse.json({ cart });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add to cart' }, { status: 400 });
  }
}
