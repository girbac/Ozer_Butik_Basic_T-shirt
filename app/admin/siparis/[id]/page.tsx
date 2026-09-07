import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export const metadata: Metadata = {
  title: "Sipariş Detayı",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage(props: PageProps<"/admin/siparis/[id]">) {
  const { id } = await props.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="container-page py-8">
      <Link href="/admin" className="text-xs text-ink-muted hover:text-ink">
        ← Siparişler
      </Link>

      <h1 className="mt-4 text-xl font-medium tracking-tight md:text-2xl">{order.orderNo}</h1>
      <p className="mt-1 text-sm text-ink-muted">{formatDate(order.createdAt)}</p>

      {order.errorMessage && (
        <p
          role="alert"
          className={`mt-4 border px-4 py-3 text-sm ${
            order.errorMessage.startsWith("DİKKAT")
              ? "border-danger text-danger"
              : "border-line text-ink-muted"
          }`}
        >
          {order.errorMessage}
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-12">
        <div className="min-w-0">
          <h2 className="text-xs font-medium uppercase tracking-widest">Ürünler</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm">{item.productName}</p>
                  <p className="text-xs text-ink-muted">
                    {item.colorName} · {item.size} · {item.quantity} adet
                  </p>
                </div>
                <p className="shrink-0 text-sm tabular-nums">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Ara toplam</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Kargo</dt>
              <dd className="tabular-nums">
                {order.shippingFee === 0 ? "Ücretsiz" : formatPrice(order.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-medium">
              <dt>Toplam</dt>
              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>

          <h2 className="mt-10 text-xs font-medium uppercase tracking-widest">Müşteri</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Ad Soyad" value={order.fullName} />
            <Row label="E-posta" value={order.email} />
            <Row label="Telefon" value={order.phone} />
            <Row label="Adres" value={`${order.address}, ${order.district}/${order.city}`} />
            {order.postalCode && <Row label="Posta kodu" value={order.postalCode} />}
            {order.note && <Row label="Sipariş notu" value={order.note} />}
            {order.iyzicoPaymentId && (
              <Row label="iyzico ödeme no" value={order.iyzicoPaymentId} />
            )}
          </dl>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            currentTrackingCode={order.trackingCode ?? ""}
          />
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="sm:text-right">{value}</dd>
    </div>
  );
}
