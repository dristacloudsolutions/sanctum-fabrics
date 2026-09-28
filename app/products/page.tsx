import ProductCard from '../components/ProductCard';
import ProductFiltersTopBar from '../components/ProductFiltersTopBar';
import {
  getProducts,
  getCategoryHierarchy,
  buildAttributeFacets,
  getVariantAttribute,
  expandProductsByColor,
  type Product,
} from '@/lib/dristaService';
import { sampleProducts } from '@/lib/sampleProducts';

export const metadata = {
  title: 'Catalog | Sanctum Fabrics',
};

type SearchParams = {
  q?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  discount?: string;
  sort?: string;
  // Dynamic per-attribute filters, e.g. attr_size=M&attr_size=L&attr_material=Silk
  // (this is also how color is filtered — see the attr_color facet — not a
  // dedicated top-level param).
  [key: `attr_${string}`]: string | string[] | undefined;
};

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
    params.q || params.category || params.min_price || params.max_price || params.discount || attrParams.length > 0
  );

  const [liveProducts, categories] = await Promise.all([
    getProducts({
      q: params.q,
      category_id: params.category,
      min_price: params.min_price,
      max_price: params.max_price,
    }),
    getCategoryHierarchy(),
  ]);

  // Sample data has no filtering support, so it's only a fallback for the
  // unfiltered "browse everything" view — a filtered live query returning
  // zero results should show as "no matches", not silently swap to samples.
  let baseProducts = liveProducts.length > 0 ? liveProducts : hasFilters ? [] : sampleProducts;
  let usingSample = liveProducts.length === 0 && !hasFilters;

  // An empty category/subcategory shouldn't dead-end the page — fall back to
  // the wider catalog (still honoring search/price if set) rather than
  // showing nothing, since a shopper landing here from a category link with
  // no stock yet still wants to see *something*.
  let categoryFallback = false;
  if (params.category && liveProducts.length === 0) {
    const fallbackProducts = await getProducts({
      q: params.q,
      min_price: params.min_price,
      max_price: params.max_price,
    });
    if (fallbackProducts.length > 0) {
      baseProducts = fallbackProducts;
      categoryFallback = true;
      usingSample = false;
    }
  }

  // Facet option lists are derived from the base (pre-attribute-filter) set
  // so a group doesn't vanish the moment you pick one of its own values.
  const attributeFacets = buildAttributeFacets(baseProducts);

  const matchesAttributeFilters = (product: Product) => {
    if (attrParams.length === 0) return true;
    return attrParams.every(([key, selected]) => {
      const wantedValues = toValueList(selected);
      if (wantedValues.length === 0) return true;
      const attrKey = key.slice('attr_'.length);
      // Case-insensitive: the facet's key is one canonical casing (see
      // buildAttributeFacets), but any given variant may still store this
      // attribute under a differently-cased key (e.g. "color" vs "Color") —
      // an exact-key lookup here was excluding those variants/products
      // even though they clearly have a matching color.
      return (product.variants || []).some((variant) => {
        const val = getVariantAttribute(variant, attrKey);
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

  // Each product-color combination gets its own card — see expandProductsByColor.
  const cardEntries = expandProductsByColor(products);

  return (
    <div className="min-h-screen pb-16">
      {/* Sticky top filter bar */}
      <ProductFiltersTopBar
        categories={categories}
        attributeFacets={attributeFacets}
        totalCount={cardEntries.length}
        categoryFallback={categoryFallback}
        usingSample={usingSample}
      />

      {/* Main product catalog grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base text-[color:var(--ink)]/60">
              {hasFilters ? 'No pieces match your filters — try adjusting or resetting them.' : 'No products available right now — check back soon.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5 md:gap-6">
            {cardEntries.map((entry) => (
              <ProductCard
                key={`${entry.product.id}-${entry.variant?.id ?? 'base'}`}
                product={entry.product}
                variant={entry.variant}
                colorLabel={entry.colorLabel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
