import Image from "next/image";
import { getActiveProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { LockIcon, ReturnIcon, TruckIcon } from "@/components/Icons";

/*
 * Ana sayfa. Bilinçli olarak büyük bir "hero" görseli YOK — ziyaretçi ilk ekranda
 * ürünleri görmeli. Kısa bir başlıktan sonra doğrudan 5 model geliyor.
 */

export default async function HomePage() {
  const [products, settings] = await Promise.all([getActiveProducts(), getSettings()]);

  const trustItems = [
    {
      Icon: TruckIcon,
      title: `${formatPrice(settings.freeShippingThreshold)} üzeri ücretsiz kargo`,
      text: "16:00'a kadar verilen siparişler aynı gün kargoda.",
    },
    {
      Icon: ReturnIcon,
      title: "14 gün içinde iade",
      text: "Kullanılmamış ürünleri koşulsuz geri alıyoruz.",
    },
    {
      Icon: LockIcon,
      title: "Güvenli ödeme",
      text: "Tüm kartlara 3D Secure ile iyzico altyapısı.",
    },
  ];

  return (
    <>
      <section className="container-page pt-8 md:pt-12">
        <h1 className="text-3xl font-medium tracking-tight md:text-[40px]">Basic T-shirt</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-muted md:text-base">
          Beş model, %100 pamuk. Bedeninizi seçin, sepete atın — gerisi bizde.
        </p>
      </section>

      <section className="container-page mt-8 md:mt-10" aria-label="Modeller">
        {products.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-muted">
            Henüz ürün eklenmemiş.
          </p>
        ) : (
          // Telefonda 2 sütun: 5 model az kaydırmayla görünsün.
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 2} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-section border-y border-line bg-surface md:mt-section-lg">
        <div className="container-page grid gap-6 py-10 sm:grid-cols-3 md:py-12">
          {trustItems.map(({ Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-sm text-ink-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-section md:mt-section-lg">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
          <div className="relative aspect-16/10 overflow-hidden bg-surface">
            <Image
              src="/urunler/marka.webp"
              alt="Özer Butik basic t-shirt koleksiyonu"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight md:text-2xl">
              Az model, doğru model
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted md:text-base">
              Yüzlerce seçenek arasında kaybolmanızı istemiyoruz. Farklı kalıp ve
              gramajlarda beş model seçtik; her biri defalarca yıkanıp test edildi.
              Aradığınız tişört bu beşinden biri.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
