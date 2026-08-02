import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MessageCircle, Truck, ShieldCheck, RotateCcw, BadgeCheck, Gem, Sparkles, HeartHandshake } from 'lucide-react';
import ProductCard from './components/ProductCard';
import ProductCarousel from './components/ProductCarousel';
import Reveal from './components/Reveal';
import config from './config/config';
import { getProducts, getCategoryHierarchy } from '@/lib/dristaService';
import { sampleProducts } from '@/lib/sampleProducts';
import { buildWhatsAppLink } from '@/lib/whatsapp';

const FEATURES = [
  { icon: Sparkles, label: 'South Indian Traditions', sub: 'Authentic styles inspired by rich heritage' },
  { icon: BadgeCheck, label: 'Authentic Handloom', sub: 'Sourced from artisan clusters' },
  { icon: Gem, label: 'Exclusive Collections', sub: 'Handpicked designs, just for you' },
  { icon: HeartHandshake, label: 'Customer First', sub: 'Personalised service you can trust' },
  { icon: ShieldCheck, label: 'Secure Payments', sub: 'UPI, Cards & Net Banking' },
  { icon: Truck, label: 'Timely Delivery', sub: 'Pan-India, 4–7 business days' },
];

// Grounded in the real description already in config.ts (handloom sarees,
// natural-dye fabrics, hand block-printed textiles) rather than invented specialities.
const SPECIALITIES = [
  { icon: Gem, label: 'Kanjivaram Silks', sub: 'Rich weaves, timeless beauty' },
  { icon: RotateCcw, label: 'Natural Dyes', sub: 'Earth-toned, chemical-free colour' },
  { icon: Sparkles, label: 'Block Print Artistry', sub: 'Hand-printed, one motif at a time' },
  { icon: BadgeCheck, label: 'Handloom Craftsmanship', sub: 'Woven with care, made to last' },
];

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [liveProducts, categories] = await Promise.all([getProducts(), getCategoryHierarchy()]);
  const products = liveProducts.length > 0 ? liveProducts : sampleProducts;
  const featured = products.slice(0, 4);
  const newArrivals = products.slice(0, 6);
  const usingSample = liveProducts.length === 0;
  const topCategories = categories.slice(0, 3);

  // Real product photos, not placeholders — falls back to a decorative
  // treatment only if the catalog genuinely has no images yet.
  const heroProduct = featured[0];
  const heroImage = heroProduct?.images?.find((i) => i.is_primary) || heroProduct?.images?.[0];
  const specialityProduct = products[1] || products[0];
  const specialityImage = specialityProduct?.images?.find((i) => i.is_primary) || specialityProduct?.images?.[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[color:var(--border)] bg-[color:var(--cream)]">
        {/* Decorative motif — abstract, not a stock photo */}
        <svg
          className="pointer-events-none absolute -left-24 top-0 h-full w-[420px] text-[color:var(--primary)]/[0.05]"
          viewBox="0 0 200 400"
          fill="none"
          aria-hidden
        >
          <path d="M100 0 L160 120 L160 400 L40 400 L40 120 Z" fill="currentColor" />
          <circle cx="100" cy="60" r="30" fill="currentColor" />
        </svg>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:py-28">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              Handloom &amp; Artisan Textiles
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-[color:var(--ink)] md:text-5xl">
              {config.business.tagline}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[color:var(--ink)]/70">
              {config.business.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Shop the Collection <ArrowRight size={16} />
              </Link>
              <a
                href={buildWhatsAppLink("Hi Sanctum Fabrics, I'd like to know more about your collection.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-[color:var(--primary)] transition-colors hover:bg-[color:var(--primary)] hover:text-white"
              >
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[color:var(--primary)] to-[#1a2340] shadow-xl">
              {heroImage?.url ? (
                <Image src={heroImage.url} alt={heroProduct?.name || 'Sanctum Fabrics'} fill unoptimized priority className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center">
                  <p className="font-serif text-2xl text-[#e8c88a]/90">
                    Every weave tells
                    <br />a story
                  </p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Shop by category */}
      {topCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="mb-2 text-center font-serif text-2xl text-[color:var(--ink)] md:text-3xl">Shop by Category</h2>
            <div className="mx-auto mb-8 h-0.5 w-12 bg-[color:var(--accent)]" />
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {topCategories.map((cat, i) => (
              <Reveal key={cat.id} delay={i * 0.1}>
                <Link
                  href={`/products?category=${cat.id}`}
                  className="group block overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--cream)] transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-[color:var(--primary)]/10 to-[color:var(--accent)]/10">
                    {cat.image_url ? (
                      <Image src={cat.image_url} alt={cat.name} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-serif text-3xl text-[color:var(--primary)]/40">
                        {cat.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="font-serif text-lg text-[color:var(--ink)]">{cat.name}</p>
                    <p className="mt-1 text-sm font-semibold text-[color:var(--accent)]">Explore {cat.name} →</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Feature strip */}
      <section className="border-y border-[color:var(--border)] bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-12 sm:grid-cols-3 lg:grid-cols-6">
          {FEATURES.map(({ icon: Icon, label, sub }, i) => (
            <Reveal key={label} delay={i * 0.06}>
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--accent)]/30 text-[color:var(--accent)]">
                  <Icon size={22} />
                </div>
                <p className="text-sm font-semibold text-[color:var(--ink)]">{label}</p>
                <p className="mt-1 text-xs leading-snug text-[color:var(--ink)]/50">{sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <h2 className="mb-2 text-center font-serif text-2xl text-[color:var(--ink)] md:text-3xl">New Arrivals</h2>
          <div className="mx-auto mb-8 h-0.5 w-12 bg-[color:var(--accent)]" />
        </Reveal>
        <Reveal delay={0.1}>
          <ProductCarousel products={newArrivals} />
        </Reveal>
      </section>

      {/* Specialities & Traditions of South India */}
      <section id="story" className="border-y border-[color:var(--border)] bg-[color:var(--cream)] scroll-mt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg">
              {specialityImage?.url ? (
                <Image src={specialityImage.url} alt={specialityProduct?.name || 'Sanctum Fabrics'} fill unoptimized className="object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[color:var(--primary)] to-[#1a2340]" />
              )}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">Our Story</p>
            <h2 className="mt-3 font-serif text-2xl text-[color:var(--ink)] md:text-3xl">
              The Specialities &amp; Traditions of <span className="text-[color:var(--accent)]">South India</span>
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-5">
              {SPECIALITIES.map(({ icon: Icon, label, sub }) => (
                <div key={label}>
                  <Icon size={20} className="text-[color:var(--accent)]" />
                  <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">{label}</p>
                  <p className="mt-0.5 text-xs leading-snug text-[color:var(--ink)]/50">{sub}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 leading-relaxed text-[color:var(--ink)]/70">
              Rooted deeply in South Indian tradition, Sanctum is a celebration of heritage, grace, and timeless
              ethnic beauty — sourced directly from artisan clusters and woven with intention.
            </p>

            <a
              href={buildWhatsAppLink("Hi Sanctum Fabrics, I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle size={16} /> Order on WhatsApp
            </a>
          </Reveal>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl text-[color:var(--ink)] md:text-3xl">Featured Pieces</h2>
              {usingSample && (
                <p className="mt-1 text-xs text-[color:var(--ink)]/40">
                  Sample catalog shown — connect the live catalog in lib/dristaService.ts once onboarded.
                </p>
              )}
            </div>
            <Link href="/products" className="text-sm font-semibold text-[color:var(--accent)] hover:underline">
              View all →
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {featured.map((product, i) => (
            <Reveal key={product.id} delay={Math.min(i, 4) * 0.08}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* WhatsApp signup banner */}
      <section className="border-t border-[color:var(--border)] bg-[color:var(--primary)]">
        <Reveal>
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-12 text-center md:flex-row md:text-left">
            <div>
              <h2 className="font-serif text-2xl text-white">Get first access to new arrivals</h2>
              <p className="mt-2 max-w-md text-sm text-white/70">
                Message us on WhatsApp for styling help, fabric questions, or to be the first to know when a new piece drops.
              </p>
            </div>
            <a
              href={buildWhatsAppLink("Hi Sanctum Fabrics, I'd like to stay updated on new arrivals.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle size={16} /> Message us on WhatsApp
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
