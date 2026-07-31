import { NextRequest, NextResponse } from 'next/server';
import { createReturnRequest, getMyReturns } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function GET() {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const returns = await getMyReturns(token);
    return NextResponse.json({ returns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load return requests' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const body = await req.json();
    const request = await createReturnRequest(body, token);
    return NextResponse.json({ request });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit return/exchange request' }, { status: 400 });
  }
}
