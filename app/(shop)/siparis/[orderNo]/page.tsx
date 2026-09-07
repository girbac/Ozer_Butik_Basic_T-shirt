import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByNo } from "@/lib/orders";
import { formatDate, formatPrice } from "@/lib/format";
import { CheckIcon } from "@/components/Icons";
import { ClearCartOnSuccess } from "@/components/ClearCartOnSuccess";

export const metadata: Metadata = {
  title: "Sipariş Sonucu",
  robots: { index: false, follow: false },
};

// Sipariş durumu ödeme dönüşünde değiştiği için bu sayfa her zaman taze okunmalı.
export const dynamic = "force-dynamic";

export default async function OrderResultPage(props: PageProps<"/siparis/[orderNo]">) {
  const { orderNo } = await props.params;
  const order = await getOrderByNo(orderNo);

  if (!order) {
    notFound();
  }

  const isPaid = order.status === "PAID" || order.status === "SHIPPED" || order.status === "DELIVERED";
  const isPending = order.status === "PENDING";

  return (
    <div className="container-page py-12 md:py-20">
      <div className="mx-auto max-w-xl">
        {isPaid ? (
          <>
            {/* Ödeme başarılıysa tarayıcıdaki sepeti boşalt */}
            <ClearCartOnSuccess />
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckIcon className="h-7 w-7" />
              </span>
              <h1 className="display mt-5 text-3xl md:text-4xl">Siparişiniz alındı</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Teşekkür ederiz. Sipariş özetini{" "}
                <span className="text-ink">{order.email}</span> adresine gönderdik.
                Kargoya verildiğinde takip numarasını da aynı adrese ileteceğiz.
              </p>
            </div>
          </>
        ) : isPending ? (
          <div className="flex flex-col items-center text-center">
            <h1 className="display text-3xl md:text-4xl">Siparişiniz inceleniyor</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Ödemenizin sonucunu henüz kesinleştiremedik. Kartınızdan çekim yapıldıysa
              siparişiniz kısa süre içinde onaylanacak. Emin olmak için bizimle
              iletişime geçebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <h1 className="display text-3xl md:text-4xl">Ödeme tamamlanamadı</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Siparişiniz oluşturulamadı ve kartınızdan çekim yapılmadı. Sepetiniz
              duruyor; dilerseniz tekrar deneyebilirsiniz.
            </p>
            <Link href="/sepet" className="btn-primary mt-6">
              Sepete Dön
            </Link>
          </div>
        )}

        <div className="mt-10 border border-line">
          <dl className="divide-y divide-line text-sm">
            <div className="flex justify-between gap-4 px-5 py-3.5">
              <dt className="text-ink-muted">Sipariş no</dt>
              <dd className="font-medium tabular-nums">{order.orderNo}</dd>
            </div>
            <div className="flex justify-between gap-4 px-5 py-3.5">
              <dt className="text-ink-muted">Tarih</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
            {order.trackingCode && (
              <div className="flex justify-between gap-4 px-5 py-3.5">
                <dt className="text-ink-muted">Kargo takip no</dt>
                <dd className="font-medium">{order.trackingCode}</dd>
              </div>
            )}
          </dl>

          <ul className="divide-y divide-line border-t border-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
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

          <dl className="divide-y divide-line border-t border-line text-sm">
            <div className="flex justify-between gap-4 px-5 py-3">
              <dt className="text-ink-muted">Ara toplam</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4 px-5 py-3">
              <dt className="text-ink-muted">Kargo</dt>
              <dd className="tabular-nums">
                {order.shippingFee === 0 ? "Ücretsiz" : formatPrice(order.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 px-5 py-3.5 text-base font-medium">
              <dt>Toplam</dt>
              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 text-sm text-ink-muted">
          <p>
            Teslimat adresi: {order.fullName}, {order.address}, {order.district}/{order.city}
          </p>
        </div>

        {isPaid && (
          <Link href="/" className="btn-secondary mt-8 w-full">
            Alışverişe Devam Et
          </Link>
        )}
      </div>
    </div>
  );
}
