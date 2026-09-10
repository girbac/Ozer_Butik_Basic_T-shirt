"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { ProductDetail } from "@/lib/products";
import { Accordion } from "@/components/Accordion";
import { ProductGallery } from "@/components/ProductGallery";
import { SizeGuideModal } from "@/components/SizeGuideModal";
import { CheckIcon, LockIcon, MinusIcon, PlusIcon, ReturnIcon, TruckIcon } from "@/components/Icons";

/*
 * Ürün sayfası. Renk seçimi galeriyi ve beden stoklarını birlikte etkilediği için
 * galeri ve satın alma paneli tek bir state'i paylaşıyor.
 *
 * Mobil: galeri üstte, panel altta, sayfa kaydırılınca sabit alt satın alma barı.
 * Masaüstü: solda galeri, sağda yapışkan (sticky) panel.
 */

const LOW_STOCK_THRESHOLD = 3;

export function ProductDetailView({
  product,
  initialColorName,
  freeShippingThreshold,
}: {
  product: ProductDetail;
  initialColorName?: string;
  freeShippingThreshold: number;
}) {
  const router = useRouter();
  const { addItem } = useCart();

  const initialColorIndex = Math.max(
    product.colors.findIndex(
      (color) => color.name.toLowerCase() === initialColorName?.toLowerCase(),
    ),
    0,
  );

  const [colorIndex, setColorIndex] = useState(initialColorIndex);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeError, setShowSizeError] = useState(false);
  const [isSizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [isStickyBarVisible, setStickyBarVisible] = useState(false);

  const sizeSectionRef = useRef<HTMLDivElement>(null);
  const buyButtonsRef = useRef<HTMLDivElement>(null);

  const color = product.colors[colorIndex];
  const selectedSize = useMemo(
    () => color?.sizes.find((size) => size.variantId === selectedVariantId) ?? null,
    [color, selectedVariantId],
  );

  const isColorSoldOut = color?.sizes.every((size) => size.stock === 0) ?? true;

  // Renk değişince paylaşılabilir URL'i güncelle — sayfayı yeniden yüklemeden.
  useEffect(() => {
    if (!color) return;
    const url = new URL(window.location.href);
    if (colorIndex === 0) {
      url.searchParams.delete("renk");
    } else {
      url.searchParams.set("renk", color.name.toLowerCase());
    }
    window.history.replaceState(null, "", url.toString());
  }, [color, colorIndex]);

  /*
   * Mobilde sabit alt bar, asıl "Sepete Ekle" butonu ekrandan çıkınca belirir.
   * Panelin tamamını gözlemlemek yanlış olurdu: akordiyonlar açıkken panel hâlâ
   * ekranda sayılırken buton çoktan yukarıda kalmış oluyor ve kullanıcı ortada
   * satın alma butonu olmadan kalıyordu.
   */
  useEffect(() => {
    const target = buyButtonsRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyBarVisible(!entry.isIntersecting),
      { rootMargin: "-64px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function handleColorChange(index: number) {
    setColorIndex(index);
    setSelectedVariantId(null);
    setQuantity(1);
    setShowSizeError(false);
  }

  function handleSizeChange(variantId: string) {
    setSelectedVariantId(variantId);
    setShowSizeError(false);
    setQuantity(1);
  }

  function handleAddToCart(): boolean {
    if (!color || !selectedSize) {
      setShowSizeError(true);
      sizeSectionRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      return false;
    }

    addItem(
      {
        variantId: selectedSize.variantId,
        productSlug: product.slug,
        productName: product.name,
        colorName: color.name,
        size: selectedSize.size,
        unitPrice: product.price,
        image: color.images[0]?.url ?? "",
      },
      quantity,
    );
    return true;
  }

  function handleBuyNow() {
    if (handleAddToCart()) {
      router.push("/odeme");
    }
  }

  const maxQuantity = selectedSize ? Math.min(selectedSize.stock, 10) : 10;

  return (
    <>
      <div className="container-page pt-4 md:pt-8">
        <div className="grid gap-8 md:grid-cols-[58fr_42fr] md:gap-10 lg:gap-16">
          {/* min-w-0: grid öğesinin varsayılan min-width:auto değeri galeriyi taşırıyor */}
          <div className="min-w-0">
            {/* key: renk değişince galeri sıfırdan bağlansın, başa dönsün */}
            <ProductGallery
              key={color?.name ?? "bos"}
              images={color?.images ?? []}
              productName={product.name}
            />
          </div>

          <div className="card min-w-0 p-5 md:sticky md:top-24 md:self-start md:p-7">
            <h1 className="display text-[26px] leading-tight md:text-[32px]">{product.name}</h1>
            {product.tagline && (
              <p className="mt-1.5 text-sm text-ink-muted">{product.tagline}</p>
            )}

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-xl font-semibold tabular-nums md:text-2xl">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && (
                <span className="text-sm text-ink-muted line-through tabular-nums">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>

            {/* Renk seçimi */}
            {product.colors.length > 0 && (
              <div className="mt-7">
                <div className="flex items-baseline justify-between">
                  <span className="label">Renk</span>
                  <span className="text-sm text-ink-muted">{color?.name}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Renk seçimi">
                  {product.colors.map((option, index) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => handleColorChange(index)}
                      aria-pressed={index === colorIndex}
                      aria-label={option.name}
                      title={option.name}
                      className={`h-11 w-11 rounded-full border-2 p-1 transition-colors ${
                        index === colorIndex
                          ? "border-ink"
                          : "border-transparent hover:border-line"
                      }`}
                    >
                      <span
                        className="block h-full w-full rounded-full border border-line"
                        style={{ backgroundColor: option.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Beden seçimi */}
            <div ref={sizeSectionRef} className="mt-7">
              <div className="flex items-baseline justify-between">
                <span className="label">Beden</span>
                {/* -my-3 py-3: yazı boyutu aynı kalırken dokunma alanı 44px'e çıkıyor */}
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="link-quiet -my-3 py-3 text-xs text-ink-muted"
                >
                  Beden tablosu
                </button>
              </div>

              <div
                role="group"
                aria-label="Beden seçimi"
                className={`mt-3 grid grid-cols-5 gap-2 ${
                  showSizeError ? "rounded-2xl ring-1 ring-danger ring-offset-4" : ""
                }`}
              >
                {color?.sizes.map((size) => {
                  const outOfStock = size.stock === 0;
                  const isSelected = size.variantId === selectedVariantId;
                  return (
                    <button
                      key={size.variantId}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => handleSizeChange(size.variantId)}
                      aria-pressed={isSelected}
                      aria-label={outOfStock ? `${size.size} — tükendi` : size.size}
                      className={`flex h-12 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
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

              {showSizeError && (
                <p role="alert" className="mt-2 text-xs text-danger">
                  Lütfen bir beden seçin.
                </p>
              )}

              {selectedSize && selectedSize.stock <= LOW_STOCK_THRESHOLD && (
                /* Stok azlığı bir hata değil, bu yüzden danger değil accent kullanıyor */
                <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  Son {selectedSize.stock} adet
                </p>
              )}

              {isColorSoldOut && (
                <p className="mt-2 text-xs text-ink-muted">
                  Bu renk tükendi. Diğer renkleri deneyebilirsiniz.
                </p>
              )}
            </div>

            {/* Adet */}
            <div className="mt-6 flex items-center gap-4">
              <span className="label">Adet</span>
              <div className="flex items-center rounded-full border border-line">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  className="flex h-11 w-11 items-center justify-center disabled:text-disabled"
                  aria-label="Adedi azalt"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                  disabled={quantity >= maxQuantity}
                  className="flex h-11 w-11 items-center justify-center disabled:text-disabled"
                  aria-label="Adedi artır"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Satın alma butonları */}
            <div ref={buyButtonsRef} className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isColorSoldOut}
                className="btn-primary w-full"
              >
                {isColorSoldOut ? "Tükendi" : "Sepete Ekle"}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isColorSoldOut}
                className="btn-secondary w-full"
              >
                Hemen Al
              </button>
            </div>

            {/* Güven satırları — butonun hemen altında olması dönüşüm için kritik */}
            <ul className="mt-6 space-y-2.5 text-sm text-ink-muted">
              <li className="flex items-start gap-2.5">
                <TruckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                <span>16:00&apos;a kadar verilen siparişler aynı gün kargoda</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                <span>{formatPrice(freeShippingThreshold)} üzeri ücretsiz kargo</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ReturnIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                <span>14 gün içinde koşulsuz iade</span>
              </li>
              <li className="flex items-start gap-2.5">
                <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                <span>iyzico ile 3D Secure güvenli ödeme</span>
              </li>
            </ul>

            {/* Detaylar */}
            <div className="mt-8 border-t border-line">
              <Accordion title="Ürün detayları">
                <p>{product.description}</p>
                {product.fabric && <p className="mt-3">{product.fabric}</p>}
                <p className="mt-3">Modelin boyu 1.82 m, M beden giyiyor.</p>
              </Accordion>
              {product.careInfo && (
                <Accordion title="Yıkama ve bakım">
                  <p>{product.careInfo}</p>
                </Accordion>
              )}
              <Accordion title="Kargo ve iade">
                <p>
                  Siparişler hafta içi 16:00&apos;a kadar verildiğinde aynı gün kargoya
                  verilir. Teslimat genellikle 1-3 iş günü sürer.{" "}
                  {formatPrice(freeShippingThreshold)} ve üzeri siparişlerde kargo
                  ücretsizdir.
                </p>
                <p className="mt-3">
                  Ürünü teslim aldıktan sonra 14 gün içinde, kullanılmamış ve etiketi
                  sökülmemiş olması şartıyla iade edebilirsiniz. Ayrıntılar için{" "}
                  <a href="/iptal-ve-iade" className="link-quiet">
                    İptal ve İade Koşulları
                  </a>{" "}
                  sayfasına bakın.
                </p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />

      {/* Mobil sabit alt satın alma barı */}
      <div
        className={`fixed inset-x-3 bottom-3 z-30 pb-[env(safe-area-inset-bottom)] transition-all duration-200 md:hidden ${
          isStickyBarVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-full bg-surface/95 p-2 pl-5 shadow-[var(--shadow-float)] backdrop-blur-md">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-ink-muted">
              {color?.name}
              {selectedSize ? ` · ${selectedSize.size}` : ""}
            </p>
            <p className="text-sm font-medium tabular-nums">{formatPrice(product.price)}</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isColorSoldOut}
            className="btn-primary shrink-0"
          >
            {isColorSoldOut ? "Tükendi" : "Sepete Ekle"}
          </button>
        </div>
      </div>
    </>
  );
}
