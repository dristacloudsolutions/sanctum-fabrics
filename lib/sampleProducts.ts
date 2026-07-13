import type { Product } from './dristaService';

// Placeholder catalog shown until Sanctum Fabrics is provisioned as a real
// tenant and her products are entered into the Item Master. Shaped exactly
// like the real /ecommerce/products response so swapping to live data is a
// no-op — see README.md for the cutover steps.
export const sampleProducts: Product[] = [
  {
    id: 'sample-1',
    name: 'Handloom Cotton Saree — Indigo Ikat',
    description:
      'Pure handloom cotton saree with traditional ikat weave in deep indigo. Breathable, lightweight, and finished with a contrast border.',
    sku: 'SF-SAR-001',
    selling_price: 3200,
    item_category: 'goods',
    is_active: true,
    images: [{ url: '/sample/saree-indigo.svg', is_primary: true }],
  },
  {
    id: 'sample-2',
    name: 'Mul Cotton Running Fabric — Natural Dye',
    description:
      'Soft mul cotton fabric, naturally dyed, sold by the metre. Ideal for kurtas, dresses, and home textiles.',
    sku: 'SF-FAB-014',
    selling_price: 480,
    item_category: 'goods',
    is_active: true,
    images: [{ url: '/sample/fabric-natural.svg', is_primary: true }],
  },
  {
    id: 'sample-3',
    name: 'Block-Print Cotton Dupatta — Rust',
    description:
      'Hand block-printed cotton dupatta in warm rust tones with a hand-finished tassel edge.',
    sku: 'SF-DUP-007',
    selling_price: 950,
    item_category: 'goods',
    is_active: true,
    images: [{ url: '/sample/dupatta-rust.svg', is_primary: true }],
  },
  {
    id: 'sample-4',
    name: 'Chanderi Silk-Cotton Saree — Ivory Gold',
    description:
      'Chanderi silk-cotton blend with a delicate gold zari border, known for its sheer texture and lightweight drape.',
    sku: 'SF-SAR-022',
    selling_price: 4800,
    item_category: 'goods',
    is_active: true,
    images: [{ url: '/sample/saree-chanderi.svg', is_primary: true }],
  },
  {
    id: 'sample-5',
    name: 'Linen Blend Fabric — Terracotta',
    description:
      'Mid-weight linen blend with a soft terracotta wash, sold by the metre. Suited to tailored jackets and structured dresses.',
    sku: 'SF-FAB-031',
    selling_price: 620,
    item_category: 'goods',
    is_active: true,
    images: [{ url: '/sample/fabric-terracotta.svg', is_primary: true }],
  },
  {
    id: 'sample-6',
    name: 'Kalamkari Cotton Blouse Piece',
    description:
      'Hand-painted kalamkari cotton blouse piece, unstitched, featuring traditional floral motifs.',
    sku: 'SF-BLZ-009',
    selling_price: 1150,
    item_category: 'goods',
    is_active: true,
    images: [{ url: '/sample/blouse-kalamkari.svg', is_primary: true }],
  },
];
