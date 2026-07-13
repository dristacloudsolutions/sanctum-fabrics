import ProductCard from '../components/ProductCard';
import { getProducts } from '@/lib/dristaService';
import { sampleProducts } from '@/lib/sampleProducts';

export const metadata = {
  title: 'Catalog | Sanctum Fabrics',
};

export default async function ProductsPage() {
  const liveProducts = await getProducts();
  const products = liveProducts.length > 0 ? liveProducts : sampleProducts;
  const usingSample = liveProducts.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="mb-10">
        <h1 className="font-serif text-3xl text-[color:var(--ink)]">The Catalog</h1>
        <p className="mt-2 text-sm text-[color:var(--ink)]/60">
          {products.length} piece{products.length === 1 ? '' : 's'} available — tap any item to order on WhatsApp.
        </p>
        {usingSample && (
          <p className="mt-1 text-xs text-[color:var(--ink)]/40">
            Sample catalog shown — connect the live catalog in lib/dristaService.ts once onboarded.
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-[color:var(--ink)]/50">No products available right now — check back soon.</p>
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
