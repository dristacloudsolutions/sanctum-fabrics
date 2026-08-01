import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    hasDristaApiKey: Boolean(process.env.DRISTA_API_KEY),
    hasNextPublicDristaApiKey: Boolean(process.env.NEXT_PUBLIC_DRISTA_API_KEY),
    hasTenantId: Boolean(process.env.NEXT_PUBLIC_TENANT_ID),
    apiKeyPrefix: (process.env.DRISTA_API_KEY || '').slice(0, 19) || null,
    tenantIdPrefix: (process.env.NEXT_PUBLIC_TENANT_ID || '').slice(0, 8) || null,
    nodeEnv: process.env.NODE_ENV,
  });
}
