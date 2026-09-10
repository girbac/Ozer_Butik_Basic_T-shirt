import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";

/*
 * Kök düzen yalnızca html/body ve yazı tipini kuruyor.
 *
 * Mağaza başlığı, alt bilgi ve sepet çekmecesi app/(shop)/layout.tsx içinde;
 * yönetim panelinin kendi düzeni app/admin/layout.tsx içinde. Böylece admin
 * sayfalarında müşteri arayüzü ve sepet JavaScript'i hiç yüklenmiyor.
 */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"], // latin-ext: Türkçe ğ ş ı İ karakterleri için
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
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
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
