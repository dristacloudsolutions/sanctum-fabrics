/**
 * Sanctum Fabrics — site configuration.
 *
 * Everything below is a placeholder pending the real business details
 * (phone, WhatsApp number, address, social handles, logo). Replace these
 * before launch — search this file for "TODO" to find every spot.
 */

const businessName = 'Sanctum Fabrics';
const businessTagline = 'Handcrafted textiles, woven with intention';

export const config = {
  business: {
    name: businessName,
    tagline: businessTagline,
    description:
      'Sanctum Fabrics curates handloom sarees, natural-dye fabrics, and hand block-printed textiles — sourced directly from artisan clusters across India.',

    contact: {
      email: 'sanctumavemaria@gmail.com',
      phone: '+91 99208 22231',
      whatsApp: '+91 99208 22231',
      address: 'Sanctum Fabrics,\nIndia',
    },

    social: {
      instagram: 'https://instagram.com/sanctum_in', // TODO: confirm handle
      facebook: '',
    },
  },

  // Shown while the real /ecommerce catalog isn't wired up yet (no
  // DRISTA_API_KEY / NEXT_PUBLIC_TENANT_ID set). See lib/dristaService.ts.
  usingSampleCatalog: true,

  seo: {
    title: `${businessName} — ${businessTagline}`,
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
