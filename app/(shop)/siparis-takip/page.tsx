import type { Metadata } from "next";
import Link from "next/link";
import { OrderLookup } from "@/components/OrderLookup";
import { STORE_INFO, isPlaceholder } from "@/lib/store-info";

export const metadata: Metadata = {
  title: "Sipariş Takibi",
  description: "Sipariş numaranız ve e-posta adresinizle siparişinizin durumunu görün.",
};

export default function OrderTrackingPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="display text-3xl md:text-4xl">Sipariş takibi</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Sipariş numaranızı ve siparişi verirken kullandığınız e-posta adresini
          girin; siparişinizin nerede olduğunu ve varsa kargo takip numarasını
          gösterelim.
        </p>

        <div className="mt-6">
          <OrderLookup />
        </div>

        <p className="mt-8 text-sm leading-relaxed text-ink-muted">
          Sipariş numaranızı bulamıyor musunuz?{" "}
          {isPlaceholder(STORE_INFO.email) ? (
            <Link href="/iletisim" className="link-quiet text-ink">
              Bize yazın
            </Link>
          ) : (
            <a href={`mailto:${STORE_INFO.email}`} className="link-quiet text-ink">
              {STORE_INFO.email}
            </a>
          )}{" "}
          adresine yazın, biz bulalım.
        </p>
      </div>
    </div>
  );
}
