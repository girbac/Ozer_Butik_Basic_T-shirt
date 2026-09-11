"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/products";
import { CheckIcon } from "@/components/Icons";

/*
 * Vitrin kartı. "Ne alacağını bilen kullanıcı" hedefinin somut karşılığı:
 * kartın üzerinden beden seçip sepete eklenebiliyor, ürün sayfasına girmeye
 * gerek kalmıyor.
 *
 * Akış iki adım: önce bedene basılır (yalnızca SEÇİLİR), sonra "Sepete Ekle".
 * Tek adımlı olsaydı yanlış bedene dokunan kişi farkında olmadan sepete ürün
 * eklemiş olurdu; seçimi görüp onaylamak bu kazayı ortadan kaldırıyor.
 *
 * Biçim: tuvalin üzerinde yüzen beyaz kart. Kartın yarıçapı (28px) içindeki
 * görselin yarıçapından (20px) 8px büyük; aradaki fark ince bir beyaz çerçeve
 * oluşturuyor ve ürün kartın kenarına yapışmıyor.
 */

/** "Sepete eklendi" yazısının düğmede kalma süresi. */
const ADDED_FEEDBACK_MS = 2000;

/** Bu adedin altında kalan stok kartta da uyarı olarak gösterilir. */
const LOW_STOCK_THRESHOLD = 3;

export function ProductCard({
  product,
  priority = false,
  featured = false,
}: {
  product: ProductCardData;
  priority?: boolean;
  /*
   * İlk model iki sütun kaplar. Sebebi süs değil, geometri: 5 ürün 2 veya 3
   * sütunlu bir ızgaraya tam oturmaz, son sırada tek başına asılı bir kart
   * kalır. Birinci kart iki sütun kaplayınca 5 ürün her iki düzende de tam
   * dolan bir ızgaraya dönüşüyor.
   */
  featured?: boolean;
}) {
  const { addItem } = useCart();
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [showSizeHint, setShowSizeHint] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kart ekrandan kalkarsa bekleyen zamanlayıcı boşa çalışmasın
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const color = product.colors[activeColorIndex];
  const image = color?.images[0];
  const isSoldOut = product.colors.every((c) => c.sizes.every((s) => s.stock === 0));
  const selected = color?.sizes.find((size) => size.size === selectedSize) ?? null;

  function handleColorChange(index: number) {
    setActiveColorIndex(index);
    // Beden adı aynı olsa da varyant değişti; seçim sıfırlanmalı
    setSelectedSize(null);
    setJustAdded(false);
    setShowSizeHint(false);
  }

  function handleSizeSelect(size: string) {
    setSelectedSize(size);
    setJustAdded(false);
    setShowSizeHint(false);
  }

  function handleAddToCart() {
    if (!color || !image) return;

    if (!selected) {
      setShowSizeHint(true);
      return;
    }

    addItem({
      variantId: selected.variantId,
      productSlug: product.slug,
      productName: product.name,
      colorName: color.name,
      size: selected.size,
      unitPrice: product.price,
      image: image.url,
    });

    /*
     * Sepet çekmecesi artık kendiliğinden açılmıyor (bkz. lib/cart.tsx), bu
     * yüzden eklendiği burada söylenmeli — yoksa kullanıcı bir şey olup
     * olmadığını anlayamaz.
     */
    setJustAdded(true);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);
  }

  return (
    <article
      className={`card group @container flex flex-col p-2 transition-shadow duration-200 hover:shadow-[var(--shadow-float)] ${
        featured ? "col-span-2 lg:min-h-[26rem] lg:flex-row" : ""
      }`}
    >
      {/*
        Geniş kartta görsel, geniş bir çerçeveye 4:5 fotoğrafı kırparak sığmak
        yerine yanda kalıyor: masaüstünde solda görsel, sağda bilgi.
      */}
      <Link
        href={`/urun/${product.slug}`}
        className={`media relative block ${
          featured ? "aspect-square lg:aspect-auto lg:w-[46%] lg:shrink-0" : "aspect-4/5"
        }`}
        tabIndex={-1}
        aria-hidden="true"
      >
        {image && (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            priority={priority}
            sizes={
              featured
                ? "(min-width: 1024px) 360px, 100vw"
                : "(min-width: 1024px) 33vw, 50vw"
            }
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {isSoldOut && (
          <span className="absolute bottom-2.5 left-2.5 rounded-xl bg-white/90 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
            Tükendi
          </span>
        )}
      </Link>

      <div
        className={`flex flex-1 flex-col px-1.5 pb-1.5 pt-3 ${
          featured ? "lg:justify-center lg:px-8 lg:py-6" : ""
        }`}
      >
        {/* Dar kartta ad ve fiyat alt alta, geniş kartta yan yana */}
        <div className="flex flex-col gap-0.5 @min-[240px]:flex-row @min-[240px]:items-baseline @min-[240px]:justify-between @min-[240px]:gap-3">
          <h3 className={`display ${featured ? "text-lg lg:text-2xl" : "text-[15px]"}`}>
            <Link
              href={`/urun/${product.slug}`}
              className="transition-colors hover:text-accent"
            >
              {product.name}
            </Link>
          </h3>
          <p className="shrink-0 text-sm tabular-nums">
            {product.comparePrice && (
              <span className="mr-2 text-ink-muted line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
            <span className="font-medium">{formatPrice(product.price)}</span>
          </p>
        </div>

        {product.tagline && (
          <p
            className={`mt-1 text-xs text-ink-muted ${
              featured ? "" : "hidden @min-[240px]:block"
            }`}
          >
            {product.tagline}
          </p>
        )}

        {/*
          Renk noktaları — bilinçli olarak ADSIZ.

          Beş kartın her birine renk adı yazmak 15 ayrı yazı demek; dar kartta
          satıra sığmaz, kartlar farklı yükseklikte kalır. Gerek de yok: noktaya
          dokununca fotoğraf o renge geçiyor, yani müşteri rengi okumuyor,
          GÖRÜYOR. Adı, sipariş kararının verildiği yerde — ürün sayfasında —
          zaten yazılı.

          Noktanın kendisi ise ayırt edilebilir olmalı. Üç şey yapıldı ve üçü de
          DÜZENİ BÜYÜTMEDEN yapıldı — dar kartta 4 renk tek satıra sığmak zorunda,
          yoksa o kart diğerlerinden uzun kalıp ızgarayı bozuyor:

          1. Görünen daire 20px'ten 24px'e çıktı (dolgunun etrafındaki iç boşluk
             kaldırıldı, dış ölçü aynı kaldı).
          2. Çerçeve border-line (#ebebeb) yerine yarı saydam siyah: beyaz ve bej
             gibi açık renkler beyaz kartın üzerinde artık kayboluyor değil.
          3. Seçili halka box-shadow ile çiziliyor, border ile değil — böylece
             yer kaplamıyor. Arada beyaz bir boşluk bırakıyor ki siyah rengin
             etrafındaki siyah halka da görünsün. (outline kullanılamaz:
             globals.css'te klavye odağı ona ayrılmış.)

          Dokunma alanı ise ::after ile 32×44px'e genişletiliyor; bu da düzende
          yer kaplamıyor ve komşu noktayla çakışmıyor (aradaki boşluk 8px,
          genişleme her yandan 4px).
        */}
        {product.colors.length > 1 && (
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Renk seçimi"
          >
            {product.colors.map((option, index) => (
              <button
                key={option.name}
                type="button"
                onClick={() => handleColorChange(index)}
                aria-pressed={index === activeColorIndex}
                aria-label={option.name}
                title={option.name}
                style={{ backgroundColor: option.hex }}
                className={`relative h-6 w-6 rounded-full border border-black/20 transition-shadow after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] ${
                  index === activeColorIndex
                    ? "shadow-[0_0_0_2px_var(--color-surface),0_0_0_4px_var(--color-ink)]"
                    : ""
                }`}
              />
            ))}
          </div>
        )}

        {/*
          Dar kartta mt-auto: kartlar farklı yükseklikte olsa da düğmeler aynı
          hizada biter. Geniş kartta ise sütun zaten dikeyde ortalanıyor;
          ikisi birden uygulanırsa aralarında kocaman bir boşluk kalıyor.
        */}
        {color && !isSoldOut && (
          <div className={featured ? "pt-4" : "mt-auto pt-3"}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="label">Beden</span>
              {selected && (
                <span className="text-xs text-ink-muted">Seçili: {selected.size}</span>
              )}
            </div>

            {/*
              Dar kartta (telefonda 2 sütun) beş beden yan yana sığmıyor ve
              parmakla basılamayacak kadar küçülüyordu; bu yüzden dar kartta
              3 sütuna sarıyor, kart genişleyince 5'e çıkıyor.
            */}
            <div
              role="group"
              aria-label={`${product.name} beden seçimi`}
              className={`mt-1.5 grid grid-cols-3 gap-1.5 @min-[220px]:grid-cols-5 ${
                showSizeHint ? "rounded-2xl ring-1 ring-danger ring-offset-4" : ""
              }`}
            >
              {color.sizes.map((size) => {
                const outOfStock = size.stock === 0;
                const isSelected = size.size === selectedSize;
                return (
                  <button
                    key={size.variantId}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => handleSizeSelect(size.size)}
                    aria-pressed={isSelected}
                    aria-label={outOfStock ? `${size.size} — tükendi` : size.size}
                    className={`flex h-9 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                      outOfStock
                        ? "cursor-not-allowed border-line text-disabled line-through"
                        : isSelected
                          ? "border-ink bg-ink text-white"
                          : "border-line hover:border-ink"
                    }`}
                  >
                    {size.size}
                  </button>
                );
              })}
            </div>

            {showSizeHint ? (
              <p role="alert" className="mt-2 text-xs text-danger">
                Önce bir beden seçin.
              </p>
            ) : (
              selected &&
              selected.stock <= LOW_STOCK_THRESHOLD && (
                <p className="mt-2 text-xs text-accent">Son {selected.stock} adet</p>
              )
            )}

            <button type="button" onClick={handleAddToCart} className="btn-ink mt-2.5 w-full">
              {justAdded ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Sepete eklendi
                </>
              ) : (
                "Sepete Ekle"
              )}
            </button>
            {/* Ekran okuyucular için: düğme yazısı değişmese de duyurulsun */}
            <span role="status" aria-live="polite" className="sr-only">
              {justAdded ? `${product.name} sepete eklendi` : ""}
            </span>
          </div>
        )}

        {isSoldOut && (
          <div className={featured ? "pt-4" : "mt-auto pt-3"}>
            <button type="button" disabled className="btn-ink w-full">
              Tükendi
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
