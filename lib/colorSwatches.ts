// Common apparel/fabric color names → swatch hex — covers the values this
// catalog actually uses. Falls back to a plain text chip for anything unmapped
// (e.g. a stray custom shade) rather than guessing a wrong color. Shared
// between the product page's color picker and the color filter sidebar so
// both render the exact same swatch for a given name.
export const COLOR_SWATCHES: Record<string, string> = {
  red: '#DC2626', maroon: '#7B1E2B', crimson: '#B91C3C', burgundy: '#722F37', wine: '#722F37', rust: '#B7410E', brick: '#B85C38',
  pink: '#EC4899', rose: '#F43F5E', magenta: '#C026D3', fuchsia: '#D946EF', 'hot pink': '#EC4899', 'baby pink': '#F4C2C2', salmon: '#FA8072',
  orange: '#EA580C', peach: '#FDBA74', coral: '#FB7185', apricot: '#FBCEB1',
  yellow: '#EAB308', mustard: '#CA9A2C', gold: '#D4AF37', lemon: '#FDE047', amber: '#D97706',
  green: '#16A34A', 'emerald green': '#0F9D58', 'bottle green': '#0B4226', olive: '#556B2F', mint: '#6EE7B7', lime: '#84CC16', 'forest green': '#166534', 'sea green': '#2E8B57',
  teal: '#0D9488', turquoise: '#14B8A6',
  blue: '#2563EB', navy: '#1E3A8A', indigo: '#3730A3', 'royal blue': '#1D4ED8', sky: '#38BDF8', 'powder blue': '#B0E0E6', denim: '#1560BD', 'steel blue': '#4682B4', cobalt: '#0047AB',
  purple: '#7C3AED', lavender: '#C4B5FD', violet: '#8B5CF6', lilac: '#C8A2C8', mauve: '#B784A7',
  brown: '#78350F', tan: '#D2B48C', beige: '#E8DCC8', cream: '#F5EFE0', ivory: '#FFFFF0', khaki: '#C3B091', camel: '#C19A6B', chocolate: '#7B3F00', mahogany: '#C04000', copper: '#B87333', bronze: '#CD7F32', 'rose gold': '#B76E79',
  white: '#FFFFFF', 'off white': '#F5F5F0', black: '#111111', grey: '#9CA3AF', gray: '#9CA3AF', charcoal: '#36454F', silver: '#C0C0C0',
};

export const colorSwatchHex = (value: string): string | undefined => COLOR_SWATCHES[value.trim().toLowerCase()];

// A variant's Color value (and its paired "Color Hex") can hold more than one
// color as a comma-separated list — e.g. a multicolor print item — set by the
// admin's multi-color picker. Splits that back into individual names/hexes,
// positionally matched, for swatch rendering.
export const splitColorList = (value: string): string[] =>
  value.split(',').map((v) => v.trim()).filter(Boolean);
