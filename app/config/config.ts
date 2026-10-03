/**
 * Sanctum Fabrics — site configuration.
 *
 * Everything below is a placeholder pending the real business details
 * (phone, WhatsApp number, address, social handles, logo). Replace these
 * before launch — search this file for "TODO" to find every spot.
 */

const businessName = 'Sanctum Fabrics';
const businessTagline = 'South Indian sarees, churidars and designer tops';

export const config = {
  business: {
    name: businessName,
    tagline: businessTagline,
    description:
      'Sanctum Fabrics brings authentic South Indian sarees — Kanchipuram silks, Kerala kasavu, handloom and designer weaves — with elegant churidars and tops, curated for every occasion.',

    contact: {
      email: 'sanctumavemaria@gmail.com',
      phone: '+91 99208 22232',
      whatsApp: '+91 93218 46790',
      address: 'Sanctum Fabrics\nIndia',
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
      'Shop authentic South Indian sarees — Kanchipuram silk, Kerala kasavu, handloom and designer sarees — plus churidars and tops at Sanctum Fabrics. Secure online payment, pan-India delivery.',
    keywords: ['south indian sarees', 'kanchipuram silk saree', 'kerala kasavu saree', 'handloom saree', 'churidar', 'sanctum fabrics'],
  },

  colors: {
    primary: '#2b3a67', // deep indigo — heritage dye reference
    accent: '#c1613f', // terracotta/rust — CTA accent
    cream: '#fbf6ee',
    ink: '#2a2420',
  },
};

export default config;
