import type { Metadata } from "next";
import { cookies } from "next/headers";
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
        <TenantProvider initialProfile={tenantProfile}>
          <AuthProvider initialUser={initialUser}>
            <CartProvider initialCart={initialCart}>
              <WishlistProvider>
                <PromoBanner promotions={promotions} />
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
