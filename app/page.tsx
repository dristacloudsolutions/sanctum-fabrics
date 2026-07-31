import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MessageCircle, Truck, ShieldCheck, RotateCcw, BadgeCheck } from 'lucide-react';
import ProductCard from './components/ProductCard';
import config from './config/config';
import { getProducts, getCategoryHierarchy } from '@/lib/dristaService';
import { sampleProducts } from '@/lib/sampleProducts';
import { buildWhatsAppLink } from '@/lib/whatsapp';

const TRUST_BADGES = [
  { icon: Truck, label: 'Pan-India Delivery', sub: '4–7 business days' },
  { icon: ShieldCheck, label: 'Secure Payments', sub: 'UPI, Cards & Net Banking' },
  { icon: RotateCcw, label: 'Easy Returns', sub: '7-day return window' },
  { icon: BadgeCheck, label: 'Authentic Handloom', sub: 'Sourced from artisan clusters' },
];

export default async function Home() {
  const [liveProducts, categories] = await Promise.all([getProducts(), getCategoryHierarchy()]);
  const products = liveProducts.length > 0 ? liveProducts : sampleProducts;
  const featured = products.slice(0, 4);
  const usingSample = liveProducts.length === 0;
  const topCategories = categories.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[color:var(--border)] bg-[color:var(--cream)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
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
          </div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[color:var(--primary)] to-[#1a2340]">
            <div className="flex h-full items-center justify-center px-8 text-center">
              <p className="font-serif text-2xl text-[#e8c88a]/90">
                Every weave tells
                <br />a story
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-[color:var(--border)] bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4">
          {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon size={22} className="shrink-0 text-[color:var(--accent)]" />
              <div>
                <p className="text-sm font-semibold text-[color:var(--ink)]">{label}</p>
                <p className="text-xs text-[color:var(--ink)]/50">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by category */}
      {topCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="mb-8 font-serif text-2xl text-[color:var(--ink)] md:text-3xl">Shop by Category</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--cream)] text-center transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-[color:var(--primary)]/10 to-[color:var(--accent)]/10">
                  {cat.image_url ? (
                    <Image src={cat.image_url} alt={cat.name} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-serif text-lg text-[color:var(--primary)]/50">
                      {cat.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <p className="py-3 text-sm font-medium text-[color:var(--ink)]">{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-5 py-20">
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
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Brand story */}
      <section className="border-t border-[color:var(--border)] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
            Our Story
          </p>
          <h2 className="mt-4 font-serif text-2xl text-[color:var(--ink)] md:text-3xl">
            Heritage, grace, and timeless ethnic beauty
          </h2>
          <div className="mt-6 space-y-5 text-left leading-relaxed text-[color:var(--ink)]/70 md:text-center">
            <p>
              Rooted deeply in South Indian tradition, Sanctum is a celebration of heritage, grace, and
              timeless ethnic beauty. Sanctum brings ethnic wear that feels soulful, elegant, and
              meaningful. The textures, colors, and craftsmanship reflect authenticity, while the styles
              are created to be admired and worn by women from every corner of India.
            </p>
            <p>
              What makes Sanctum truly special is its ability to honour South Indian elegance while
              embracing India&apos;s diverse tastes. Whether you are drawn to traditional grace or modern
              ethnic charm, Sanctum offers collections that resonate beyond regions and boundaries.
            </p>
            <p>
              At Sanctum, ethnic wear becomes a shared celebration—where South Indian heritage meets
              pan-Indian love. A place where every woman, no matter where she&apos;s from, finds something
              that feels special, timeless, and truly hers.
            </p>
          </div>
          <p className="mt-8 font-serif text-lg italic text-[color:var(--ink)]">
            Sanctum — Tradition that begins in the South and wins hearts across India
          </p>
          <a
            href={buildWhatsAppLink("Hi Sanctum Fabrics, I'd like to place an order.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle size={16} /> Order on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
