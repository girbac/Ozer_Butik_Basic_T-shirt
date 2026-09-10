"use client";

import { useActionState, useState } from "react";
import { deleteCouponAction, toggleCouponAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";

export type CouponRow = {
  id: string;
  code: string;
  kind: "PERCENT" | "AMOUNT";
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: Date | null;
};

/** 2026-12-31 → "31.12.2026". Saat gösterilmiyor: kupon günlük düşünülüyor. */
function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function CouponList({ coupons }: { coupons: CouponRow[] }) {
  if (coupons.length === 0) {
    return (
      <p className="card mt-6 p-8 text-center text-sm text-ink-muted">
        Henüz kupon yok. Aşağıdan ilk kuponunuzu oluşturabilirsiniz.
      </p>
    );
  }

  return (
    <ul className="mt-6 grid gap-3">
      {coupons.map((coupon) => (
        <li key={coupon.id}>
          <CouponCard coupon={coupon} />
        </li>
      ))}
    </ul>
  );
}

function CouponCard({ coupon }: { coupon: CouponRow }) {
  const [toggleState, toggleAction, isToggling] = useActionState(toggleCouponAction, {});
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteCouponAction, {});
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);

  const isExpired = coupon.expiresAt !== null && coupon.expiresAt < new Date();
  const isUsedUp = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;

  /*
   * "Kapalı" ile "süresi dolmuş" ayrı şeyler: ilki mağaza sahibinin kararı,
   * ikincisi kuponun kendi kuralı. Aynı gri rozetle gösterilseydi, çalışmayan
   * bir kuponun neden çalışmadığı anlaşılmazdı.
   */
  const status = !coupon.active
    ? { label: "Kapalı", tone: "bg-surface-2 text-ink-muted" }
    : isExpired
      ? { label: "Süresi dolmuş", tone: "bg-danger/8 text-danger" }
      : isUsedUp
        ? { label: "Sınıra ulaştı", tone: "bg-danger/8 text-danger" }
        : { label: "Yayında", tone: "bg-success/10 text-success" };

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="display font-mono text-lg tracking-normal">{coupon.code}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {coupon.kind === "PERCENT"
              ? `%${coupon.value} indirim`
              : `${formatPrice(coupon.value)} indirim`}
            {coupon.minSubtotal > 0 && ` · en az ${formatPrice(coupon.minSubtotal)} sepette`}
          </p>
        </div>

        <span className={`chip shrink-0 ${status.tone}`}>{status.label}</span>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-ink-muted">Kullanım</dt>
          <dd className="font-medium">
            {coupon.usedCount}
            {coupon.maxUses !== null ? ` / ${coupon.maxUses}` : " (sınırsız)"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Son kullanma</dt>
          <dd className="font-medium">
            {coupon.expiresAt ? formatDay(coupon.expiresAt) : "Süresiz"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <form action={toggleAction}>
          <input type="hidden" name="id" value={coupon.id} />
          <button type="submit" disabled={isToggling} className="btn-secondary">
            {isToggling ? "…" : coupon.active ? "Kapat" : "Aç"}
          </button>
        </form>

        {isConfirmingDelete ? (
          <form action={deleteAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="id" value={coupon.id} />
            <span className="text-sm text-ink-muted">Silinsin mi?</span>
            <button
              type="submit"
              disabled={isDeleting}
              className="rounded-full bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isDeleting ? "Siliniyor…" : "Evet, sil"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="link-quiet text-sm text-ink-muted"
            >
              Vazgeç
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="link-quiet text-sm text-ink-muted transition-colors hover:text-danger"
          >
            Sil
          </button>
        )}
      </div>

      {(toggleState.error || deleteState.error) && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {toggleState.error ?? deleteState.error}
        </p>
      )}
      {(toggleState.success || deleteState.success) && (
        <p role="status" className="mt-3 text-sm text-success">
          {toggleState.success ?? deleteState.success}
        </p>
      )}
    </div>
  );
}
