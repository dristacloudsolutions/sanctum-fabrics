import { NextResponse } from 'next/server';
import { getMe } from '@/lib/dristaService';
import { getToken } from '@/lib/session';

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ user: null });

  const profile = await getMe(token);
  if (!profile) return NextResponse.json({ user: null });
  return NextResponse.json({ user: profile });
}
