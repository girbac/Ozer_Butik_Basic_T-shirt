import Image from "next/image";
import { getActiveProducts } from "@/lib/products";
import { diagnoseDatabaseError, type DatabaseDiagnosis } from "@/lib/db-error";
import type { ProductCardData } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { orderWithFeatured } from "@/lib/featured";
import { formatPrice } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { ChevronRightIcon, LockIcon, ReturnIcon, TruckIcon } from "@/components/Icons";

/*
 * Ana sayfa. Bilinçli olarak büyük bir "hero" görseli YOK — ziyaretçi ilk ekranda
 * ürünleri görmeli. Kısa bir başlık ve söz veren üç hap, hemen ardından 5 model.
 */

/*
 * Sayfa stok bilgisi gösterdiği için sonsuza kadar önbellekte kalamaz: bir müşteri
 * son ürünü aldığında burası da tazelenmeli. Admin panelinden yapılan stok/fiyat
 * değişiklikleri zaten revalidatePath ile anında yansıyor; bu süre ise vitrin
 * üzerinden yapılan satışlar için üst sınır.
 *
 * Aynı süre öne çıkan modelin saat başı değişmesini de taşıyor (bkz. lib/featured.ts):
 * saat dönünce sıradaki model en geç bir dakika içinde büyük karta geçiyor.
 */
export const revalidate = 60;

export default async function HomePage() {
  const settings = await getSettings();

  /*
   * Ürünler okunamazsa sayfayı çökertmiyoruz. Vercel'in genel "A server error
   * occurred" ekranı mağaza sahibine hiçbir şey anlatmıyordu; bunun yerine
   * sebebini ve ne yapılacağını yazıyoruz. Sorun gizlenmiyor — aksine ilk kez
   * görünür oluyor.
   */
  let products: ProductCardData[] = [];
  let problem: DatabaseDiagnosis | null = null;

  try {
    products = await getActiveProducts();
  } catch (error) {
    problem = diagnoseDatabaseError(error);
    console.error(`[anasayfa] ürünler okunamadı (${problem.code}):`, error);
  }

  const promises = [
    { Icon: TruckIcon, label: `${formatPrice(settings.freeShippingThreshold)} üzeri ücretsiz kargo` },
    { Icon: ReturnIcon, label: "14 gün içinde iade" },
    { Icon: LockIcon, label: "iyzico ile güvenli ödeme" },
  ];

  const guarantees = [
    {
      Icon: TruckIcon,
      title: "Aynı gün kargo",
      text: "Hafta içi 16:00'a kadar verilen siparişler aynı gün yola çıkar.",
    },
    {
      Icon: ReturnIcon,
      title: "Koşulsuz iade",
      text: "Kullanılmamış ürünleri 14 gün içinde geri alıyoruz, soru sormadan.",
    },
    {
      Icon: LockIcon,
      title: "Güvenli ödeme",
      text: "Tüm kartlara 3D Secure ile iyzico altyapısı üzerinden ödeme.",
    },
  ];

  return (
    <>
      {/* Açılış bandı — kaydırmadan görülen kısım. Kısa tutuluyor. */}
      <section className="container-page pt-8 text-center md:pt-12">
        <h1 className="display text-[38px] leading-[1.05] md:text-[56px]">
          Basic T-shirt
          <span aria-hidden="true" className="text-accent">
            .
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-ink-muted md:text-base">
          Beş model, %100 pamuk. Bedeninizi seçin, sepete atın — gerisi bizde.
        </p>
      </section>

      <section className="container-page mt-8 md:mt-12" aria-labelledby="modeller">
        <div className="mb-4 flex items-center gap-1.5">
          <h2 id="modeller" className="display text-xl">
            Tüm modeller
          </h2>
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
          <span className="ml-auto text-sm text-ink-muted">{products.length} model</span>
        </div>

        {problem ? (
          <DatabaseProblem problem={problem} />
        ) : products.length === 0 ? (
          <p className="card p-10 text-center text-sm text-ink-muted">
            Henüz ürün eklenmemiş.
          </p>
        ) : (
          // Telefonda 2 sütun: 5 model az kaydırmayla görünsün.
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
            {/*
              Öne çıkan model saat başı değişiyor ve DİZİNİN BAŞINA alınıyor.
              Yerinde bırakılıp sadece işaretlenseydi iki sütun kaplayan kart
              ızgaranın ortasında kalır, yanında boşluk açardı.
            */}
            {orderWithFeatured(products).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 2}
                featured={index === 0}
              />
            ))}
          </div>
        )}

        {/*
          Söz hapları ürünlerin ALTINDA: kaydırmadan görülen alanı ürünlere
          bırakıyor, sözler de tam ürünleri gördükten sonra — yani "alsam mı"
          sorusunun sorulduğu anda — okunuyor.

          Mobilde satır sığmayınca kaydırılıyor; kırpılmış görünmesin diye
          kenar boşluğu negatif margin ile geri alınıyor.
        */}
        <ul className="no-scrollbar -mx-4 mt-6 flex snap-x gap-2 overflow-x-auto px-4 md:mt-8 md:justify-center">
          {promises.map(({ Icon, label }) => (
            <li key={label} className="chip shrink-0 snap-start">
              <Icon className="h-4 w-4 shrink-0 text-ink-muted" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* Marka bloğu — görselin kendisi kart. Sayfanın tek büyük anı. */}
      <section className="container-page mt-section md:mt-section-lg">
        <div className="media relative aspect-4/3 sm:aspect-16/9 lg:aspect-21/9">
          <Image
            src="/urunler/marka.webp"
            alt="Özer Butik basic t-shirt koleksiyonu"
            fill
            sizes="(min-width: 1200px) 1152px, 100vw"
            className="object-cover"
          />
          {/* Metnin okunabilmesi için alttan yukarı koyulaşan örtü */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 via-40% to-transparent to-70%"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
            <h2 className="display max-w-lg text-2xl text-white md:text-4xl">
              Az model, doğru model
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85 md:text-base">
              Yüzlerce seçenek arasında kaybolmanızı istemiyoruz. Farklı kalıp ve
              gramajlarda beş model seçtik; her biri defalarca yıkanıp test edildi.
              Aradığınız tişört bu beşinden biri.
            </p>
          </div>
        </div>
      </section>

      {/* Güvenceler — üç yüzen kart */}
      <section className="container-page mt-section md:mt-section-lg" aria-label="Güvenceler">
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {guarantees.map(({ Icon, title, text }) => (
            <div key={title} className="card p-5 md:p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
                <Icon className="h-5 w-5 text-ink" />
              </span>
              <p className="display mt-4 text-base">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/*
 * Veritabanı bağlı ama okunamıyorken gösterilir. Teknik ayrıntıyı dökmüyor;
 * hangi sınıf sorun olduğunu ve ne yapılacağını söylüyor.
 */
function DatabaseProblem({ problem }: { problem: DatabaseDiagnosis }) {
  return (
    <div role="alert" className="card p-6 md:p-10">
      <h2 className="display text-xl text-danger md:text-2xl">{problem.title}</h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-muted">
        {problem.action}
      </p>
      <p className="mt-4 text-xs text-ink-muted">
        Teknik kod: <code>{problem.code}</code>
      </p>
    </div>
  );
}
