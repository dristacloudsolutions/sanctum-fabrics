import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategoryHierarchy, buildAttributeFacets, type Product } from '@/lib/dristaService';
import { sampleProducts } from '@/lib/sampleProducts';
import config from '../config/config';

export const metadata = {
  title: 'Catalog | Sanctum Fabrics',
};

type SearchParams = {
  q?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  color?: string;
  discount?: string;
  sort?: string;
  // Dynamic per-attribute filters, e.g. attr_size=M&attr_size=L&attr_material=Silk
  [key: `attr_${string}`]: string | string[] | undefined;
};

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A–Z' },
] as const;

function toValueList(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const attrParams = Object.entries(params).filter(([k]) => k.startsWith('attr_')) as [string, string | string[]][];
  const hasFilters = Boolean(
    params.q || params.category || params.min_price || params.max_price || params.color || params.discount || attrParams.length > 0
  );

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
  const baseProducts = liveProducts.length > 0 ? liveProducts : hasFilters ? [] : sampleProducts;
  const usingSample = liveProducts.length === 0 && !hasFilters;

  // Facet option lists are derived from the base (pre-attribute-filter) set
  // so a group doesn't vanish the moment you pick one of its own values.
  const attributeFacets = buildAttributeFacets(baseProducts);

  const matchesAttributeFilters = (product: Product) => {
    if (attrParams.length === 0) return true;
    return attrParams.every(([key, selected]) => {
      const wantedValues = toValueList(selected);
      if (wantedValues.length === 0) return true;
      const attrKey = key.slice('attr_'.length);
      return (product.variants || []).some((variant) => {
        const val = variant.attributes?.[attrKey];
        return val !== undefined && wantedValues.includes(String(val));
      });
    });
  };

  const hasDiscount = (p: Product) => p.base_price !== undefined && p.selling_price !== undefined && p.base_price > p.selling_price;

  let products = baseProducts.filter(matchesAttributeFilters);
  if (params.discount === '1') products = products.filter(hasDiscount);

  if (params.sort === 'price_asc') {
    products = [...products].sort((a, b) => (a.selling_price ?? a.base_price ?? 0) - (b.selling_price ?? b.base_price ?? 0));
  } else if (params.sort === 'price_desc') {
    products = [...products].sort((a, b) => (b.selling_price ?? b.base_price ?? 0) - (a.selling_price ?? a.base_price ?? 0));
  } else if (params.sort === 'name_asc') {
    products = [...products].sort((a, b) => a.name.localeCompare(b.name));
  }

  const selectedCategory = params.category
    ? categories.flatMap((cat) => [cat, ...(cat.children || [])]).find((cat) => cat.id === params.category)
    : undefined;
  const heading = selectedCategory?.name || 'The Catalog';

  const paramsAsRecord = params as Record<string, string | string[] | undefined>;
  const isAttrChecked = (key: string, value: string) => toValueList(paramsAsRecord[`attr_${key}`]).includes(value);

  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[color:var(--ink)] md:text-4xl">{heading}</h1>
        <p className="mt-2 font-serif text-base italic text-[color:var(--accent)]">{config.business.tagline}</p>
        <p className="mt-2 text-sm text-[color:var(--ink)]/60">
          {products.length} piece{products.length === 1 ? '' : 's'} available
        </p>
        {usingSample && (
          <p className="mt-1 text-xs text-[color:var(--ink)]/40">
            Sample catalog shown — connect the live catalog in lib/dristaService.ts once onboarded.
          </p>
        )}
      </div>

      <form method="get" className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* ─── Filter & Sort sidebar ─────────────────────────────────────── */}
        <aside className="filter-accordion h-fit rounded-2xl border border-[color:var(--border)] bg-white lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3.5">
            <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--ink)]">Filter &amp; Sort</span>
            {hasFilters && (
              <Link href="/products" className="text-xs font-medium text-[color:var(--accent)] underline underline-offset-2">
                Clear
              </Link>
            )}
          </div>

          <div className="divide-y divide-[color:var(--border)] px-4">
            {/* Search */}
            <div className="py-4">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Search</label>
              <input
                type="text"
                name="q"
                defaultValue={params.q || ''}
                placeholder="Saree, blouse, fabric…"
                className="mt-1.5 w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
              />
            </div>

            {/* Sort by */}
            <details className="group py-4" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[color:var(--ink)]">
                Sort by
                <FacetToggleIcon />
              </summary>
              <div className="mt-3 space-y-2">
                {SORT_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm text-[color:var(--ink)]/70">
                    <input type="radio" name="sort" value={opt.value} defaultChecked={(params.sort || '') === opt.value} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </details>

            {/* Price */}
            <details className="group py-4" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[color:var(--ink)]">
                Price
                <FacetToggleIcon />
              </summary>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  name="min_price"
                  min={0}
                  placeholder="Min"
                  defaultValue={params.min_price || ''}
                  className="w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
                />
                <span className="text-[color:var(--ink)]/30">–</span>
                <input
                  type="number"
                  name="max_price"
                  min={0}
                  placeholder="Max"
                  defaultValue={params.max_price || ''}
                  className="w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
                />
              </div>
            </details>

            {/* Discounts */}
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[color:var(--ink)]">
                Discounts
                <FacetToggleIcon />
              </summary>
              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm text-[color:var(--ink)]/70">
                  <input type="checkbox" name="discount" value="1" defaultChecked={params.discount === '1'} />
                  On sale only
                </label>
              </div>
            </details>

            {/* Category */}
            {categories.length > 0 && (
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[color:var(--ink)]">
                  Category
                  <FacetToggleIcon />
                </summary>
                <div className="mt-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm text-[color:var(--ink)]/70">
                    <input type="radio" name="category" value="" defaultChecked={!params.category} />
                    All Categories
                  </label>
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <label className="flex items-center gap-2 text-sm text-[color:var(--ink)]/70">
                        <input type="radio" name="category" value={cat.id} defaultChecked={params.category === cat.id} />
                        {cat.name}
                      </label>
                      {(cat.children || []).map((child) => (
                        <label key={child.id} className="ml-5 flex items-center gap-2 text-sm text-[color:var(--ink)]/70">
                          <input type="radio" name="category" value={child.id} defaultChecked={params.category === child.id} />
                          {child.name}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </details>
            )}


            {/* Dynamic attribute facets — Size, Material, Fit, whatever the
                catalog's variants actually carry, no hardcoded list. */}
            {attributeFacets.map((facet) => (
              <details key={facet.key} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[color:var(--ink)]">
                  {facet.label}
                  <FacetToggleIcon />
                </summary>
                <div className="mt-3 space-y-2">
                  {facet.values.map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm text-[color:var(--ink)]/70">
                      <input
                        type="checkbox"
                        name={`attr_${facet.key}`}
                        value={value}
                        defaultChecked={isAttrChecked(facet.key, value)}
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <div className="p-4">
            <button
              type="submit"
              className="w-full rounded-full bg-[color:var(--primary)] px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Apply
            </button>
          </div>
        </aside>

        {/* ─── Results grid ──────────────────────────────────────────────── */}
        <div>
          {products.length === 0 ? (
            <p className="text-sm text-[color:var(--ink)]/50">
              {hasFilters ? 'No pieces match your filters — try adjusting them.' : 'No products available right now — check back soon.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

function FacetToggleIcon() {
  return (
    <span className="text-base leading-none text-[color:var(--ink)]/40">
      <span className="group-open:hidden">+</span>
      <span className="hidden group-open:inline">−</span>
    </span>
  );
}
