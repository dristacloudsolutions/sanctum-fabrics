// Integration layer for drista-core-platform-backend's /ecommerce module.
// Mirrors the proven pattern already used in production by
// dulhan-beauty-parlour/lib/dristaService.ts — same headers, same base URL
// resolution, same graceful-empty-array-on-failure behaviour so the site
// never hard-crashes if the tenant/catalog isn't provisioned yet.

export type ProductImage = { url?: string; is_primary?: boolean; alt_text?: string };

export type Product = {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  selling_price?: number;
  base_price?: number;
  item_category?: 'goods' | 'service';
  is_active?: boolean;
  images?: ProductImage[];
  item_type?: { name?: string } | null;
  uom?: { name?: string } | null;
};

export type CategoryGroup = {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  image_url?: string;
  children?: CategoryGroup[];
};

export type TenantProfile = {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  email: string;
  phone?: string;
  emails: string[];
  contact_numbers: string[];
  contact_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    type: string;
  };
  settings?: {
    social?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
    };
  };
};

const DRISTA_API_BASE_URL = (
  process.env.DRISTA_API_BASE_URL ||
  process.env.NEXT_PUBLIC_DRISTA_API_BASE_URL ||
  'https://api.drista.in'
).replace(/\/+$/, '');
const DRISTA_API_KEY = process.env.DRISTA_API_KEY || process.env.NEXT_PUBLIC_DRISTA_API_KEY || '';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || '';

/** Transforms internal s3:// URLs into public HTTPS URLs — a safety net if the
 * backend fails to provide presigned URLs. */
export function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url.startsWith('s3://')) {
    const withoutProtocol = url.substring(5);
    const firstSlash = withoutProtocol.indexOf('/');
    if (firstSlash !== -1) {
      const bucket = withoutProtocol.substring(0, firstSlash);
      const key = withoutProtocol.substring(firstSlash + 1);
      return `https://${bucket}.s3.amazonaws.com/${key}`;
    }
  }
  return url;
}

async function dristaFetch(endpoint: string, options: RequestInit = {}) {
  if (!DRISTA_API_KEY || !TENANT_ID) {
    // Not provisioned yet — callers fall back to sample data instead of crashing.
    throw new Error('Drista backend not configured (missing API key or tenant id)');
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${DRISTA_API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': DRISTA_API_KEY,
    'tenant-id': TENANT_ID,
    ...(options.headers || {}),
  } as Record<string, string>;

  const response = await fetch(url, { ...options, headers, cache: 'no-store' });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `HTTP ${response.status}`);
  }
  return payload;
}

function withResolvedImages(product: Product): Product {
  return {
    ...product,
    images: product.images?.map((img) => ({ ...img, url: resolveImageUrl(img.url) })),
  };
}

/** All active products in the catalog. Returns [] (never throws) if the
 * tenant isn't configured yet or the request fails — callers should pair
 * this with a sample-data fallback while onboarding is in progress. */
export async function getProducts(): Promise<Product[]> {
  try {
    const payload = await dristaFetch('/v1/ecommerce/products');
    const items = (payload?.data || []) as Product[];
    return items.filter((i) => i.is_active !== false).map(withResolvedImages);
  } catch (error) {
    console.error('[dristaService] getProducts error:', error);
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const payload = await dristaFetch(`/v1/ecommerce/products/${id}`);
    const item = payload?.data as Product | undefined;
    return item ? withResolvedImages(item) : null;
  } catch (error) {
    console.error('[dristaService] getProduct error:', error);
    return null;
  }
}

export async function getCategoryHierarchy(): Promise<CategoryGroup[]> {
  try {
    const payload = await dristaFetch('/v1/ecommerce/groups/hierarchy');
    return (payload?.data || []) as CategoryGroup[];
  } catch (error) {
    console.error('[dristaService] getCategoryHierarchy error:', error);
    return [];
  }
}

export async function getTenantProfile(): Promise<TenantProfile | null> {
  try {
    const payload = await dristaFetch('/v1/tenants/profile');
    const profile = (payload?.data || null) as TenantProfile | null;
    if (profile?.logo_url) profile.logo_url = resolveImageUrl(profile.logo_url);
    return profile;
  } catch (error) {
    console.error('[dristaService] getTenantProfile error:', error);
    return null;
  }
}

export async function submitContactInquiry(data: Record<string, unknown>) {
  return dristaFetch('/v1/contact/submit', {
    method: 'POST',
    body: JSON.stringify({ ...data, inquiryType: (data.subject as string) || 'general' }),
  });
}

/** True once real DRISTA_API_KEY + NEXT_PUBLIC_TENANT_ID are set — lets pages
 * show a subtle "sample catalog" notice while the tenant is being onboarded. */
export const isDristaConfigured = Boolean(DRISTA_API_KEY && TENANT_ID);
