"use client";

import { useActionState } from "react";
import { updateOrderAction } from "@/app/admin/actions";

const STATUS_OPTIONS = [
  { value: "PAID", label: "Ödendi" },
  { value: "SHIPPED", label: "Kargoya verildi" },
  { value: "DELIVERED", label: "Teslim edildi" },
  { value: "CANCELLED", label: "İptal edildi" },
  { value: "REFUNDED", label: "İade edildi" },
];

export function OrderStatusForm({
  orderId,
  currentStatus,
  currentTrackingCode,
}: {
  orderId: string;
  currentStatus: string;
  currentTrackingCode: string;
}) {
  const [state, formAction, isPending] = useActionState(updateOrderAction, {});

  // Ödemesi alınmamış siparişin durumu elle değiştirilmemeli — ödeme akışı
  // tarafından yönetiliyor.
  const isEditable = !["PENDING", "FAILED"].includes(currentStatus);

  if (!isEditable) {
    return (
      <div className="border border-line p-5">
        <h2 className="label-caps">Durum</h2>
        <p className="mt-3 text-sm text-ink-muted">
          Bu siparişin ödemesi tamamlanmadığı için durumu elle değiştirilemez.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="border border-line p-5">
      <h2 className="label-caps">Durum ve Kargo</h2>

      <input type="hidden" name="id" value={orderId} />

      <label htmlFor="status" className="mt-4 block text-sm font-medium">
        Sipariş durumu
      </label>
      <select
        id="status"
        name="status"
        defaultValue={currentStatus}
        className="mt-1.5 h-12 w-full border border-line bg-bg px-3"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor="trackingCode" className="mt-4 block text-sm font-medium">
        Kargo takip numarası
      </label>
      <input
        id="trackingCode"
        name="trackingCode"
        defaultValue={currentTrackingCode}
        placeholder="Girilince müşteriye e-posta gider"
        className="mt-1.5 h-12 w-full border border-line bg-bg px-3"
      />
      <p className="mt-1.5 text-xs text-ink-muted">
        Yeni bir numara kaydettiğinizde müşteriye bilgilendirme e-postası gönderilir.
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

      <button type="submit" disabled={isPending} className="btn-primary mt-5 w-full">
        {isPending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
