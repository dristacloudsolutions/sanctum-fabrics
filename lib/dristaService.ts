// Integration layer for drista-core-platform-backend's /ecommerce module.
// Mirrors the proven pattern already used in production by
// dulhan-beauty-parlour/lib/dristaService.ts — same headers, same base URL
// resolution, same graceful-empty-array-on-failure behaviour so the site
// never hard-crashes if the tenant/catalog isn't provisioned yet.

export type ProductImage = { url?: string; is_primary?: boolean; alt_text?: string };

export type ProductVideo = { url?: string; title?: string };

export type ProductVariant = {
  id: string;
  sku: string;
  attributes: Record<string, string | number>;
  selling_price: number;
  current_stock: number;
  is_active: boolean;
  image_url?: string;
};

export type Product = {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  sku?: string;
  item_code?: string;
  selling_price?: number;
  base_price?: number;
  current_stock?: number;
  maintain_stock?: boolean;
  item_category?: 'goods' | 'service';
  is_active?: boolean;
  sale_channel?: 'online' | 'offline' | 'both';
  preorder_enabled?: boolean;
  images?: ProductImage[];
  videos?: ProductVideo[];
  item_type?: { name?: string } | null;
  uom?: { name?: string } | null;
  variants?: ProductVariant[];
};

export type CartLineItem = {
  id: string;
  item_id: string;
  variant_id?: string;
  quantity: number;
  item?: { id: string; name: string; selling_price: number; sku?: string; slug?: string };
  variant?: { id: string; sku: string; attributes: Record<string, any>; selling_price: number; image_url?: string };
};

export type Cart = {
  id: string;
  status: string;
  items: CartLineItem[];
};

export type CouponPreview = {
  valid: boolean;
  promotion_id: string;
  code?: string;
  name: string;
  eligible_subtotal: number;
  discount_amount: number;
};

export type SalesOrder = {
  id: string;
  so_number: string;
  order_date?: string;
  created_at?: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_status: string;
  payment_method?: 'online' | 'cod';
  status: string;
  fulfillment_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_cost?: number;
  customer?: { id: string; name: string; email?: string; phone?: string };
};

export type OrderLineItem = {
  id: string;
  quantity: number;
  rate: number;
  amount: number;
  item?: { id: string; name: string; slug?: string };
  variant?: { id: string; sku: string; attributes: Record<string, any>; image_url?: string };
};

export type FulfillmentHistoryEntry = {
  from_status: string;
  to_status: string;
  note?: string;
  created_at: string;
};

export type OrderDetail = SalesOrder & {
  shipping_address?: Record<string, unknown>;
  items: OrderLineItem[];
  courier_name?: string;
  tracking_number?: string;
  awb_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  fulfillment_history?: FulfillmentHistoryEntry[];
};

export type CustomerSession = {
  access_token: string;
  refresh_token?: string;
  user: { id: string; first_name: string; last_name: string; email: string | null; phone?: string; role: string; customer_id?: string };
  is_new?: boolean;
};

export type Promotion = {
  id: string;
  code?: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  end_date: string;
  image_url?: string;
};

export type CategoryGroup = {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  image_url?: string;
  description?: string;
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
// TEMPORARY: hardcoded fallbacks while Amplify env vars aren't reaching the
// SSR compute in production. Env var still wins if present — remove these
// fallbacks once the Amplify env var issue is resolved.
const DRISTA_API_KEY =
  process.env.DRISTA_API_KEY ||
  process.env.NEXT_PUBLIC_DRISTA_API_KEY ||
  'dr_live_pk_465f2737_6e54f434b85b9933d015626baf04413d44338bdb';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'e467e2f9-334e-4a90-8d12-d85ac7554fa3';

/** Product detail URL — prefers the item_code (checked for uniqueness on
 * every create/update on the backend), then the slug (which a bulk import or
 * seed script has in the past produced duplicates of — two items sharing a
 * slug made the details page non-deterministically open the wrong one),
 * falling back to the raw id as a last resort. When `variantId` is given
 * (e.g. the variant whose photo was shown on a product card), it's carried
 * through as a query param so the details page opens on that same variant
 * instead of defaulting to none/first. */
export function productUrl(product: Pick<Product, 'id' | 'slug' | 'item_code'>, variantId?: string): string {
  const base = `/products/${product.item_code || product.slug || product.id}`;
  return variantId ? `${base}?variant=${encodeURIComponent(variantId)}` : base;
}

export type AttributeFacetValue = { value: string; count: number; hex?: string };
export type AttributeFacet = { key: string; label: string; values: AttributeFacetValue[] };

/** `color_family` → `Color Family`. */
function humanizeAttributeKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Attribute keys are admin-entered free text, so "Color" on one variant and
 * "color" (or trailing-space "Color ") on another are meant to be the same
 * attribute but land as distinct object keys. Every lookup/grouping over
 * variant attributes should go through this instead of exact-key access —
 * a case-sensitive lookup was silently excluding products from a color
 * filter, and splitting one "Color" facet into two, whenever a catalog had
 * that casing inconsistency. */
export function getVariantAttribute(variant: ProductVariant, key: string): string | number | undefined {
  const target = key.trim().toLowerCase();
  const entry = Object.entries(variant.attributes || {}).find(([k]) => k.trim().toLowerCase() === target);
  return entry?.[1];
}

/** One card's worth of product to render — either a whole product (no color
 * variants to split by) or one specific color of a product. */
export type ProductCardEntry = { product: Product; variant?: ProductVariant; colorLabel?: string };

/** The client wants every "product name + color" combination shown as its
 * own card, not one card per product with all its colors hidden behind a
 * hover carousel — e.g. a saree in Teal Green and Brick Red becomes two
 * separate cards, "Banarasi Silk Saree - Teal Green" and "... - Brick Red".
 * A product with no color attribute (or no active/photographed variants)
 * still renders as a single card, unchanged. */
export function expandProductsByColor(products: Product[]): ProductCardEntry[] {
  const entries: ProductCardEntry[] = [];
  for (const product of products) {
    const variants = (product.variants || []).filter((v) => v.is_active);
    const colorKey = variants
      .flatMap((v) => Object.keys(v.attributes || {}))
      .find((k) => k.trim().toLowerCase() === 'color');

    if (!colorKey || variants.length === 0) {
      entries.push({ product });
      continue;
    }

    // One representative variant per distinct color (case-insensitive, same
    // as the color filter/facets) — prefers whichever variant of that color
    // actually has its own photo.
    const byColor = new Map<string, ProductVariant>();
    for (const variant of variants) {
      const colorValue = getVariantAttribute(variant, colorKey);
      if (colorValue === undefined || colorValue === null || colorValue === '') continue;
      const key = String(colorValue).trim().toLowerCase();
      const existing = byColor.get(key);
      if (!existing || (!existing.image_url && variant.image_url)) {
        byColor.set(key, variant);
      }
    }

    if (byColor.size === 0) {
      entries.push({ product });
      continue;
    }
    for (const variant of byColor.values()) {
      const colorLabel = String(getVariantAttribute(variant, colorKey));
      entries.push({ product, variant, colorLabel });
    }
  }
  return entries;
}

/** Derives the "Color", "Size", "Material", etc. filter groups straight from
 * whatever keys actually appear in this catalog's variant attributes —
 * nothing hardcoded, so a group only shows up if real products have it, and
 * disappears on its own once they don't. Each value carries how many
 * distinct products offer it (like "Pink (52380)"), and — for color-style
 * attributes — the swatch hex to render next to it, either the admin's own
 * "<Key> Hex" companion value or a lookup by color name. */
export function buildAttributeFacets(products: Product[]): AttributeFacet[] {
  type ValueInfo = { productIds: Set<string>; hex?: string };
  // Lowercased key -> { canonical display-casing key, per-value info }
  const seen = new Map<string, { canonicalKey: string; valueInfo: Map<string, ValueInfo> }>();
  for (const product of products) {
    for (const variant of product.variants || []) {
      for (const [rawKey, value] of Object.entries(variant.attributes || {})) {
        const key = rawKey.trim();
        // "<Key> Hex" (e.g. "Color Hex") is a paired swatch value the admin's
        // color picker writes alongside a color name — not a real filterable
        // attribute on its own.
        if (key.toLowerCase().endsWith(' hex')) continue;
        if (value === undefined || value === null || value === '') continue;
        const lower = key.toLowerCase();
        if (!seen.has(lower)) seen.set(lower, { canonicalKey: key, valueInfo: new Map() });
        const group = seen.get(lower)!;
        const strValue = String(value);
        if (!group.valueInfo.has(strValue)) group.valueInfo.set(strValue, { productIds: new Set() });
        const info = group.valueInfo.get(strValue)!;
        info.productIds.add(product.id);
        if (!info.hex) {
          const hexValue = getVariantAttribute(variant, `${key} Hex`);
          if (typeof hexValue === 'string' && hexValue) info.hex = hexValue;
        }
      }
    }
  }
  return Array.from(seen.values())
    .map(({ canonicalKey, valueInfo }) => ({
      key: canonicalKey,
      label: humanizeAttributeKey(canonicalKey),
      values: Array.from(valueInfo.entries())
        .map(([value, info]) => ({ value, count: info.productIds.size, hex: info.hex }))
        // Most-available color/size first, like the reference "Pink (52380)"
        // list — falls back to alphabetical for a tied count.
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Transforms internal s3:// URLs into public HTTPS URLs — a safety net if the
 * backend fails to provide presigned URLs. Also guards against a scheme-less
 * CDN/bucket hostname (e.g. "d3w26h1x5xxse5.cloudfront.net/key" with no
 * "https://") slipping through from a misconfigured CDN_DOMAIN env var on
 * the backend — without this, `next/image` and <img> silently fail to load
 * it since it looks like a relative path, not an absolute URL. */
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
    return url;
  }
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    return `https://${url}`;
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
    videos: product.videos?.map((vid) => ({ ...vid, url: resolveImageUrl(vid.url) })),
    // Variant photos go through the same CDN/s3:// resolver as product images
    // — this was missing, so a variant's raw storage path never loaded as an
    // <img src> on the product card or gallery, only on cart line items
    // (which already resolve it elsewhere in this file).
    variants: product.variants?.map((v) => ({ ...v, image_url: resolveImageUrl(v.image_url) })),
  };
}

export type ProductFilters = {
  q?: string;
  category_id?: string;
  min_price?: string;
  max_price?: string;
};

/** All active products in the catalog, optionally filtered. Returns [] (never
 * throws) if the tenant isn't configured yet or the request fails — callers
 * should pair this with a sample-data fallback while onboarding is in
 * progress. Omitting page/limit intentionally keeps this endpoint
 * unpaginated — the catalog page renders the full filtered result set. */
export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  try {
    const qs = new URLSearchParams();
    if (filters.q) qs.set('q', filters.q);
    if (filters.category_id) qs.set('category_id', filters.category_id);
    if (filters.min_price) qs.set('min_price', filters.min_price);
    if (filters.max_price) qs.set('max_price', filters.max_price);
    const query = qs.toString();
    const payload = await dristaFetch(`/v1/ecommerce/products${query ? `?${query}` : ''}`);
    const items = (payload?.data || []) as Product[];
    return items
      .filter((i) => i.is_active !== false && i.sale_channel !== 'offline')
      .map(withResolvedImages);
  } catch (error) {
    console.error('[dristaService] getProducts error:', error);
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const payload = await dristaFetch(`/v1/ecommerce/products/${id}`);
    const item = payload?.data as Product | undefined;
    if (!item || item.is_active === false || item.sale_channel === 'offline') return null;
    return withResolvedImages(item);
  } catch (error) {
    console.error('[dristaService] getProduct error:', error);
    return null;
  }
}

export async function getActivePromotions(): Promise<Promotion[]> {
  try {
    const payload = await dristaFetch('/v1/ecommerce/promotions/active');
    return (payload?.data || []) as Promotion[];
  } catch (error) {
    console.error('[dristaService] getActivePromotions error:', error);
    return [];
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

// ─── Cart / Auth / Checkout / Payment ──────────────────────────────────────────
// Unlike the read helpers above, these never swallow errors into an empty/null
// fallback — callers (the Next.js route handlers under app/api/, which are the
// only place these should ever be called from, since DRISTA_API_KEY is
// server-only) need the real error message to show the customer ("insufficient
// stock", "invalid coupon", ...).
async function dristaAction(endpoint: string, options: RequestInit & { token?: string } = {}) {
  if (!DRISTA_API_KEY || !TENANT_ID) {
    throw new Error('Store is not configured yet — please try again later.');
  }
  const { token, ...rest } = options;
  const url = `${DRISTA_API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': DRISTA_API_KEY,
    'tenant-id': TENANT_ID,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers as Record<string, string> | undefined),
  };
  const response = await fetch(url, { ...rest, headers, cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `HTTP ${response.status}`);
  }
  return payload;
}

export async function registerCustomer(data: {
  first_name: string; last_name: string; phone: string; password: string; email?: string;
}): Promise<CustomerSession> {
  const payload = await dristaAction('/v1/ecommerce/auth/register', { method: 'POST', body: JSON.stringify(data) });
  return payload.data as CustomerSession;
}

// Accepts either identifier — phone is now the primary way customers sign in,
// but existing accounts (or ones that did set an email) can still use email.
export async function loginCustomer(data: { phone?: string; email?: string; password: string }): Promise<CustomerSession> {
  const payload = await dristaAction('/v1/auth/login', { method: 'POST', body: JSON.stringify(data) });
  return payload.data as CustomerSession;
}

export async function requestCustomerOtp(phone: string): Promise<{ is_registered: boolean; phone: string }> {
  const payload = await dristaAction('/v1/ecommerce/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
  return payload.data as { is_registered: boolean; phone: string };
}

export async function verifyCustomerOtp(data: {
  phone: string;
  otp: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}): Promise<CustomerSession> {
  const payload = await dristaAction('/v1/ecommerce/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return payload.data as CustomerSession;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await dristaAction('/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function submitPasswordReset(token: string, password: string): Promise<void> {
  await dristaAction('/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export type CustomerProfile = { id: string; first_name: string; last_name: string; email?: string; phone?: string; role: string };

export async function getMe(token: string): Promise<CustomerProfile | null> {
  try {
    const payload = await dristaAction('/v1/auth/me?compact=true', { token });
    return payload.data as CustomerProfile;
  } catch {
    return null;
  }
}

export async function getOrCreateCart(token?: string): Promise<{ id: string }> {
  const payload = await dristaAction('/v1/ecommerce/cart', { token });
  return payload.data as { id: string };
}

export type AddressDetails = {
  name?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone?: string;
  lat?: number;
  lng?: number;
};

export type CustomerAddress = {
  id: string;
  address_type: 'Home' | 'Work' | 'Other';
  is_default: boolean;
  details: AddressDetails;
  created_at?: string;
};

export async function getCustomerAddresses(token: string): Promise<CustomerAddress[]> {
  const payload = await dristaAction('/v1/ecommerce/addresses', { token });
  return (payload?.data || []) as CustomerAddress[];
}

export async function createCustomerAddress(
  data: { address_type: string; is_default?: boolean; details: AddressDetails },
  token: string
): Promise<CustomerAddress> {
  const payload = await dristaAction('/v1/ecommerce/addresses', { method: 'POST', body: JSON.stringify(data), token });
  return payload.data as CustomerAddress;
}

export async function updateCustomerAddress(
  id: string,
  data: Partial<{ address_type: string; is_default: boolean; details: AddressDetails }>,
  token: string
): Promise<CustomerAddress> {
  const payload = await dristaAction(`/v1/ecommerce/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data), token });
  return payload.data as CustomerAddress;
}

export async function deleteCustomerAddress(id: string, token: string): Promise<void> {
  await dristaAction(`/v1/ecommerce/addresses/${id}`, { method: 'DELETE', token });
}

// Returns null (rather than throwing) when the cart id doesn't resolve to a real
// cart — e.g. a stale sanctum_cart_id cookie left over from a cart that no longer
// exists. Callers should treat null as "start a new cart", not as an error.
export async function getCart(cartId: string, token?: string): Promise<Cart | null> {
  const payload = await dristaAction(`/v1/ecommerce/cart/${cartId}`, { token });
  const cart = payload.data as Cart | null;
  if (!cart) return null;
  for (const item of cart.items || []) {
    if (item.variant?.image_url) item.variant.image_url = resolveImageUrl(item.variant.image_url);
  }
  return cart;
}

export async function addToCart(cartId: string, itemId: string, quantity: number, variantId?: string, token?: string) {
  const payload = await dristaAction(`/v1/ecommerce/cart/${cartId}/items`, {
    method: 'POST',
    body: JSON.stringify({ itemId, quantity, variantId }),
    token,
  });
  return payload.data;
}

export async function updateCartItemQuantity(cartId: string, itemId: string, quantity: number, variantId?: string, token?: string): Promise<Cart | null> {
  const payload = await dristaAction(`/v1/ecommerce/cart/${cartId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity, variantId }),
    token,
  });
  const cart = payload.data as Cart | null;
  if (!cart) return null;
  for (const item of cart.items || []) {
    if (item.variant?.image_url) item.variant.image_url = resolveImageUrl(item.variant.image_url);
  }
  return cart;
}

export async function removeCartItem(cartId: string, itemId: string, variantId?: string, token?: string): Promise<Cart | null> {
  const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
  const payload = await dristaAction(`/v1/ecommerce/cart/${cartId}/items/${itemId}${qs}`, { method: 'DELETE', token });
  const cart = payload.data as Cart | null;
  if (!cart) return null;
  for (const item of cart.items || []) {
    if (item.variant?.image_url) item.variant.image_url = resolveImageUrl(item.variant.image_url);
  }
  return cart;
}

export async function validateCoupon(cartId: string, code: string, token?: string): Promise<CouponPreview> {
  const payload = await dristaAction(`/v1/ecommerce/cart/${cartId}/validate-coupon`, {
    method: 'POST',
    body: JSON.stringify({ code }),
    token,
  });
  return payload.data as CouponPreview;
}

export async function checkout(
  cartId: string,
  data: {
    shipping_address: Record<string, unknown>; coupon_code?: string; shipping_option_id?: string;
    gstin?: string; payment_method?: 'online' | 'cod';
    // Guest checkout only — ignored by the backend when a token identifies a
    // logged-in customer instead.
    guest_name?: string; guest_email?: string; guest_phone?: string;
  },
  token?: string
): Promise<SalesOrder> {
  const payload = await dristaAction('/v1/ecommerce/checkout', {
    method: 'POST',
    body: JSON.stringify({ cartId, ...data }),
    token,
  });
  return payload.data as SalesOrder;
}

export async function initiatePayment(orderId: string, token?: string): Promise<{
  order_id: string; razorpay_order_id: string; amount: number; currency: string; key_id: string;
}> {
  const payload = await dristaAction('/v1/ecommerce/payment/initiate', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
    token,
  });
  return payload.data;
}

export async function verifyPayment(
  data: { orderId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
  token?: string
): Promise<SalesOrder> {
  const payload = await dristaAction('/v1/ecommerce/payment/verify', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
  return payload.data as SalesOrder;
}

export async function getMyOrders(token: string): Promise<SalesOrder[]> {
  const payload = await dristaAction('/v1/ecommerce/orders/mine', { token });
  return (payload.data || []) as SalesOrder[];
}

export async function getMyOrderDetails(orderId: string, token: string): Promise<OrderDetail> {
  const payload = await dristaAction(`/v1/ecommerce/orders/mine/${orderId}`, { token });
  const order = payload.data as OrderDetail;
  for (const item of order.items || []) {
    if (item.variant?.image_url) item.variant.image_url = resolveImageUrl(item.variant.image_url);
  }
  return order;
}

export type ReturnRequest = {
  id: string;
  sales_order_id: string;
  sales_order_item_id: string;
  request_type: 'return' | 'exchange';
  reason: string;
  reason_notes?: string;
  quantity: number;
  exchange_variant_id?: string;
  status: 'requested' | 'approved' | 'rejected' | 'pickup_scheduled' | 'received' | 'refunded' | 'exchanged' | 'cancelled';
  refund_amount?: number;
  admin_notes?: string;
  images: string[];
  created_at?: string;
};

export async function createReturnRequest(data: {
  sales_order_id: string;
  sales_order_item_id: string;
  request_type: 'return' | 'exchange';
  reason: string;
  reason_notes?: string;
  quantity: number;
  exchange_variant_id?: string;
}, token: string): Promise<ReturnRequest> {
  const payload = await dristaAction('/v1/ecommerce/returns', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
  return payload.data as ReturnRequest;
}

export async function getMyReturns(token: string): Promise<ReturnRequest[]> {
  const payload = await dristaAction('/v1/ecommerce/returns/mine', { token });
  return (payload.data || []) as ReturnRequest[];
}

export type WishlistEntry = {
  id: string;
  item_id: string;
  item?: Product;
};

export async function getMyWishlist(token: string): Promise<WishlistEntry[]> {
  const payload = await dristaAction('/v1/ecommerce/wishlist/mine', { token });
  const entries = (payload.data || []) as WishlistEntry[];
  for (const entry of entries) {
    if (entry.item) entry.item = withResolvedImages(entry.item);
  }
  return entries;
}

export async function addToWishlist(itemId: string, token: string) {
  const payload = await dristaAction('/v1/ecommerce/wishlist', { method: 'POST', body: JSON.stringify({ itemId }), token });
  return payload.data;
}

export async function removeFromWishlist(itemId: string, token: string) {
  await dristaAction(`/v1/ecommerce/wishlist/${itemId}`, { method: 'DELETE', token });
}

export type ShippingOption = {
  optionId: string;
  type: 'self_delivery' | 'shiprocket';
  label: string;
  rate: number;
  etaDays?: number;
};

// Preview only — checkout always recomputes the chosen option itself
// server-side from the actual delivery address, so this is purely for
// showing the customer their available delivery methods before they commit.
// Deliberately not wrapped in try/catch here — the storefront should decide
// whether "no options available" is worth surfacing.
export async function listShippingOptions(cartId: string, pincode: string, token?: string): Promise<ShippingOption[]> {
  const payload = await dristaAction('/v1/ecommerce/shipping/estimate', {
    method: 'POST',
    body: JSON.stringify({ cartId, pincode }),
    token,
  });
  return (payload.data || []) as ShippingOption[];
}
