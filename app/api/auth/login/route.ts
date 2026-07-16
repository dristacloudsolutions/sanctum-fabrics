import { NextRequest, NextResponse } from 'next/server';
import { loginCustomer } from '@/lib/dristaService';
import { setToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await loginCustomer(body);
    await setToken(session.access_token);
    return NextResponse.json({ user: session.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 401 });
  }
}
