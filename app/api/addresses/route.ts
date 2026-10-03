import { NextRequest, NextResponse } from 'next/server';
import { getCustomerAddresses, createCustomerAddress } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function GET() {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const addresses = await getCustomerAddresses(token);
    return NextResponse.json({ addresses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load addresses' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const body = await req.json();
    const address = await createCustomerAddress(body, token);
    return NextResponse.json({ address });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save address' }, { status: 400 });
  }
}
