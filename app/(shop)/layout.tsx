import { CartProvider } from "@/lib/cart";
import { CartDrawer } from "@/components/CartDrawer";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSettings } from "@/lib/settings";

/** Müşteriye görünen tüm sayfaların ortak çerçevesi. */
export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  return (
    <CartProvider>
      <Header announcement={settings.announcement} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer freeShippingThreshold={settings.freeShippingThreshold} />
    </CartProvider>
  );
}
