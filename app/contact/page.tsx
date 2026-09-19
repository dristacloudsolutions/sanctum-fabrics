import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import config from '../config/config';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { getTenantProfile } from '@/lib/dristaService';
import ContactForm from './ContactForm';

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
    <div className="mx-auto max-w-5xl px-5 py-16">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-serif text-3xl text-[color:var(--ink)]">Get in Touch</h1>
        <p className="mx-auto mt-3 text-[color:var(--ink)]/70">
          The fastest way to order or ask about a piece is WhatsApp — we usually reply within the day. Prefer email? Send us a message below.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <ContactForm />
        </div>

        <div className="flex flex-col gap-4 md:col-span-2">
          <a
            href={buildWhatsAppLink('Hi Sanctum Fabrics, I have a question.', phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            <MessageCircle size={16} /> Message us on WhatsApp
          </a>

          <a href={`tel:${phone}`} className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm text-[color:var(--ink)]/80 hover:border-[color:var(--primary)]">
            <Phone size={16} className="shrink-0 text-[color:var(--primary)]" /> {phone}
          </a>
          <a href={`mailto:${email}`} className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm text-[color:var(--ink)]/80 hover:border-[color:var(--primary)]">
            <Mail size={16} className="shrink-0 text-[color:var(--primary)]" /> {email}
          </a>
          <div className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm text-[color:var(--ink)]/80">
            <MapPin size={16} className="mt-0.5 shrink-0 text-[color:var(--primary)]" />
            <span className="whitespace-pre-line">{address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
