/**
 * Sanctum Fabrics — site configuration.
 *
 * Everything below is a placeholder pending the real business details
 * (phone, WhatsApp number, address, social handles, logo). Replace these
 * before launch — search this file for "TODO" to find every spot.
 */

export const config = {
  business: {
    name: 'Sanctum Fabrics',
    tagline: 'Handcrafted textiles, woven with intention',
    description:
      'Sanctum Fabrics curates handloom sarees, natural-dye fabrics, and hand block-printed textiles — sourced directly from artisan clusters across India.',

    contact: {
      email: 'hello@sanctumfabrics.in', // TODO: confirm real inbox
      phone: '+91 90000 00000', // TODO: real phone number
      whatsApp: '+91 90000 00000', // TODO: real WhatsApp number
      address: 'Sanctum Fabrics Studio,\nIndia', // TODO: real address
    },

    social: {
      instagram: 'https://instagram.com/sanctumfabrics', // TODO: confirm handle
      facebook: '',
    },
  },

  // Shown while the real /ecommerce catalog isn't wired up yet (no
  // DRISTA_API_KEY / NEXT_PUBLIC_TENANT_ID set). See lib/dristaService.ts.
  usingSampleCatalog: true,

  seo: {
    title: 'Sanctum Fabrics | Handloom & Artisan Textiles',
    description:
      'Shop handloom sarees, natural-dye fabrics, and hand block-printed textiles from Sanctum Fabrics. Order directly on WhatsApp.',
    keywords: ['handloom saree', 'natural dye fabric', 'block print textile', 'sanctum fabrics'],
  },

  colors: {
    primary: '#2b3a67', // deep indigo — heritage dye reference
    accent: '#c1613f', // terracotta/rust — CTA accent
    cream: '#fbf6ee',
    ink: '#2a2420',
  },
};

export default config;
