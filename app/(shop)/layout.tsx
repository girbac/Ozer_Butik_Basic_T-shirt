import { CartProvider } from "@/lib/cart";
import { CartDrawer } from "@/components/CartDrawer";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSettings } from "@/lib/settings";
import { isDatabaseConfigured } from "@/lib/prisma";
import { DemoBanner } from "@/components/DemoBanner";
import { CookieConsent } from "@/components/CookieConsent";

/** Müşteriye görünen tüm sayfaların ortak çerçevesi. */
export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  return (
    <CartProvider>
      {!isDatabaseConfigured() && <DemoBanner />}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer freeShippingThreshold={settings.freeShippingThreshold} />
      {/* Ölçüm buraya bağlı: izin verilmeden Analytics yüklenmiyor. */}
      <CookieConsent />
    </CartProvider>
  );
}
