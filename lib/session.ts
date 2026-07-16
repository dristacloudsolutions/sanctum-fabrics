import { cookies } from 'next/headers';

// The backend's own /auth/login sets an httpOnly cookie directly, but that cookie
// is scoped to the *backend's* origin (a different domain/port from this
// storefront), so it never reaches the browser tab the customer is actually using.
// Instead, route handlers here call the backend server-to-server, pull the
// access_token out of the JSON response body, and re-issue it as our own
// storefront-domain cookie.
const TOKEN_COOKIE = 'sanctum_token';
const CART_COOKIE = 'sanctum_cart_id';

export async function getToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value;
}

export async function setToken(token: string) {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearToken() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}

export async function getCartId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value;
}

export async function setCartId(cartId: string) {
  const store = await cookies();
  store.set(CART_COOKIE, cartId, {
    httpOnly: false, // read by the client-side cart badge too — not sensitive
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}
