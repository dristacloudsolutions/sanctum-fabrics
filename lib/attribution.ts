import { cookies } from 'next/headers';

/** UTM tags of the shopper's last tagged visit (set by proxy.ts). */
export const ATTRIBUTION_COOKIE = 'sanctum_attr';
export const ATTRIBUTION_DAYS = 7;

export type Attribution = Partial<Record<'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_content' | 'utm_term' | 'landing_url' | 'landed_at' | 'referrer', string>>;

/** The shopper's attribution, if they arrived through a tagged link in the last 7 days. */
export async function readAttribution(): Promise<Attribution | undefined> {
  const raw = (await cookies()).get(ATTRIBUTION_COOKIE)?.value;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch {
    return undefined;
  }
}
