import { NextRequest, NextResponse } from 'next/server';
import { submitContactInquiry } from '@/lib/dristaService';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await req.json();
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email, subject and message are required' }, { status: 400 });
    }
    await submitContactInquiry({ name, email, phone, subject, message });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send your message' }, { status: 400 });
  }
}
