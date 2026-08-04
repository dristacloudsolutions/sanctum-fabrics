import config from '@/app/config/config';
import { formatINR } from '@/lib/format';

export function buildWhatsAppLink(message: string, phoneOverride?: string): string {
  const phone = (phoneOverride || config.business.contact.whatsApp).replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function productOrderMessage(productName: string, price?: number, url?: string): string {
  const lines = [
    `Hi Sanctum Fabrics, I'd like to order:`,
    `*${productName}*`,
    price ? `Price: ₹${formatINR(price)}` : undefined,
    url ? url : undefined,
  ].filter(Boolean);
  return lines.join('\n');
}
