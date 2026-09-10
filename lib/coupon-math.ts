/*
 * Kupon doğrulama ve indirim hesabı — veritabanına dokunmayan saf kısım.
 *
 * Veritabanı erişiminden ayrı tutuluyor ki para hesabı testlerle doğrudan
 * sınanabilsin. Bu dosyadaki her kural için tests/coupon.test.ts'te karşılığı
 * var; indirim hesabı sitedeki en riskli aritmetiklerden biri.
 *
 * Tüm tutarlar KURUŞ. Yüzde indirimde bölme yapıldığı için sonuç aşağı
 * yuvarlanıyor (Math.floor): kuruş küsuratı müşterinin değil mağazanın
 * aleyhine yuvarlanırsa toplam tutarla ödenen tutar tutmayabilir.
 */

export type CouponKind = "PERCENT" | "AMOUNT";

/** Doğrulama için gereken kupon alanları. Prisma modelinin alt kümesi. */
export type CouponRules = {
  code: string;
  kind: CouponKind;
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
};

export type CouponCheck =
  | { ok: true; discount: number }
  | { ok: false; reason: string };

/** Yüzde indirimde izin verilen en yüksek oran. */
export const MAX_PERCENT = 90;

/**
 * Kullanıcının yazdığı kodu saklama biçimine çevirir.
 *
 * Büyük harf ve boşluksuz: müşteri "  yaz25 " yazsa da "YAZ25" ile eşleşmeli.
 * Türkçe küçük i'nin büyüğü "İ" olduğu için locale'siz toUpperCase kullanılıyor;
 * kodlar zaten a-z 0-9 ile sınırlı (bkz. isValidCouponCode).
 */
export function normalizeCouponCode(input: string): string {
  return input.trim().replace(/\s+/g, "").toUpperCase();
}

/** Kod yalnızca harf ve rakam içerebilir, 3-24 karakter. */
export function isValidCouponCode(code: string): boolean {
  return /^[A-Z0-9]{3,24}$/.test(code);
}

/**
 * Kuponun bu sepete uygulanıp uygulanamayacağını söyler ve indirimi hesaplar.
 *
 * @param coupon Kupon kuralları.
 * @param subtotal Sepet ara toplamı, kuruş.
 * @param now Şimdiki zaman; testlerde sabitlenebilsin diye dışarıdan verilebilir.
 */
export function checkCoupon(
  coupon: CouponRules,
  subtotal: number,
  now: Date = new Date(),
): CouponCheck {
  if (!coupon.active) {
    return { ok: false, reason: "Bu kupon artık geçerli değil." };
  }

  if (coupon.startsAt && now < coupon.startsAt) {
    return { ok: false, reason: "Bu kupon henüz başlamadı." };
  }

  if (coupon.expiresAt && now > coupon.expiresAt) {
    return { ok: false, reason: "Bu kuponun süresi dolmuş." };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, reason: "Bu kupon kullanım sınırına ulaşmış." };
  }

  if (subtotal <= 0) {
    return { ok: false, reason: "Sepetiniz boş." };
  }

  if (coupon.minSubtotal > 0 && subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      reason: `Bu kupon en az ${formatLira(coupon.minSubtotal)} tutarındaki sepetlerde geçerli.`,
    };
  }

  const discount = calculateDiscount(coupon.kind, coupon.value, subtotal);

  // Sabit tutarlı kupon sepetten büyükse indirim sepet kadar olur; hesap
  // eksiye düşmemeli. Ama ortaya çıkan "sıfır TL" sipariş de anlamsız —
  // ödeme sağlayıcısı sıfır tutarlı işlemi kabul etmez.
  if (discount >= subtotal) {
    return {
      ok: false,
      reason: "Bu kupon sepet tutarını sıfırlıyor; daha yüksek tutarlı bir sepette kullanın.",
    };
  }

  if (discount <= 0) {
    return { ok: false, reason: "Bu kupon bu sepette indirim sağlamıyor." };
  }

  return { ok: true, discount };
}

/** Ham indirim tutarı — sınır kontrolleri yapılmadan. */
export function calculateDiscount(
  kind: CouponKind,
  value: number,
  subtotal: number,
): number {
  if (subtotal <= 0 || value <= 0) return 0;

  if (kind === "PERCENT") {
    const percent = Math.min(value, MAX_PERCENT);
    return Math.floor((subtotal * percent) / 100);
  }

  return Math.min(value, subtotal);
}

/** 49900 → "499,00 TL". Hata mesajlarında kullanılıyor. */
function formatLira(kurus: number): string {
  return `${(kurus / 100).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TL`;
}
