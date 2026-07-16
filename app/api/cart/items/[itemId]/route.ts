import { NextRequest, NextResponse } from 'next/server';
import { updateCartItemQuantity, removeCartItem } from '@/lib/dristaService';
import { getToken, getCartId } from '@/lib/session';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const cartId = await getCartId();
    if (!cartId) return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });

    const { quantity, variantId } = await req.json();
    const token = await getToken();
    const cart = await updateCartItemQuantity(cartId, itemId, quantity, variantId, token);
    if (!cart) return NextResponse.json({ error: 'Your cart could not be found — please refresh.' }, { status: 400 });
    return NextResponse.json({ cart });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update item' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const cartId = await getCartId();
    if (!cartId) return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });

    const variantId = req.nextUrl.searchParams.get('variantId') || undefined;
    const token = await getToken();
    const cart = await removeCartItem(cartId, itemId, variantId, token);
    if (!cart) return NextResponse.json({ error: 'Your cart could not be found — please refresh.' }, { status: 400 });
    return NextResponse.json({ cart });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to remove item' }, { status: 400 });
  }
}
