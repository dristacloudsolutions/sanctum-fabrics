// Integration layer for drista-core-platform-backend's /ecommerce module.
// Mirrors the proven pattern already used in production by
// dulhan-beauty-parlour/lib/dristaService.ts — same headers, same base URL
// resolution, same graceful-empty-array-on-failure behaviour so the site
// never hard-crashes if the tenant/catalog isn't provisioned yet.

export type ProductImage = { url?: string; is_primary?: boolean; alt_text?: string };

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
  name: string;
  description?: string;
  sku?: string;
  selling_price?: number;
  base_price?: number;
  current_stock?: number;
  maintain_stock?: boolean;
  item_category?: 'goods' | 'service';
  is_active?: boolean;
  images?: ProductImage[];
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
  status: string;
  fulfillment_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
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
  user: { id: string; first_name: string; last_name: string; email: string; role: string; customer_id?: string };
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
  first_name: string; last_name: string; email: string; password: string; phone?: string;
}): Promise<CustomerSession> {
  const payload = await dristaAction('/v1/ecommerce/auth/register', { method: 'POST', body: JSON.stringify(data) });
  return payload.data as CustomerSession;
}

export async function loginCustomer(data: { email: string; password: string }): Promise<CustomerSession> {
  const payload = await dristaAction('/v1/auth/login', { method: 'POST', body: JSON.stringify(data) });
  return payload.data as CustomerSession;
}

export type CustomerProfile = { id: string; first_name: string; last_name: string; email: string; phone?: string; role: string };

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
  data: { shipping_address: Record<string, unknown>; coupon_code?: string; shipping_option_id?: string; gstin?: string },
  token: string
): Promise<SalesOrder> {
  const payload = await dristaAction('/v1/ecommerce/checkout', {
    method: 'POST',
    body: JSON.stringify({ cartId, ...data }),
    token,
  });
  return payload.data as SalesOrder;
}

export async function initiatePayment(orderId: string, token: string): Promise<{
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
  token: string
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
