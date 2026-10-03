import config from '@/app/config/config';
import { formatINR } from '@/lib/format';

export function buildWhatsAppLink(message: string, phoneOverride?: string): string {
  const phone = (phoneOverride || config.business.contact.whatsApp).replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export interface OrderMessageDetails {
  productCode?: string | null;
  /** e.g. "Color: Maroon, Length: 2.4 Meters" */
  variant?: string | null;
  url?: string;
}

/** The order enquiry sent on WhatsApp: name, code, variant, amount and a link back. */
export function productOrderMessage(productName: string, price?: number, details: OrderMessageDetails | string = {}): string {
  const d: OrderMessageDetails = typeof details === 'string' ? { url: details } : details;
  const lines = [
    `Hi Sanctum Fabrics, I'd like to order:`,
    `*${productName}*`,
    d.productCode ? `Product code: ${d.productCode}` : undefined,
    d.variant ? `Variant: ${d.variant}` : undefined,
    price ? `Amount: ₹${formatINR(price)}` : undefined,
    d.url ? d.url : undefined,
  ].filter(Boolean);
  return lines.join('\n');
}
