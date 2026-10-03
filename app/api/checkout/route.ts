import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkout } from '@/lib/dristaService';
import { getToken } from '@/lib/session';
import { resolveCart } from '@/lib/cart-helpers';

export async function POST(req: NextRequest) {
  try {
    // Authentication is required — orders cannot be placed without a logged-in customer account
    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Please sign in or register to place your order.' },
        { status: 401 }
      );
    }

    const { cartId, cart } = await resolveCart(token);
    if (!cart.items || cart.items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }

    const body = await req.json();
    const order = await checkout(cartId, body, token);

    // Only clear the cart cookie immediately if COD.
    // For online payments, keep the cart cookie intact until payment is verified,
    // so any gateway error or user cancellation does not wipe the user's cart.
    if (body.payment_method === 'cod') {
      const store = await cookies();
      store.delete('sanctum_cart_id');
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 400 });
  }
}
