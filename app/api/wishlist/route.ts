import { NextRequest, NextResponse } from 'next/server';
import { getMyWishlist, addToWishlist } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function GET() {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const wishlist = await getMyWishlist(token);
    return NextResponse.json({ wishlist });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load wishlist' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in to save items' }, { status: 401 });

    const { itemId } = await req.json();
    await addToWishlist(itemId, token);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add to wishlist' }, { status: 400 });
  }
}
