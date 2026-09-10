import "server-only";

import { prisma } from "@/lib/prisma";
import {
  checkCoupon,
  isValidCouponCode,
  normalizeCouponCode,
  type CouponCheck,
} from "@/lib/coupon-math";

/*
 * Kuponun veritabanıyla konuşan kısmı. Hesabın kendisi lib/coupon-math.ts'te
 * ve testlerle korunuyor; burası yalnızca kuponu bulup o hesaba veriyor.
 *
 * ÖNEMLİ: kupon hem ödeme sayfasında (gösterim için) hem sipariş oluşturulurken
 * (gerçek tutar için) doğrulanıyor. İkincisi olmadan, tarayıcıdan gönderilen
 * indirim tutarına güvenmiş olurduk.
 */

export type AppliedCoupon = {
  code: string;
  discount: number;
};

export type CouponResult =
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; reason: string };

/**
 * Kodu doğrular ve bu sepet için indirimi hesaplar.
 *
 * @param rawCode Kullanıcının yazdığı ham kod.
 * @param subtotal Sepet ara toplamı, kuruş.
 */
export async function applyCoupon(
  rawCode: string,
  subtotal: number,
): Promise<CouponResult> {
  const code = normalizeCouponCode(rawCode);

  /*
   * Biçimi bozuk kodda veritabanına hiç gitmiyoruz. Ayrıca "bulunamadı" ile
   * "biçimi bozuk" aynı cevabı veriyor: farklı cevap vermek, deneme yanılmayla
   * hangi kodların var olduğunu öğrenmeyi kolaylaştırırdı.
   */
  if (!isValidCouponCode(code)) {
    return { ok: false, reason: "Böyle bir kupon bulunamadı." };
  }

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) {
    return { ok: false, reason: "Böyle bir kupon bulunamadı." };
  }

  const result: CouponCheck = checkCoupon(coupon, subtotal);
  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  return { ok: true, coupon: { code: coupon.code, discount: result.discount } };
}
