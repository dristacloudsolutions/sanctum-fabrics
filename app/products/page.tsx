import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategoryHierarchy } from '@/lib/dristaService';
import { sampleProducts } from '@/lib/sampleProducts';

export const metadata = {
  title: 'Catalog | Sanctum Fabrics',
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min_price?: string; max_price?: string; color?: string }>;
}) {
  const params = await searchParams;
  const hasFilters = Boolean(params.q || params.category || params.min_price || params.max_price || params.color);

  const [liveProducts, categories] = await Promise.all([
    getProducts({
      q: params.q,
      category_id: params.category,
      min_price: params.min_price,
      max_price: params.max_price,
      color: params.color,
    }),
    getCategoryHierarchy(),
  ]);

  // Sample data has no filtering support, so it's only a fallback for the
  // unfiltered "browse everything" view — a filtered live query returning
  // zero results should show as "no matches", not silently swap to samples.
  const products = liveProducts.length > 0 ? liveProducts : hasFilters ? [] : sampleProducts;
  const usingSample = liveProducts.length === 0 && !hasFilters;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[color:var(--ink)]">The Catalog</h1>
        <p className="mt-2 text-sm text-[color:var(--ink)]/60">
          {products.length} piece{products.length === 1 ? '' : 's'} available
        </p>
        {usingSample && (
          <p className="mt-1 text-xs text-[color:var(--ink)]/40">
            Sample catalog shown — connect the live catalog in lib/dristaService.ts once onboarded.
          </p>
        )}
      </div>

      <form method="get" className="mb-10 flex flex-wrap items-end gap-3 rounded-2xl border border-[color:var(--border)] bg-white p-4">
        <div className="min-w-[180px] flex-1">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Search</label>
          <input
            type="text"
            name="q"
            defaultValue={params.q || ''}
            placeholder="Saree, blouse, fabric…"
            className="mt-1.5 w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
          />
        </div>

        {categories.length > 0 && (
          <div className="min-w-[160px]">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Category</label>
            <select name="category" defaultValue={params.category || ''} className="mt-1.5 w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm">
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  <option value={cat.id}>{cat.name}</option>
                  {(cat.children || []).map((child) => (
                    <option key={child.id} value={child.id}>&nbsp;&nbsp;{child.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        <div className="w-24">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Min ₹</label>
          <input
            type="number"
            name="min_price"
            min={0}
            defaultValue={params.min_price || ''}
            className="mt-1.5 w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
          />
        </div>

        <div className="w-24">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Max ₹</label>
          <input
            type="number"
            name="max_price"
            min={0}
            defaultValue={params.max_price || ''}
            className="mt-1.5 w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-[120px]">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Color</label>
          <input
            type="text"
            name="color"
            placeholder="e.g. Maroon"
            defaultValue={params.color || ''}
            className="mt-1.5 w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-full bg-[color:var(--primary)] px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Apply
        </button>
        {hasFilters && (
          <Link href="/products" className="text-sm font-medium text-[color:var(--ink)]/50 underline underline-offset-2 hover:text-[color:var(--ink)]">
            Clear
          </Link>
        )}
      </form>

      {products.length === 0 ? (
        <p className="text-sm text-[color:var(--ink)]/50">
          {hasFilters ? 'No pieces match your filters — try adjusting them.' : 'No products available right now — check back soon.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
