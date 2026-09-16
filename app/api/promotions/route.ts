import { NextResponse } from 'next/server';
import { getActivePromotions } from '@/lib/dristaService';

export async function GET() {
  try {
    const promotions = await getActivePromotions();
    return NextResponse.json({ promotions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load promotions' }, { status: 400 });
  }
}
