import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/dristaService';

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.find((i) => i.is_primary) || product.images?.[0];
  const price = product.selling_price ?? product.base_price;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[color:var(--cream)]">
        {image?.url ? (
          <Image
            src={image.url}
            alt={product.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[color:var(--ink)]/40">
            No image yet
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-base text-[color:var(--ink)] leading-snug">{product.name}</h3>
        {price !== undefined && (
          <p className="mt-1 text-sm font-semibold text-[color:var(--accent)]">
            ₹{price.toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </Link>
  );
}
