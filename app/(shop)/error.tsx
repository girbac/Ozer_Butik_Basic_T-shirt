"use client";

import Link from "next/link";
import { useEffect } from "react";

/*
 * Beklenmedik bir hata olduğunda kullanıcıyı boş ekranda bırakmamak için.
 * Hata mesajının kendisini göstermiyoruz — teknik ayrıntı müşteriye bir şey
 * anlatmaz, üstelik iç bilgi sızdırabilir.
 */
export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[mağaza] beklenmedik hata:", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-medium tracking-tight md:text-3xl">Bir şeyler ters gitti</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
        Sayfa yüklenirken beklenmedik bir sorun oluştu. Tekrar denemek sorunu
        genellikle çözer.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-ink-muted">Hata kodu: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={reset} className="btn-primary">
          Tekrar Dene
        </button>
        <Link href="/" className="btn-secondary">
          Ana Sayfa
        </Link>
      </div>
    </div>
  );
}
