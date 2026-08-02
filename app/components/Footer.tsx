import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import config from '@/app/config/config';
import { TenantProfile } from '@/lib/dristaService';
import { buildWhatsAppLink } from '@/lib/whatsapp';

// lucide-react dropped brand icons (Instagram etc.) — inline SVG instead.
function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function FacebookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    </svg>
  );
}
function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5C10 9 9.5 7.8 9.3 7.3c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.3-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2z" />
    </svg>
  );
}

export default function Footer({ tenantProfile }: { tenantProfile?: TenantProfile | null }) {
  const { business } = config;
  const name = tenantProfile?.name || business.name;
  const email = tenantProfile?.email || business.contact.email;
  const phone = tenantProfile?.phone || business.contact.phone;
  const address = business.contact.address;
  const instagram = tenantProfile?.settings?.social?.instagram || business.social.instagram;
  const facebook = business.social.facebook;

  const socialLinks = [
    facebook && { href: facebook, label: 'Facebook', Icon: FacebookIcon },
    instagram && { href: instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: buildWhatsAppLink(`Hi ${name}, I'd like to know more.`), label: 'WhatsApp', Icon: WhatsAppIcon },
  ].filter((s): s is { href: string; label: string; Icon: typeof InstagramIcon } => Boolean(s));

  return (
    <footer className="mt-24 border-t border-[color:var(--border)] bg-[color:var(--primary)] text-[color:var(--cream)]">
      {/* Visit our boutique + stay updated */}
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--cream)]/50">
              Visit Our Boutique
            </p>
            <div className="space-y-2 text-sm text-[color:var(--cream)]/80">
              <p className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0" />
                <span className="whitespace-pre-line">{address}</span>
              </p>
              <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-white">
                <Phone size={14} /> {phone}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-white">
                <Mail size={14} /> {email}
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-center md:items-end md:text-right">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--cream)]/50">
              Stay Updated
            </p>
            <p className="max-w-xs text-sm text-[color:var(--cream)]/70 md:text-right">
              Message us on WhatsApp to hear about new arrivals and exclusive offers first.
            </p>
            <a
              href={buildWhatsAppLink(`Hi ${name}, I'd like to stay updated on new arrivals.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-transform hover:-translate-y-0.5"
            >
              <WhatsAppIcon size={13} /> Message Us
            </a>
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-lg">{name}</p>
          <p className="mt-2 max-w-xs text-sm text-[color:var(--cream)]/70">{business.tagline}</p>
        </div>

        <div className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--cream)]/50">Quick Links</p>
          <div className="flex flex-col gap-1.5">
            <Link href="/" className="text-[color:var(--cream)]/80 hover:text-white">Home</Link>
            <Link href="/products" className="text-[color:var(--cream)]/80 hover:text-white">Collections</Link>
            <Link href="/#story" className="text-[color:var(--cream)]/80 hover:text-white">About Us</Link>
            <Link href="/contact" className="text-[color:var(--cream)]/80 hover:text-white">Contact Us</Link>
          </div>
        </div>

        <div className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--cream)]/50">Policies</p>
          <div className="flex flex-col gap-1.5">
            <Link href="/terms" className="text-[color:var(--cream)]/80 hover:text-white">Terms &amp; Conditions</Link>
            <Link href="/privacy" className="text-[color:var(--cream)]/80 hover:text-white">Privacy Policy</Link>
            <Link href="/returns" className="text-[color:var(--cream)]/80 hover:text-white">Returns &amp; Exchanges</Link>
            <Link href="/shipping" className="text-[color:var(--cream)]/80 hover:text-white">Shipping Policy</Link>
          </div>
        </div>

        <div className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--cream)]/50">Follow Us</p>
          <div className="flex items-center gap-3">
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-[color:var(--cream)]/80 transition-colors hover:border-white/40 hover:text-white"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-[color:var(--cream)]/50">
        © {new Date().getFullYear()} {name}. All rights reserved.
      </div>
    </footer>
  );
}
