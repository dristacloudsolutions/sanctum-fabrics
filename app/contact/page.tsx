import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import config from '../config/config';
import { buildWhatsAppLink } from '@/lib/whatsapp';

export const metadata = {
  title: 'Contact | Sanctum Fabrics',
};

export default function ContactPage() {
  const { contact } = config.business;

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 text-center">
      <h1 className="font-serif text-3xl text-[color:var(--ink)]">Get in Touch</h1>
      <p className="mx-auto mt-3 max-w-lg text-[color:var(--ink)]/70">
        The fastest way to order or ask about a piece is WhatsApp — we usually reply within the day.
      </p>

      <a
        href={buildWhatsAppLink('Hi Sanctum Fabrics, I have a question.')}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-600"
      >
        <MessageCircle size={16} /> Message us on WhatsApp
      </a>

      <div className="mx-auto mt-14 grid max-w-md gap-4 text-left">
        <a href={`tel:${contact.phone}`} className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm text-[color:var(--ink)]/80 hover:border-[color:var(--primary)]">
          <Phone size={16} className="text-[color:var(--primary)]" /> {contact.phone}
        </a>
        <a href={`mailto:${contact.email}`} className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm text-[color:var(--ink)]/80 hover:border-[color:var(--primary)]">
          <Mail size={16} className="text-[color:var(--primary)]" /> {contact.email}
        </a>
        <div className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm text-[color:var(--ink)]/80">
          <MapPin size={16} className="mt-0.5 shrink-0 text-[color:var(--primary)]" />
          <span className="whitespace-pre-line">{contact.address}</span>
        </div>
      </div>
    </div>
  );
}
