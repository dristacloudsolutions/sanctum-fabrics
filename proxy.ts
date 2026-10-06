import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ATTRIBUTION_COOKIE, ATTRIBUTION_DAYS } from '@/lib/attribution';

// A shopper arriving from a social post (or any tagged link) carries UTM tags. They are kept
// for 7 days (the last tagged visit wins) and sent with the order at checkout, so the store's
// admin can see which post or campaign brought it.
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

export function proxy(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (!UTM_KEYS.some((k) => params.get(k))) return NextResponse.next();

  const tags: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) tags[k] = v.slice(0, 200);
  }
  tags.landing_url = `${request.nextUrl.origin}${request.nextUrl.pathname}`;
  tags.landed_at = new Date().toISOString();
  const referrer = request.headers.get('referer');
  if (referrer) tags.referrer = referrer.slice(0, 300);

  const response = NextResponse.next();
  response.cookies.set({
    name: ATTRIBUTION_COOKIE,
    value: JSON.stringify(tags),
    maxAge: ATTRIBUTION_DAYS * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}

export const config = {
  // Pages only — not API routes, Next internals or files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
