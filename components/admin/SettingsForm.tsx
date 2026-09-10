"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/app/admin/actions";
import type { StoreSettings } from "@/lib/settings";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, {});

  return (
    <form action={formAction} className="card p-5">
      <div>
        <label htmlFor="shippingFee" className="block text-sm font-medium">
          Kargo ücreti (TL)
        </label>
        <input
          id="shippingFee"
          name="shippingFee"
          inputMode="decimal"
          defaultValue={(settings.shippingFee / 100).toFixed(2)}
          className="field mt-1.5"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="freeShippingThreshold" className="block text-sm font-medium">
          Ücretsiz kargo eşiği (TL)
        </label>
        <input
          id="freeShippingThreshold"
          name="freeShippingThreshold"
          inputMode="decimal"
          defaultValue={(settings.freeShippingThreshold / 100).toFixed(2)}
          className="field mt-1.5"
        />
        <p className="mt-1.5 text-xs text-ink-muted">
          Bu tutarın üzerindeki siparişlerde kargo ücretsiz olur. Kargo ve Teslimat
          sayfası da bu değeri gösterir.
        </p>
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

      <button type="submit" disabled={isPending} className="btn-primary mt-5 w-full">
        {isPending ? "Kaydediliyor…" : "Ayarları Kaydet"}
      </button>
    </form>
  );
}
