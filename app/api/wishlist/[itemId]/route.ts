import { NextRequest, NextResponse } from 'next/server';
import { removeFromWishlist } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const { itemId } = await params;
    await removeFromWishlist(itemId, token);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to remove from wishlist' }, { status: 400 });
  }
}
