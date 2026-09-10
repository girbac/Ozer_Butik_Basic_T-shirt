"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BagIcon } from "@/components/Icons";

/*
 * Sabit üst bar. Mobilde menü yok — sitede zaten tek bir ürün listesi var,
 * hamburger menü gereksiz bir engel olurdu. Sadece logo ve sepet.
 *
 * Sepet düğmesi yuvarlak beyaz bir hap: sayfadaki her kontrol gibi yuvarlak,
 * ve tuvalin üzerinde gölgeyle yüzüyor.
 */
export function Header({ announcement }: { announcement: string }) {
  const { itemCount, openDrawer, isReady } = useCart();

  return (
    <>
      {/* Duyuru şeridi koyu bant — sayfadaki tek koyu yüzey, moru harcamıyor */}
      <div className="bg-slate text-white">
        <p className="container-page py-2.5 text-center text-xs leading-tight">
          {announcement}
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between">
          <Link
            href="/"
            className="display text-lg sm:text-xl"
            aria-label="Özer Butik ana sayfa"
          >
            özer butik
            {/* Morun ikinci görevi: markanın kendisi. Süs değil, imza. */}
            <span aria-hidden="true" className="text-accent">
              .
            </span>
          </Link>

          <button
            type="button"
            onClick={openDrawer}
            className="relative -mr-1 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface shadow-[var(--shadow-chip)] transition-shadow hover:shadow-[var(--shadow-lift)]"
            aria-label={
              isReady && itemCount > 0 ? `Sepeti aç, ${itemCount} ürün` : "Sepeti aç"
            }
          >
            <BagIcon className="h-5 w-5" />
            {isReady && itemCount > 0 && (
              /*
                key={itemCount}: sayı her değiştiğinde React bu ögeyi yeniden
                bağlar ve sıçrama animasyonu baştan oynar. Sepet çekmecesi
                kendiliğinden açılmadığı için eklemenin fark edilmesi buna
                bağlı — ayrıca bir state tutmaya gerek kalmıyor.
              */
              <span
                key={itemCount}
                className="badge-pop absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-medium text-white"
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>
    </>
  );
}
