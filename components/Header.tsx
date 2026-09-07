"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BagIcon } from "@/components/Icons";

/*
 * Sabit üst bar. Mobilde menü yok — sitede zaten tek bir ürün listesi var,
 * hamburger menü gereksiz bir engel olurdu. Sadece logo ve sepet.
 */
export function Header({ announcement }: { announcement: string }) {
  const { itemCount, openDrawer, isReady } = useCart();

  return (
    <>
      {/* Duyuru şeridi kil renginde: sayfanın tek renkli aksanı burada başlıyor */}
      <div className="bg-accent text-bg">
        <p className="container-page py-2 text-center text-[11px] leading-tight tracking-wide sm:text-xs">
          {announcement}
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-sm">
        <div className="container-page flex h-14 items-center justify-between sm:h-16">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.18em] sm:text-base"
            aria-label="Özer Butik ana sayfa"
          >
            ÖZER BUTİK
          </Link>

          <button
            type="button"
            onClick={openDrawer}
            className="relative -mr-2 flex h-11 w-11 items-center justify-center"
            aria-label={
              isReady && itemCount > 0 ? `Sepeti aç, ${itemCount} ürün` : "Sepeti aç"
            }
          >
            <BagIcon className="h-6 w-6" />
            {isReady && itemCount > 0 && (
              <span className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-bg">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>
    </>
  );
}
