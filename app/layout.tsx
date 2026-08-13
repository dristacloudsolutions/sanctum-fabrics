import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { TenantProvider } from "./contexts/TenantContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingActions from "./components/FloatingActions";
import PromoBanner from "./components/PromoBanner";
import FlashSaleModal from "./components/FlashSaleModal";
import config from "./config/config";
import { getTenantProfile, getActivePromotions, getCategoryHierarchy, getMe, getCart, Cart, CustomerProfile } from "@/lib/dristaService";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: config.seo.title,
  description: config.seo.description,
  keywords: config.seo.keywords,
  openGraph: {
    title: config.seo.title,
    description: config.seo.description,
    type: "website",
  },
  other: {
    "facebook-domain-verification": "ble67nxh8gyeh8u5zx5j4txrps3ai9",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [tenantProfile, promotions, categories] = await Promise.all([getTenantProfile(), getActivePromotions(), getCategoryHierarchy()]);

  // Read-only here — a Server Component render can't set cookies. If no cart_id
  // cookie exists yet, CartProvider lazily creates one client-side via
  // /api/cart (a Route Handler, which is allowed to set cookies).
  const cookieStore = await cookies();
  const token = cookieStore.get("sanctum_token")?.value;
  const cartId = cookieStore.get("sanctum_cart_id")?.value;

  const [initialUser, initialCart]: [CustomerProfile | null, Cart | null] = await Promise.all([
    token ? getMe(token) : Promise.resolve(null),
    cartId ? getCart(cartId, token).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '2158560111394420');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=2158560111394420&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}
        <TenantProvider initialProfile={tenantProfile}>
          <AuthProvider initialUser={initialUser}>
            <CartProvider initialCart={initialCart}>
              <WishlistProvider>
                <PromoBanner promotions={promotions} />
                <FlashSaleModal promotions={promotions} />
                <Header categories={categories} />
                <main className="flex-1">{children}</main>
                <Footer tenantProfile={tenantProfile} />
                <FloatingActions />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
