import { NextRequest, NextResponse } from 'next/server';
import { updateCustomerAddress, deleteCustomerAddress } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const address = await updateCustomerAddress(id, body, token);
    return NextResponse.json({ address });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update address' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const { id } = await params;
    await deleteCustomerAddress(id, token);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete address' }, { status: 400 });
  }
}
