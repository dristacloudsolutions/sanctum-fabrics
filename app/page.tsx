import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Truck, ShieldCheck, RotateCcw, BadgeCheck, Gem, Sparkles, HeartHandshake } from 'lucide-react';
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

const SPECIALITIES = [
  { icon: Gem, label: 'Kanchipuram Silks', sub: 'Royal weaves, timeless beauty' },
  { icon: RotateCcw, label: 'Kerala Kasavu', sub: 'Pure tradition, elegant grace' },
  { icon: Sparkles, label: 'Temple Inspiration', sub: 'Heritage designs that inspire' },
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

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[color:var(--border)]">
        <div className="relative h-72 w-full sm:h-96 md:aspect-[1898/829] md:h-auto">
          <Image src="/hero-banner-sanctum.png" alt={config.business.name} fill priority className="object-cover object-right md:object-center" />
        </div>

        <div className="bg-[color:var(--cream)] px-5 py-10 md:absolute md:inset-0 md:flex md:items-center md:bg-transparent md:p-0">
          <div className="mx-auto w-full max-w-6xl md:px-5">
            <Reveal>
              <div className="mx-auto max-w-md text-center md:mx-0 md:max-w-xl md:text-left">
                <h1 className="font-serif text-2xl leading-tight text-[color:var(--ink)] sm:text-3xl md:text-5xl">
                  <span className="block md:whitespace-nowrap">Timeless Elegance,</span>
                  <span className="block md:whitespace-nowrap"><span className="text-[color:var(--accent)]">Woven</span> with Tradition</span>
                </h1>
                <div className="mx-auto my-5 flex items-center gap-3 md:mx-0">
                  <span className="h-px flex-1 bg-[color:var(--accent)]/40" />
                  <span className="text-[color:var(--accent)]">&#10048;</span>
                  <span className="h-px flex-1 bg-[color:var(--accent)]/40" />
                </div>
                <p className="text-center text-sm leading-relaxed text-[color:var(--ink)]/70 sm:text-base">
                  Authentic South Indian Sarees, Elegant Churidars
                  <br />
                  and Designer Tops curated for every occasion.
                  <br />
                  Celebrate tradition. Celebrate you.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  >
                    Shop Sarees
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 border border-[color:var(--ink)]/30 px-6 py-3 text-sm font-semibold text-[color:var(--ink)] transition-colors hover:bg-[color:var(--ink)] hover:text-white"
                  >
                    Explore Collection
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-10">
        <Reveal>
          <h2 className="text-center font-serif text-2xl text-[color:var(--ink)] md:text-3xl">New Arrivals</h2>
          <div className="mx-auto my-4 flex max-w-[160px] items-center gap-3">
            <span className="h-px flex-1 bg-[color:var(--accent)]/40" />
            <span className="text-[color:var(--accent)]">&#10048;</span>
            <span className="h-px flex-1 bg-[color:var(--accent)]/40" />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <ProductCarousel products={newArrivals} />
        </Reveal>
      </section>

      {/* Shop by category */}
      {topCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-10">
          <Reveal>
            <h2 className="text-center font-serif text-2xl text-[color:var(--ink)] md:text-3xl">Shop by Category</h2>
            <div className="mx-auto my-4 flex max-w-[160px] items-center gap-3">
              <span className="h-px flex-1 bg-[color:var(--accent)]/40" />
              <span className="text-[color:var(--accent)]">&#10048;</span>
              <span className="h-px flex-1 bg-[color:var(--accent)]/40" />
            </div>
          </Reveal>
          {/* flex-wrap + fixed card width (not a 3-col grid) so this still looks
              intentional with 1 or 2 categories, not a mostly-empty row. */}
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {topCategories.map((cat, i) => (
              <Reveal key={cat.id} delay={i * 0.1}>
                <Link
                  href={`/products?category=${cat.id}`}
                  className="group relative block w-full max-w-xs overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-xl sm:w-72"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[color:var(--cream)]">
                    {cat.image_url ? (
                      <Image src={cat.image_url} alt={cat.name} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[color:var(--primary)]/10 to-[color:var(--accent)]/10 font-serif text-5xl text-[color:var(--primary)]/40">
                        {cat.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="font-serif text-xl text-white">{cat.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white/85 transition-colors group-hover:text-[color:var(--accent)]">
                      Explore <span aria-hidden>→</span>
                    </p>
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

      {/* Specialities & Traditions of South India */}
      <section id="story" className="relative overflow-hidden border-y border-[color:var(--border)] scroll-mt-24">
        <div className="relative h-72 w-full sm:h-96 md:h-[480px]">
          <Image src="/traditions.png" alt="Specialities & Traditions of South India" fill className="object-cover object-left md:object-center" />
        </div>

        <div className="bg-[color:var(--cream)] px-5 py-14 md:absolute md:inset-0 md:flex md:items-center md:bg-transparent md:p-0">
          <div className="w-full md:px-5 lg:px-12">
            <Reveal delay={0.15}>
              <div className="mx-auto max-w-xl md:ml-auto md:mr-0">
                <h2 className="text-center font-serif text-2xl leading-tight text-[color:var(--ink)] sm:text-3xl md:text-left md:text-4xl">
                  The Specialities &amp; Traditions of <span className="text-[color:var(--accent)]">South India</span>
                </h2>

                <div className="mt-6 grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-[color:var(--border)]">
                  {SPECIALITIES.map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="px-3 text-center sm:first:pl-0 sm:last:pr-0">
                      <Icon size={24} className="mx-auto text-[color:var(--accent)]" />
                      <p className="mt-2.5 text-sm font-semibold leading-tight text-[color:var(--ink)]">{label}</p>
                      <p className="mt-1 text-xs leading-snug text-[color:var(--ink)]/50">{sub}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-center text-base leading-relaxed text-[color:var(--ink)]/70 md:mt-3 md:text-left">
                  Our collections celebrate the rich heritage, vibrant colors and intricate craftsmanship of South
                  India. Every piece is a blend of tradition, quality and contemporary style.
                </p>

                <div className="mt-6 flex justify-center md:mt-3 md:justify-start">
                  <a
                    href={buildWhatsAppLink("Hi Sanctum Fabrics, I'd like to place an order.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  >
                    <MessageCircle size={16} /> Order on WhatsApp
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
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
      <section className="border-t border-[color:var(--border)] bg-[color:var(--ink)]">
        <Reveal>
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-6 text-center md:flex-row md:text-left">
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
