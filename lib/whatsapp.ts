import config from '@/app/config/config';

export function buildWhatsAppLink(message: string, phoneOverride?: string): string {
  const phone = (phoneOverride || config.business.contact.whatsApp).replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function productOrderMessage(productName: string, price?: number, url?: string): string {
  const lines = [
    `Hi Sanctum Fabrics, I'd like to order:`,
    `*${productName}*`,
    price ? `Price: ₹${price.toLocaleString('en-IN')}` : undefined,
    url ? url : undefined,
  ].filter(Boolean);
  return lines.join('\n');
}
