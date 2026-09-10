"use client";

import { useActionState, useState } from "react";
import { createCouponAction } from "@/app/admin/actions";
import { MAX_PERCENT } from "@/lib/coupon-math";

/*
 * Yeni kupon formu.
 *
 * Kapalı başlıyor: kupon oluşturmak seyrek yapılan bir iş, form sürekli açık
 * dursaydı asıl bakılan şeyi — mevcut kuponların listesini — aşağı iterdi.
 *
 * İndirim türü seçimi alanın etiketini de değiştiriyor ("Yüzde (%)" ↔ "Tutar (TL)").
 * Tek bir "değer" kutusu bırakıp yanına birim yazmak, 20 TL indirim vermek
 * isteyip 20 yazan birinin sepetin %20'sini vermesine yol açardı.
 */
export function NewCouponForm() {
  const [state, formAction, isPending] = useActionState(createCouponAction, {});
  const [isOpen, setOpen] = useState(false);
  const [kind, setKind] = useState<"PERCENT" | "AMOUNT">("PERCENT");

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary mt-6">
        + Yeni kupon oluştur
      </button>
    );
  }

  return (
    <form action={formAction} className="card mt-6 p-5">
      <h2 className="display text-lg">Yeni kupon</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="kupon-kod" className="block text-sm font-medium">
            Kupon kodu
          </label>
          <input
            id="kupon-kod"
            name="code"
            required
            maxLength={24}
            autoFocus
            spellCheck={false}
            placeholder="Örn. YAZ25"
            /*
             * Yazarken büyük harfe çeviriyor — müşterinin göreceği kod bu.
             * Sunucu zaten normalize ediyor; buradaki sadece görsel karşılık.
             */
            className="field mt-1.5 font-mono uppercase"
          />
          <p className="mt-1.5 text-xs text-ink-muted">
            Harf ve rakam, 3-24 karakter. Müşteri küçük harfle yazsa da çalışır.
          </p>
        </div>

        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium">İndirim türü</legend>
          <div className="mt-1.5 flex gap-2">
            {(
              [
                { value: "PERCENT", label: "Yüzde indirim" },
                { value: "AMOUNT", label: "Tutar indirimi" },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={`chip cursor-pointer ${
                  kind === option.value ? "border-accent bg-accent-soft text-accent-deep" : ""
                }`}
              >
                <input
                  type="radio"
                  name="kind"
                  value={option.value}
                  checked={kind === option.value}
                  onChange={() => setKind(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="kupon-deger" className="block text-sm font-medium">
            {kind === "PERCENT" ? "İndirim oranı (%)" : "İndirim tutarı (TL)"}
          </label>
          <input
            id="kupon-deger"
            name="value"
            required
            inputMode="decimal"
            placeholder={kind === "PERCENT" ? "25" : "100"}
            className="field mt-1.5"
          />
          {kind === "PERCENT" && (
            <p className="mt-1.5 text-xs text-ink-muted">En fazla %{MAX_PERCENT}.</p>
          )}
        </div>

        <div>
          <label htmlFor="kupon-alt-limit" className="block text-sm font-medium">
            En az sepet tutarı (TL)
          </label>
          <input
            id="kupon-alt-limit"
            name="minSubtotal"
            inputMode="decimal"
            placeholder="0"
            className="field mt-1.5"
          />
          <p className="mt-1.5 text-xs text-ink-muted">Boş bırakırsanız limit yok.</p>
        </div>

        <div>
          <label htmlFor="kupon-limit" className="block text-sm font-medium">
            Kaç kez kullanılabilir?
          </label>
          <input
            id="kupon-limit"
            name="maxUses"
            inputMode="numeric"
            placeholder="Sınırsız"
            className="field mt-1.5"
          />
          <p className="mt-1.5 text-xs text-ink-muted">
            Sayaç yalnızca ödeme başarılı olunca artar.
          </p>
        </div>

        <div>
          <label htmlFor="kupon-bitis" className="block text-sm font-medium">
            Son kullanma tarihi
          </label>
          <input id="kupon-bitis" name="expiresAt" type="date" className="field mt-1.5" />
          <p className="mt-1.5 text-xs text-ink-muted">
            O günün sonuna kadar geçerli. Boş bırakırsanız süresiz.
          </p>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="mt-4 text-sm text-success">
          {state.success}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Oluşturuluyor…" : "Kuponu Oluştur"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="link-quiet text-sm text-ink-muted"
        >
          Kapat
        </button>
      </div>
    </form>
  );
}
