import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkout } from '@/lib/dristaService';
import { getToken } from '@/lib/session';
import { resolveCart } from '@/lib/cart-helpers';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in to check out' }, { status: 401 });

    // resolveCart self-heals a missing/stale sanctum_cart_id cookie (e.g. left
    // over from before a tenant/backend switch, or a cart that's since expired)
    // by creating a fresh cart instead of misreporting "empty" for what's
    // actually just a broken cart reference.
    const { cartId, cart } = await resolveCart(token);
    if (!cart.items || cart.items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }

    const body = await req.json();
    const order = await checkout(cartId, body, token);

    // This cart is now 'converted' on the backend — drop the cookie so the next
    // add-to-cart starts a fresh one instead of reusing a closed-out cart.
    const store = await cookies();
    store.delete('sanctum_cart_id');

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 400 });
  }
}
