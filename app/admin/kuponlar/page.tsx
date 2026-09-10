import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CouponList, type CouponRow } from "@/components/admin/CouponList";
import { NewCouponForm } from "@/components/admin/NewCouponForm";

export const metadata: Metadata = {
  title: "Kuponlar",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  /*
   * Yayındakiler üstte, sonra en yeniler. Kapatılmış eski kampanyalar listenin
   * dibine iniyor ama silinmiyor — hangi kodun ne yaptığı kayıt olarak kalıyor.
   */
  const coupons = await prisma.coupon.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="container-page py-8">
      <h1 className="display text-2xl md:text-3xl">İndirim kuponları</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
        Müşteri kodu ödeme sayfasındaki <strong className="text-ink">“İndirim kodum var”</strong>{" "}
        bağlantısına tıklayıp giriyor. İndirim her zaman sunucuda yeniden hesaplanıyor,
        yani tarayıcıdan gelen tutara güvenilmiyor.
      </p>

      <CouponList coupons={coupons as CouponRow[]} />
      <NewCouponForm />
    </div>
  );
}
