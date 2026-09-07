import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { CartDrawer } from "@/components/CartDrawer";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSettings } from "@/lib/settings";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"], // latin-ext: Türkçe ğ ş ı İ karakterleri için
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Özer Butik — Basic T-shirt",
    template: "%s · Özer Butik",
  },
  description:
    "Beş model basic t-shirt. %100 pamuk, ağır gramaj, sade kalıplar. 500 TL üzeri ücretsiz kargo, 14 gün içinde iade.",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Özer Butik",
    images: ["/og.webp"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Kullanıcının yakınlaştırmasını engellemiyoruz — erişilebilirlik için önemli.
  themeColor: "#111111",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <Header announcement={settings.announcement} />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
