import { NextRequest, NextResponse } from 'next/server';
import { registerCustomer } from '@/lib/dristaService';
import { setToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await registerCustomer(body);
    await setToken(session.access_token);
    return NextResponse.json({ user: session.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 400 });
  }
}
