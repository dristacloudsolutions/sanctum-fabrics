import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import config from '../config/config';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { getTenantProfile } from '@/lib/dristaService';

export const metadata = {
  title: 'Contact | Sanctum Fabrics',
};

export default async function ContactPage() {
  const { contact } = config.business;
  const tenant = await getTenantProfile();

  const phone = tenant?.phone || contact.phone;
  const email = tenant?.email || contact.email;
  const address = tenant?.contact_address
    ? [
        tenant.contact_address.line1,
        tenant.contact_address.line2,
        [tenant.contact_address.city, tenant.contact_address.state, tenant.contact_address.postal_code].filter(Boolean).join(', '),
        tenant.contact_address.country,
      ]
        .filter(Boolean)
        .join('\n')
    : contact.address;

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 text-center">
      <h1 className="font-serif text-3xl text-[color:var(--ink)]">Get in Touch</h1>
      <p className="mx-auto mt-3 max-w-lg text-[color:var(--ink)]/70">
        The fastest way to order or ask about a piece is WhatsApp — we usually reply within the day.
      </p>

      <a
        href={buildWhatsAppLink('Hi Sanctum Fabrics, I have a question.', phone)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-600"
      >
        <MessageCircle size={16} /> Message us on WhatsApp
      </a>

      <div className="mx-auto mt-14 grid max-w-md gap-4 text-left">
        <a href={`tel:${phone}`} className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm text-[color:var(--ink)]/80 hover:border-[color:var(--primary)]">
          <Phone size={16} className="text-[color:var(--primary)]" /> {phone}
        </a>
        <a href={`mailto:${email}`} className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm text-[color:var(--ink)]/80 hover:border-[color:var(--primary)]">
          <Mail size={16} className="text-[color:var(--primary)]" /> {email}
        </a>
        <div className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm text-[color:var(--ink)]/80">
          <MapPin size={16} className="mt-0.5 shrink-0 text-[color:var(--primary)]" />
          <span className="whitespace-pre-line">{address}</span>
        </div>
      </div>
    </div>
  );
}
