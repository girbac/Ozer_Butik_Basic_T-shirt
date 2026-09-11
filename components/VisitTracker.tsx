"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  subscribeConsent,
} from "@/lib/consent-store";

/*
 * Hangi sayfada ne kadar kalındığını ölçer.
 *
 * Nasıl çalışıyor: her adres değişiminde sayaç sıfırlanır; sayfadan ayrılırken
 * (başka sayfaya geçiş, sekmeyi kapatma, uygulamayı arka plana atma) geçen süre
 * sunucuya gönderilir.
 *
 * sendBeacon kullanılıyor çünkü sıradan bir fetch, sayfa kapanırken tarayıcı
 * tarafından iptal edilir — yani en çok merak edilen veri (çıkış sayfasında
 * geçirilen süre) hiç kaydedilmezdi.
 *
 * KİŞİSEL VERİ YOK: kalıcı çerez, IP veya parmak izi yok. visitId sekme
 * kapanınca silinen rastgele bir numara. Bu yüzden ölçtüğümüz şey "kaç kişi"
 * değil "kaç ziyaret" — panelde de öyle yazıyor.
 */

const VISIT_KEY = "ozer-butik-ziyaret-v1";

/** Sekme başına rastgele numara. Kişiyle değil, o ziyaretle ilişkili. */
function visitId(): string {
  try {
    const mevcut = window.sessionStorage.getItem(VISIT_KEY);
    if (mevcut) return mevcut;
    const yeni = crypto.randomUUID();
    window.sessionStorage.setItem(VISIT_KEY, yeni);
    return yeni;
  } catch {
    // Gizli sekmede erişim hata verebilir; o ziyaret tek seferlik sayılır.
    return crypto.randomUUID();
  }
}

function device(): "mobil" | "masaustu" {
  return window.matchMedia("(max-width: 767px)").matches ? "mobil" : "masaustu";
}

export function VisitTracker() {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const pathname = usePathname();

  /*
   * Süre ve "gönderildi mi" bilgisi ref'te tutuluyor, state'te değil: bunlar
   * ekranda hiçbir şey değiştirmiyor, state olsalardı her ölçüm gereksiz bir
   * yeniden çizime yol açardı.
   */
  const startRef = useRef(0);
  const sentRef = useRef(false);

  useEffect(() => {
    if (consent !== "kabul") return;

    const path = pathname;
    startRef.current = Date.now();
    sentRef.current = false;

    const gonder = () => {
      if (sentRef.current) return;
      sentRef.current = true;

      const govde = JSON.stringify({
        path,
        visitId: visitId(),
        durationMs: Date.now() - startRef.current,
        device: device(),
      });

      try {
        const blob = new Blob([govde], { type: "application/json" });
        // sendBeacon yoksa (çok eski tarayıcı) keepalive'lı fetch'e düşülüyor.
        if (!navigator.sendBeacon?.("/api/olcum", blob)) {
          void fetch("/api/olcum", { method: "POST", body: govde, keepalive: true });
        }
      } catch {
        // Ölçüm gönderilemezse sessizce geçiyoruz; müşteriye yansımamalı.
      }
    };

    const gorunurlukDegisti = () => {
      if (document.visibilityState === "hidden") {
        gonder();
      } else {
        // Sekmeye geri dönüldü: yeni bir süre dilimi başlasın, yoksa arka planda
        // geçen saatler "sayfada geçirilen süre" gibi görünürdü.
        startRef.current = Date.now();
        sentRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", gorunurlukDegisti);

    return () => {
      document.removeEventListener("visibilitychange", gorunurlukDegisti);
      // Adres değişti veya bileşen kalktı: bu sayfadaki süreyi kapat.
      gonder();
    };
  }, [pathname, consent]);

  return null;
}
