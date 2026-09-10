"use client";

import { useActionState, useState } from "react";
import { createProductAction } from "@/app/admin/actions";

/*
 * Yeni ürün açma formu.
 *
 * Yalnızca dört alan soruyor: ad, fiyat ve ilk rengin adı/kodu. Açıklama,
 * kumaş, yıkama bilgisi gibi alanlar burada sorulmuyor — ürün oluştuktan sonra
 * kendi düzenleme kartında zaten var. Yeni ürün açarken uzun bir form doldurmak
 * zorunda kalmak, işi başlamadan yorucu hâle getirirdi.
 */
export function NewProductForm() {
  const [state, formAction, isPending] = useActionState(createProductAction, {});
  const [isOpen, setOpen] = useState(false);
  const [hex, setHex] = useState("#1a1815");

  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(hex);

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary mt-6">
        + Yeni ürün ekle
      </button>
    );
  }

  return (
    <form action={formAction} className="card mt-6 p-5 md:p-6">
      <h2 className="display text-lg">Yeni ürün</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="yeni-urun-ad" className="block text-sm font-medium">
            Ürün adı
          </label>
          <input
            id="yeni-urun-ad"
            name="name"
            required
            maxLength={80}
            autoFocus
            placeholder="Örn. Uzun Kollu Basic Tee"
            className="field mt-1.5"
          />
        </div>

        <div>
          <label htmlFor="yeni-urun-fiyat" className="block text-sm font-medium">
            Fiyat (TL)
          </label>
          <input
            id="yeni-urun-fiyat"
            name="price"
            required
            inputMode="decimal"
            placeholder="Örn. 549"
            className="field mt-1.5"
          />
        </div>

        <div>
          <label htmlFor="yeni-urun-renk" className="block text-sm font-medium">
            İlk rengin adı
          </label>
          <input
            id="yeni-urun-renk"
            name="colorName"
            required
            maxLength={30}
            defaultValue="Siyah"
            className="field mt-1.5"
          />
        </div>

        <div>
          <label htmlFor="yeni-urun-kod" className="block text-sm font-medium">
            Renk kodu
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="color"
              value={isValidHex ? hex : "#1a1815"}
              onChange={(event) => setHex(event.target.value)}
              aria-label="İlk rengi seç"
              className="h-12 w-12 shrink-0 cursor-pointer rounded-full border border-line bg-surface p-1"
            />
            <input
              id="yeni-urun-kod"
              name="hex"
              value={hex}
              onChange={(event) => setHex(event.target.value)}
              spellCheck={false}
              className="field mt-0 w-32 font-mono"
            />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        Ürün <strong className="text-ink">yayına kapalı</strong> açılır ve S-XXL bedenleri
        0 stokla oluşur. Fotoğraf, açıklama ve stok girdikten sonra listedeki kartından
        &quot;Mağazada yayında&quot; kutusunu işaretleyin.
      </p>

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="mt-3 text-sm text-success">
          {state.success}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Oluşturuluyor…" : "Ürünü Oluştur"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="link-quiet text-sm text-ink-muted"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
