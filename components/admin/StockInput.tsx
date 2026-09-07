"use client";

import { useActionState, useRef } from "react";
import { updateStockAction } from "@/app/admin/actions";

/*
 * Tek bir renk×beden kombinasyonunun stok adedi.
 *
 * Ayrı bir "kaydet" butonu yok: alandan çıkınca (blur) form gönderiliyor.
 * Beş üründe 15-20 varyant olduğu için her biri için buton koymak paneli
 * kullanılamaz hâle getirirdi.
 */
export function StockInput({
  variantId,
  size,
  stock,
}: {
  variantId: string;
  size: string;
  stock: number;
}) {
  const [state, formAction, isPending] = useActionState(updateStockAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="variantId" value={variantId} />
      <label htmlFor={`stock-${variantId}`} className="block text-xs text-ink-muted">
        {size}
      </label>
      <input
        id={`stock-${variantId}`}
        name="stock"
        type="number"
        min={0}
        step={1}
        defaultValue={stock}
        inputMode="numeric"
        onBlur={(event) => {
          // Değer gerçekten değiştiyse kaydet — her odak kaybında istek atma.
          if (Number(event.target.value) !== stock) formRef.current?.requestSubmit();
        }}
        aria-invalid={Boolean(state.error)}
        className={`mt-1 h-11 w-full border bg-bg px-2 text-center tabular-nums ${
          state.error ? "border-danger" : stock === 0 ? "border-danger/40" : "border-line"
        } ${isPending ? "opacity-60" : ""}`}
      />
      {state.error && (
        <p role="alert" className="mt-1 text-[11px] text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
