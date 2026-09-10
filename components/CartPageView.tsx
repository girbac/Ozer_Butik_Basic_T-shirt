"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { revalidateCart } from "@/lib/actions/cart";
import { useCart } from "@/lib/cart";
import { replaceCart } from "@/lib/cart-store";
import type { PricedCart } from "@/lib/cart-server";
import { formatPrice } from "@/lib/format";
import { MinusIcon, PlusIcon } from "@/components/Icons";
import { FreeShippingBar } from "@/components/FreeShippingBar";

/*
 * Sepet sayfası.
 *
 * Sepet tarayıcıda tutulduğu için, sayfa açılır açılmaz sunucuya doğrulatıyoruz:
 * ürün yayından kalkmış, stok bitmiş veya fiyat değişmiş olabilir. Gösterilen
 * tutarlar her zaman sunucunun döndürdüğü tutarlardır.
 */
export function CartPageView() {
  const { items, isReady, updateQuantity, removeItem } = useCart();
  const [priced, setPriced] = useState<PricedCart | null>(null);
  const [failed, setFailed] = useState(false);

  // Sepet boşken doğrulamaya gerek yok; boş sepet ekranı zaten aşağıda erken dönüyor.
  useEffect(() => {
    if (!isReady || items.length === 0) return;

    let cancelled = false;

    revalidateCart(items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })))
      .then((result) => {
        if (cancelled) return;
        setPriced(result);
        setFailed(false);

        // Sunucunun düzelttiği hâli yerel sepete de yaz. İçerik aynıysa replaceCart
        // hiçbir şey yapmaz, bu yüzden döngüye girmez.
        replaceCart(
          result.lines.map((line) => ({
            variantId: line.variantId,
            productSlug: line.productSlug,
            productName: line.productName,
            colorName: line.colorName,
            size: line.size,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            image: line.image ?? "",
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [items, isReady]);

  if (!isReady) {
    return (
      <div className="container-page py-16">
        <p className="text-sm text-ink-muted">Sepet yükleniyor…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-5 py-20 text-center">
        <h1 className="display text-3xl">Sepetiniz boş</h1>
        <p className="max-w-sm text-sm text-ink-muted">
          Beş modelimize göz atın; bedeninizi seçip tek adımda sipariş verebilirsiniz.
        </p>
        <Link href="/" className="btn-primary">
          Modelleri Gör
        </Link>
      </div>
    );
  }

  // İlk doğrulama tamamlanana kadar tutar göstermiyoruz — yanlış tutar göstermektense
  // beklemek daha iyi. Sonraki doğrulamalarda mevcut veri ekranda kalır.
  if (!priced) {
    return (
      <div className="container-page py-16">
        {failed ? (
          <p role="alert" className="text-sm text-danger">
            Sepet yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin.
          </p>
        ) : (
          <p className="text-sm text-ink-muted">Sepet yükleniyor…</p>
        )}
      </div>
    );
  }

  const lines = priced.lines;

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="display text-3xl md:text-4xl">Sepet</h1>

      {failed && (
        <p role="alert" className="mt-4 rounded-2xl bg-danger/8 px-4 py-3 text-sm text-danger">
          Sepet güncellenirken bir sorun oldu. Sayfayı yenileyip tekrar deneyin.
        </p>
      )}

      {priced.issues.map((issue) => (
        <p
          key={`${issue.variantId}-${issue.kind}`}
          role="status"
          className="card mt-4 px-4 py-3 text-sm"
        >
          {issue.message}
        </p>
      ))}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
        <ul className="card divide-y divide-line px-5">
          {lines.map((line) => (
            <li key={line.variantId} className="flex gap-4 py-5">
              <Link
                href={`/urun/${line.productSlug}`}
                className="media relative aspect-4/5 w-24 shrink-0 sm:w-28"
              >
                {line.image && (
                  <Image
                    src={line.image}
                    alt={line.productName}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/urun/${line.productSlug}`}
                      className="display text-base transition-colors hover:text-accent"
                    >
                      {line.productName}
                    </Link>
                    <p className="mt-1 text-xs text-ink-muted">
                      {line.colorName} · {line.size}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums">
                    {formatPrice(line.lineTotal)}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-full border border-line">
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                      className="flex h-11 w-11 items-center justify-center"
                      aria-label={`${line.productName} adedini azalt`}
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="w-9 text-center text-sm tabular-nums">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                      className="flex h-11 w-11 items-center justify-center"
                      aria-label={`${line.productName} adedini artır`}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(line.variantId)}
                    className="-my-2.5 py-2.5 text-xs text-ink-muted underline underline-offset-2 transition-colors hover:text-danger"
                  >
                    Kaldır
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Özet — masaüstünde sağda yapışkan, mobilde listenin altında */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5 md:p-6">
            <h2 className="label">Sipariş Özeti</h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Ara toplam</dt>
                <dd className="tabular-nums">{formatPrice(priced.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Kargo</dt>
                <dd className="tabular-nums">
                  {priced.shippingFee === 0 ? (
                    <span className="text-success">Ücretsiz</span>
                  ) : (
                    formatPrice(priced.shippingFee)
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
                <dt>Toplam</dt>
                <dd className="tabular-nums">{formatPrice(priced.total)}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <FreeShippingBar
                subtotal={priced.subtotal}
                threshold={priced.settings.freeShippingThreshold}
              />
            </div>

            <Link href="/odeme" className="btn-primary mt-5 w-full">
              Ödemeye Geç
            </Link>
            <Link href="/" className="btn-secondary mt-2 w-full">
              Alışverişe Devam Et
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
