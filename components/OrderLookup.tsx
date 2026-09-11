"use client";

import { useActionState } from "react";
import { lookupOrderAction, type TakipSonucu } from "@/lib/actions/order-lookup";
import { formatDate, formatPrice } from "@/lib/format";
import { CheckIcon, TruckIcon } from "@/components/Icons";

/*
 * Sipariş takip formu ve sonucu.
 *
 * Tek soruya cevap veriyor: "kargom nerede?" O yüzden en üstte durum var,
 * tutar ve ürünler altta. Sipariş özetini yukarı koysaydık müşteri aradığı
 * bilgiye ulaşmak için okumak zorunda kalırdı.
 */

/** Durum kodu → müşterinin anlayacağı karşılık. */
const DURUMLAR: Record<string, { baslik: string; aciklama: string }> = {
  PAID: {
    baslik: "Siparişiniz hazırlanıyor",
    aciklama: "Ödemeniz alındı. Ürününüz paketleniyor, kargoya verilince buraya takip numarası düşecek.",
  },
  SHIPPED: {
    baslik: "Kargoya verildi",
    aciklama: "Siparişiniz yola çıktı. Takip numarasıyla kargo firmasının sitesinden izleyebilirsiniz.",
  },
  DELIVERED: {
    baslik: "Teslim edildi",
    aciklama: "Siparişiniz teslim edildi. Bir sorun varsa 14 gün içinde iade edebilirsiniz.",
  },
  CANCELLED: {
    baslik: "Sipariş iptal edildi",
    aciklama: "Bu sipariş iptal edilmiş. Ödeme alındıysa iadesi yapılmıştır.",
  },
  REFUNDED: {
    baslik: "İade edildi",
    aciklama: "Bu siparişin iadesi tamamlandı. Tutar kartınıza birkaç iş günü içinde geçer.",
  },
};

/** Normal akıştaki üç durak. İptal/iade bunun dışında olduğu için çizgi gösterilmez. */
const ADIMLAR = ["PAID", "SHIPPED", "DELIVERED"] as const;

export function OrderLookup() {
  const [state, formAction, isPending] = useActionState<TakipSonucu, FormData>(
    lookupOrderAction,
    { durum: "bos" },
  );

  return (
    <>
      <form action={formAction} className="card p-5 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="orderNo" className="block text-sm font-medium">
              Sipariş numarası
            </label>
            <input
              id="orderNo"
              name="orderNo"
              required
              autoFocus
              spellCheck={false}
              placeholder="OB-2026-1234"
              className="field mt-1.5 font-mono"
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              Sipariş onay e-postanızın konusunda yazıyor.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              E-posta adresiniz
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              placeholder="ornek@eposta.com"
              className="field mt-1.5"
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              Siparişi verirken kullandığınız adres.
            </p>
          </div>
        </div>

        {state.durum === "hata" && (
          <p role="alert" className="mt-4 rounded-2xl bg-danger/8 px-4 py-3 text-sm leading-relaxed text-danger">
            {state.mesaj}
          </p>
        )}

        <button type="submit" disabled={isPending} className="btn-primary mt-5 w-full sm:w-auto">
          {isPending ? "Aranıyor…" : "Siparişimi Bul"}
        </button>
      </form>

      {state.durum === "bulundu" && <Sonuc siparis={state.siparis} />}
    </>
  );
}

function Sonuc({ siparis }: { siparis: Extract<TakipSonucu, { durum: "bulundu" }>["siparis"] }) {
  const durum = DURUMLAR[siparis.status] ?? {
    baslik: "Siparişiniz alındı",
    aciklama: "Siparişiniz kayıtlarımızda görünüyor.",
  };
  const adimIndex = ADIMLAR.indexOf(siparis.status as (typeof ADIMLAR)[number]);
  const normalAkis = adimIndex !== -1;

  return (
    <div className="mt-6">
      <div className="card p-5 md:p-6">
        <p className="label">Sipariş {siparis.orderNo}</p>
        <h2 className="display mt-2 text-xl md:text-2xl">{durum.baslik}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{durum.aciklama}</p>

        {/* Nerede olduğunu tek bakışta gösteren çizgi */}
        {normalAkis && (
          <ol className="mt-6 flex items-center gap-2">
            {ADIMLAR.map((adim, index) => {
              const gecildi = index <= adimIndex;
              return (
                <li key={adim} className="flex flex-1 items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                      gecildi ? "bg-accent text-white" : "bg-surface-2 text-ink-muted"
                    }`}
                  >
                    {gecildi ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className="hidden text-xs text-ink-muted sm:block">
                    {DURUMLAR[adim].baslik}
                  </span>
                  {index < ADIMLAR.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`h-0.5 flex-1 rounded-full ${
                        index < adimIndex ? "bg-accent" : "bg-line"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {siparis.trackingCode && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
            <TruckIcon className="h-5 w-5 shrink-0 text-ink-muted" />
            <div className="min-w-0">
              <p className="text-xs text-ink-muted">Kargo takip numarası</p>
              <p className="font-mono text-sm break-all">{siparis.trackingCode}</p>
            </div>
          </div>
        )}

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-5 text-sm">
          <div>
            <dt className="text-xs text-ink-muted">Sipariş tarihi</dt>
            <dd className="mt-0.5">{formatDate(siparis.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Teslimat</dt>
            <dd className="mt-0.5">
              {siparis.district} / {siparis.city}
            </dd>
          </div>
        </dl>
      </div>

      <div className="card mt-4 p-5 md:p-6">
        <h3 className="label">Sipariş içeriği</h3>
        <ul className="mt-4 space-y-3 border-b border-line pb-4">
          {siparis.items.map((item, index) => (
            <li key={index} className="flex gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p>{item.productName}</p>
                <p className="text-xs text-ink-muted">
                  {item.colorName} · {item.size} · {item.quantity} adet
                </p>
              </div>
              <p className="shrink-0 tabular-nums">
                {formatPrice(item.unitPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Ara toplam</dt>
            <dd className="tabular-nums">{formatPrice(siparis.subtotal)}</dd>
          </div>
          {siparis.discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>İndirim{siparis.couponCode ? ` (${siparis.couponCode})` : ""}</dt>
              <dd className="tabular-nums">−{formatPrice(siparis.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-muted">Kargo</dt>
            <dd className="tabular-nums">
              {siparis.shippingFee === 0 ? "Ücretsiz" : formatPrice(siparis.shippingFee)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Toplam</dt>
            <dd className="tabular-nums">{formatPrice(siparis.total)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
