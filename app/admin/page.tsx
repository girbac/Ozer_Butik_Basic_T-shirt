import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Siparişler",
  robots: { index: false, follow: false },
};

// Sipariş listesi her zaman güncel olmalı.
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ödeme bekliyor",
  PAID: "Ödendi",
  FAILED: "Başarısız",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal",
  REFUNDED: "İade edildi",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-surface-2 text-ink-muted",
  PAID: "bg-success/12 text-success",
  FAILED: "bg-danger/12 text-danger",
  SHIPPED: "bg-accent/12 text-accent",
  DELIVERED: "bg-ink text-white",
  CANCELLED: "bg-surface-2 text-ink-muted line-through",
  REFUNDED: "bg-surface-2 text-ink-muted",
};

export default async function AdminOrdersPage() {
  const [orders, paidCount, revenue] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true },
    }),
    prisma.order.count({ where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } } }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
      _sum: { total: true },
    }),
  ]);

  const needsAttention = orders.filter((order) => order.errorMessage?.startsWith("DİKKAT"));

  return (
    <div className="container-page py-8">
      <h1 className="display text-2xl md:text-3xl">Siparişler</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="card p-4">
          <p className="label">Ödenen sipariş</p>
          <p className="mt-1 text-xl font-medium tabular-nums">{paidCount}</p>
        </div>
        <div className="card p-4">
          <p className="label">Toplam ciro</p>
          <p className="mt-1 text-xl font-medium tabular-nums">
            {formatPrice(revenue._sum.total ?? 0)}
          </p>
        </div>
      </div>

      {needsAttention.length > 0 && (
        <div role="alert" className="mt-6 rounded-2xl bg-danger/8 p-4">
          <p className="text-sm font-medium text-danger">
            {needsAttention.length} siparişte stok sorunu var
          </p>
          <ul className="mt-2 space-y-1">
            {needsAttention.map((order) => (
              <li key={order.id} className="text-sm text-ink-muted">
                <Link href={`/admin/siparis/${order.id}`} className="link-quiet">
                  {order.orderNo}
                </Link>{" "}
                — {order.errorMessage}
              </li>
            ))}
          </ul>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">Henüz sipariş yok.</p>
      ) : (
        <ul className="card mt-6 divide-y divide-line px-5">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/siparis/${order.id}`}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium tabular-nums">{order.orderNo}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] ${
                        STATUS_STYLES[order.status] ?? "bg-surface-2"
                      }`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-ink-muted">
                    {order.fullName} · {order.district}/{order.city} ·{" "}
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} ürün
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-0.5">
                  <span className="font-medium tabular-nums">{formatPrice(order.total)}</span>
                  <span className="text-xs text-ink-muted">{formatDate(order.createdAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { STATUS_LABELS };
