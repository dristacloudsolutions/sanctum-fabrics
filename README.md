# Sanctum Fabrics — Storefront

A lightweight Next.js storefront for Sanctum Fabrics: browse the catalog, order
via WhatsApp. Built to sit in front of `drista-core-platform-backend`'s
existing `/ecommerce` module (product catalog, categories) — no cart/checkout
yet by design; see "Why no cart" below.

## Status: running on sample data

Nothing here is wired to a live tenant yet. `lib/dristaService.ts` calls the
real backend, but until `.env.local` has real credentials it always returns
an empty catalog, and every page falls back to `lib/sampleProducts.ts` (fake
products with SVG swatch placeholders, clearly labeled "Sample catalog shown"
in the UI).

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Cutting over to the real catalog

1. Onboard Sanctum Fabrics as a tenant on `drista-core-platform-backend`
   (or reuse an existing one) and get its `tenant_id` + an API key with
   access to `/ecommerce/*`.
2. Enter her real products into the Item Master (name, price, images —
   `ItemMaster` + `ItemImage` models) so `GET /ecommerce/products` returns
   real data.
3. Copy `.env.local.example` to `.env.local` and fill in
   `DRISTA_API_KEY` / `NEXT_PUBLIC_TENANT_ID`.
4. Restart the dev server. `getProducts()` will now return real items, the
   "Sample catalog shown" notice disappears, and every page (home, catalog,
   product detail) switches over automatically — no code changes needed.
5. Replace the placeholder business details in `app/config/config.ts`
   (search for `TODO`) — real phone/WhatsApp number, address, Instagram
   handle.

## Why no cart/checkout yet

The backend's `/ecommerce/checkout` endpoint exists but has no payment
gateway wired into it yet (Razorpay integration would need to be built).
Rather than block launch on that, this site uses a **WhatsApp-order** flow:
every product has an "Order on WhatsApp" button that opens a pre-filled
message (product name + price) to her WhatsApp number. This gets her selling
from day one; a real cart + Razorpay checkout can be layered in later against
the same backend models once order volume justifies the extra engineering.

## Structure

- `lib/dristaService.ts` — API client for the backend's `/ecommerce` and
  `/tenants/profile` endpoints. Mirrors the pattern already proven in
  `dulhan-beauty-parlour/lib/dristaService.ts`.
- `lib/sampleProducts.ts` — placeholder catalog, same shape as the real API.
- `lib/whatsapp.ts` — builds `wa.me` links with pre-filled order messages.
- `app/config/config.ts` — business info, palette, SEO. Edit this first.
- `app/products/`, `app/products/[id]/` — catalog grid and product detail.
- `app/contact/` — WhatsApp/phone/address contact page.
# sanctum-fabrics
