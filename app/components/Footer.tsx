import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import config from '@/app/config/config';
import { TenantProfile } from '@/lib/dristaService';

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

export default function Footer({ tenantProfile }: { tenantProfile?: TenantProfile | null }) {
  const { business } = config;
  const name = tenantProfile?.name || business.name;
  const email = tenantProfile?.email || business.contact.email;
  const phone = tenantProfile?.phone || business.contact.phone;
  const instagram = tenantProfile?.settings?.social?.instagram || business.social.instagram;

  return (
    <footer className="mt-24 border-t border-[color:var(--border)] bg-[color:var(--primary)] text-[color:var(--cream)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
        <div>
          <p className="font-serif text-lg">{name}</p>
          <p className="mt-2 max-w-xs text-sm text-[color:var(--cream)]/70">{business.tagline}</p>
        </div>

        <div className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--cream)]/50">
            Get in touch
          </p>
          <a href={`mailto:${email}`} className="flex items-center gap-2 py-1 text-[color:var(--cream)]/80 hover:text-white">
            <Mail size={14} /> {email}
          </a>
          <a href={`tel:${phone}`} className="flex items-center gap-2 py-1 text-[color:var(--cream)]/80 hover:text-white">
            <Phone size={14} /> {phone}
          </a>
        </div>

        <div className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--cream)]/50">
            Follow along
          </p>
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-1 text-[color:var(--cream)]/80 hover:text-white"
            >
              <InstagramIcon size={14} /> Instagram
            </a>
          )}
          <Link href="/products" className="block py-1 text-[color:var(--cream)]/80 hover:text-white">
            Browse the catalog →
          </Link>
        </div>

        <div className="text-sm sm:col-span-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--cream)]/50">
            Policies
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <Link href="/terms" className="text-[color:var(--cream)]/80 hover:text-white">Terms & Conditions</Link>
            <Link href="/privacy" className="text-[color:var(--cream)]/80 hover:text-white">Privacy Policy</Link>
            <Link href="/returns" className="text-[color:var(--cream)]/80 hover:text-white">Returns & Exchanges</Link>
            <Link href="/shipping" className="text-[color:var(--cream)]/80 hover:text-white">Shipping Policy</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-[color:var(--cream)]/50">
        © {new Date().getFullYear()} {name}. All rights reserved.
      </div>
    </footer>
  );
}
