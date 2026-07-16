import { getOrCreateCart, getCart, Cart } from './dristaService';
import { getCartId, setCartId } from './session';

// Resolves a guaranteed-valid cart id for the current request, self-healing a
// stale sanctum_cart_id cookie (e.g. left over from a cart that was later
// deleted/expired on the backend) by creating a fresh cart instead of crashing.
export async function resolveCartId(token?: string): Promise<string> {
  const existingId = await getCartId();
  if (existingId) {
    const cart = await getCart(existingId, token);
    if (cart) return existingId;
  }
  const created = await getOrCreateCart(token);
  await setCartId(created.id);
  return created.id;
}

// Same self-healing, but also returns the cart contents — for handlers that
// need both the id and the current state.
export async function resolveCart(token?: string): Promise<{ cartId: string; cart: Cart }> {
  const existingId = await getCartId();
  if (existingId) {
    const cart = await getCart(existingId, token);
    if (cart) return { cartId: existingId, cart };
  }
  const created = await getOrCreateCart(token);
  await setCartId(created.id);
  const cart = await getCart(created.id, token);
  // A cart we just created should always resolve — but guard anyway rather than
  // asserting, since this is talking to a remote service.
  if (!cart) throw new Error('Could not create a cart — please try again.');
  return { cartId: created.id, cart };
}
