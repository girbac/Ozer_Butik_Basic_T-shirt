"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import { VisitTracker } from "@/components/VisitTracker";
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  setConsent,
  subscribeConsent,
} from "@/lib/consent-store";

/*
 * Çerez onayı bandı ve ölçüm kodu.
 *
 * İkisi bilerek aynı dosyada: ölçümün izne bağlı olduğu tek bakışta görünsün,
 * ileride biri diğerinden habersiz taşınmasın.
 *
 * Tasarım kararı — band KÜÇÜK ve sayfayı kapatmıyor. Ekranı karartan, kapatana
 * kadar alışverişe izin vermeyen çerez pencereleri en çok terk ettiren
 * şeylerden biri. Burada iki düğme var, ikisi de tek dokunuşta bitiyor ve
 * hiçbir şey engellenmiyor.
 */
export function CookieConsent() {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );

  return (
    <>
      {/* Ölçümün ikisi de YALNIZCA açık rıza varsa çalışıyor.
          VisitTracker kendi veritabanımıza yazıyor (yönetim panelindeki
          "Ziyaretler" sekmesi bunu okuyor); Analytics ise Vercel'in
          panelindeki ülke/yönlendiren gibi ek bilgiler için. */}
      {consent === "kabul" && (
        <>
          <VisitTracker />
          <Analytics />
        </>
      )}

      {consent === null && (
        <div
          role="dialog"
          aria-label="Çerez tercihi"
          /*
           * z-50: sepet çekmecesinin (z-40) üstünde ama ürün sayfasındaki sabit
           * "Sepete Ekle" barını kapatmasın diye bandın kendisi ince tutuldu.
           * pb ile telefon çentiği/ev çubuğu payı bırakılıyor.
           */
          className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div className="card mx-auto flex max-w-3xl flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-ink-muted">
              Siteyi geliştirebilmek için ziyaret istatistiği topluyoruz. Kişisel
              veri veya reklam takibi yok.{" "}
              <Link href="/cerez-politikasi" className="link-quiet text-ink">
                Çerez Politikası
              </Link>
            </p>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setConsent("ret")}
                className="btn-secondary flex-1 whitespace-nowrap sm:flex-none"
              >
                İstemiyorum
              </button>
              <button
                type="button"
                onClick={() => setConsent("kabul")}
                className="btn-ink flex-1 whitespace-nowrap sm:flex-none"
              >
                Kabul et
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
