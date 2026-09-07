"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/Icons";

/*
 * Sağdan açılan sepet çekmecesi. Mobilde ekranın tamamına yakınını kaplar,
 * masaüstünde 420px genişliğinde bir panel olur.
 */
export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, updateQuantity, removeItem, subtotal } =
    useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC ile kapansın
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Açılınca odağı panele taşı — klavye ve ekran okuyucu kullanıcıları için
  useEffect(() => {
    if (isDrawerOpen) panelRef.current?.focus();
  }, [isDrawerOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 ${isDrawerOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isDrawerOpen}
    >
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${
          isDrawerOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeDrawer}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sepet"
        tabIndex={-1}
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-bg shadow-xl transition-transform duration-200 ease-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <h2 className="text-sm font-medium uppercase tracking-widest">Sepet</h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="-mr-2 flex h-10 w-10 items-center justify-center"
            aria-label="Sepeti kapat"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-ink-muted">Sepetiniz boş.</p>
            <button type="button" onClick={closeDrawer} className="btn-secondary">
              Modellere Dön
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-4">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3 py-4">
                  <Link
                    href={`/urun/${item.productSlug}`}
                    onClick={closeDrawer}
                    className="relative aspect-4/5 w-20 shrink-0 overflow-hidden bg-surface"
                  >
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/urun/${item.productSlug}`}
                      onClick={closeDrawer}
                      className="truncate text-sm font-medium"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-1 text-xs text-ink-muted">
                      {item.colorName} · {item.size}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center"
                          aria-label={`${item.productName} adedini azalt`}
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center"
                          aria-label={`${item.productName} adedini artır`}
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-medium tabular-nums">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="mt-2 self-start text-xs text-ink-muted underline underline-offset-2 transition-colors hover:text-danger"
                    >
                      Kaldır
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">Ara toplam</span>
                <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Kargo ücreti ödeme adımında hesaplanır.
              </p>

              <Link href="/odeme" onClick={closeDrawer} className="btn-primary mt-4 w-full">
                Ödemeye Geç
              </Link>
              <Link href="/sepet" onClick={closeDrawer} className="btn-secondary mt-2 w-full">
                Sepeti Görüntüle
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
