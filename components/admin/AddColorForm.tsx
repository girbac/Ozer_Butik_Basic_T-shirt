"use client";

import { useActionState, useState } from "react";
import { addColorAction } from "@/app/admin/actions";

/*
 * Ürüne yeni renk ekleme formu.
 *
 * Varsayılan olarak kapalı duruyor: renk eklemek seyrek yapılan bir iş, açık
 * bırakılsaydı her ürünün altında sürekli boş bir form görünürdü.
 */
export function AddColorForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(addColorAction, {});
  const [isOpen, setOpen] = useState(false);
  const [hex, setHex] = useState("#1a1815");

  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(hex);

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary mt-3">
        + Yeni renk ekle
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 rounded-2xl border border-dashed border-disabled p-4">
      <input type="hidden" name="productId" value={productId} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-40 sm:max-w-xs">
          <label htmlFor={`yeni-renk-${productId}`} className="block text-sm font-medium">
            Renk adı
          </label>
          <input
            id={`yeni-renk-${productId}`}
            name="name"
            required
            maxLength={30}
            autoFocus
            placeholder="Örn. Bordo"
            className="field mt-1.5"
          />
        </div>

        <div>
          <label htmlFor={`yeni-kod-${productId}`} className="block text-sm font-medium">
            Renk kodu
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="color"
              value={isValidHex ? hex : "#1a1815"}
              onChange={(event) => setHex(event.target.value)}
              aria-label="Yeni rengi seç"
              className="h-12 w-12 shrink-0 cursor-pointer rounded-full border border-line bg-surface p-1"
            />
            <input
              id={`yeni-kod-${productId}`}
              name="hex"
              value={hex}
              onChange={(event) => setHex(event.target.value)}
              spellCheck={false}
              className="field mt-0 w-32 font-mono"
            />
          </div>
        </div>

        <button type="submit" disabled={isPending} className="btn-ink">
          {isPending ? "Ekleniyor…" : "Rengi Ekle"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="link-quiet pb-3 text-sm text-ink-muted"
        >
          Vazgeç
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        Ürünün tüm bedenleri <strong className="text-ink">0 stokla</strong> açılır.
        Ardından fotoğrafını yükleyip stok adetlerini girin.
      </p>

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="mt-2 text-sm text-success">
          {state.success}
        </p>
      )}
    </form>
  );
}
