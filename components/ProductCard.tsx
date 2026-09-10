"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/products";

/*
 * Vitrin kartı. "Ne alacağını bilen kullanıcı" hedefinin somut karşılığı:
 * kartın üzerinden beden seçip doğrudan sepete eklenebiliyor, ürün sayfasına
 * girmeye gerek kalmıyor.
 *
 * Biçim: tuvalin üzerinde yüzen beyaz kart. Kartın yarıçapı (28px) içindeki
 * görselin yarıçapından (20px) 8px büyük; aradaki fark ince bir beyaz çerçeve
 * oluşturuyor ve ürün kartın kenarına yapışmıyor.
 *
 * Beden butonları hover'da gizlenmiyor — gizli davranış keşfedilmez. Bunun yerine
 * kartın KENDİ genişliğine bakıyoruz (container query): dar kartta (telefonda 2 sütun)
 * butonlar parmakla basılamayacak kadar küçüleceği için gizleniyor, kullanıcı ürün
 * sayfasına girip oradaki büyük beden butonlarını kullanıyor.
 */
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

  const color = product.colors[activeColorIndex];
  const image = color?.images[0];
  const isSoldOut = product.colors.every((c) => c.sizes.every((s) => s.stock === 0));

  function handleQuickAdd(variantId: string, size: string) {
    if (!color || !image) return;
    addItem({
      variantId,
      productSlug: product.slug,
      productName: product.name,
      colorName: color.name,
      size,
      unitPrice: product.price,
      image: image.url,
    });
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
        className={`flex flex-col px-1.5 pb-1.5 pt-3 ${
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
          <p className={`mt-1 text-xs text-ink-muted ${featured ? "" : "hidden @min-[240px]:block"}`}>
            {product.tagline}
          </p>
        )}

        {product.colors.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5" role="group" aria-label="Renk seçimi">
            {product.colors.map((option, index) => (
              <button
                key={option.name}
                type="button"
                onClick={() => setActiveColorIndex(index)}
                aria-pressed={index === activeColorIndex}
                aria-label={option.name}
                title={option.name}
                className={`h-7 w-7 rounded-full border p-[3px] transition-colors ${
                  index === activeColorIndex ? "border-ink" : "border-transparent"
                }`}
              >
                <span
                  className="block h-full w-full rounded-full border border-line"
                  style={{ backgroundColor: option.hex }}
                />
              </button>
            ))}
          </div>
        )}

        {color && (
          <div className={`mt-3 ${featured ? "" : "hidden @min-[240px]:block"}`}>
            <p className="label mb-1.5">Hızlı ekle</p>
            <div className="flex flex-wrap gap-1.5">
              {color.sizes.map((size) => {
                const outOfStock = size.stock === 0;
                return (
                  <button
                    key={size.variantId}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => handleQuickAdd(size.variantId, size.size)}
                    aria-label={
                      outOfStock
                        ? `${product.name} ${color.name} ${size.size} tükendi`
                        : `${product.name} ${color.name} ${size.size} bedeni sepete ekle`
                    }
                    className={`h-9 min-w-9 rounded-full border px-2.5 text-xs font-medium transition-colors ${
                      outOfStock
                        ? "cursor-not-allowed border-line text-disabled line-through"
                        : "border-line hover:border-accent hover:bg-accent hover:text-white"
                    }`}
                  >
                    {size.size}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
