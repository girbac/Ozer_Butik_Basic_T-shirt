import "server-only";

import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getDemoProducts } from "@/lib/demo-catalog";
import { calculateShipping, getSettings, type StoreSettings } from "@/lib/settings";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart-store";
import { applyCoupon } from "@/lib/coupons";

/*
 * Sepetin sunucu tarafındaki tek doğru kaynağı.
 *
 * İstemci yalnızca "hangi varyanttan kaç adet" bilgisini gönderir. Ürün adı, fiyat
 * ve stok BURADA veritabanından okunur. Böylece tarayıcı konsolundan fiyat
 * değiştirilerek ucuza sipariş verilmesi mümkün olmaz.
 */

/** İstemciden gelen ham sepet — sadece kimlik ve adet. */
export type CartLineInput = {
  variantId: string;
  quantity: number;
};

export type PricedLine = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  colorName: string;
  size: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  image: string | null;
};

/** Sepette düzeltilen bir şey olduğunda kullanıcıya gösterilecek uyarı. */
export type CartIssue = {
  variantId: string;
  productName: string;
  kind: "kaldirildi" | "stok-azaltildi" | "fiyat-degisti";
  message: string;
};

export type PricedCart = {
  lines: PricedLine[];
  issues: CartIssue[];
  subtotal: number;
  /** Uygulanan indirim, kuruş. Kupon yoksa 0. */
  discount: number;
  /** Geçerli kuponun kodu; yoksa null. */
  couponCode: string | null;
  /** Kupon reddedildiyse sebebi; kabul edildiyse veya hiç girilmediyse null. */
  couponError: string | null;
  shippingFee: number;
  total: number;
  settings: StoreSettings;
};

/*
 * Ücretsiz kargo eşiği İNDİRİMDEN ÖNCEKİ ara toplama bakıyor.
 *
 * Tersi de yapılabilirdi ama kötü bir sürprize yol açıyor: 520 TL'lik sepete
 * %10 kupon giren müşterinin tutarı 468 TL'ye düşer, eşiğin altına iner ve
 * ekranda birden 49 TL kargo belirir — 52 TL indirim alıp 49 TL kargo ödemek
 * müşteriye oyun oynanmış hissi verir ve destek yükü doğurur.
 *
 * Müşterinin sepete koyduğu tutar eşiği geçtiyse kargo bedava kalır.
 */
function computeTotals(
  subtotal: number,
  discount: number,
  settings: StoreSettings,
): { shippingFee: number; total: number } {
  const shippingFee = calculateShipping(subtotal, settings);
  return { shippingFee, total: subtotal - discount + shippingFee };
}

/**
 * Sepeti veritabanına göre yeniden fiyatlandırır ve stok sınırlarına oturtur.
 *
 * Ürün yayından kaldırılmışsa satır düşer; stok yetmiyorsa adet mevcut stoğa
 * çekilir; fiyat değişmişse güncel fiyat kullanılır. Her düzeltme `issues`
 * içinde raporlanır ki kullanıcı sessizce farklı bir sipariş vermesin.
 */
export async function priceCart(
  input: CartLineInput[],
  couponCode?: string | null,
): Promise<PricedCart> {
  const settings = await getSettings();

  // Aynı varyant birden fazla kez gönderilmişse tek satırda topla.
  const requested = new Map<string, number>();
  for (const line of input) {
    if (typeof line.variantId !== "string" || !Number.isInteger(line.quantity)) continue;
    if (line.quantity <= 0) continue;
    requested.set(line.variantId, (requested.get(line.variantId) ?? 0) + line.quantity);
  }

  if (requested.size === 0) {
    return {
      lines: [],
      issues: [],
      subtotal: 0,
      discount: 0,
      couponCode: null,
      couponError: null,
      shippingFee: 0,
      total: 0,
      settings,
    };
  }

  // Demo modunda veritabanı yok; sepet tanıtım kataloğuna göre fiyatlandırılır.
  // Ödeme zaten engelli (bkz. /api/checkout), bu yalnızca sepetin görünmesi için.
  if (!isDatabaseConfigured()) {
    return priceFromDemoCatalog(requested, settings);
  }

  const variants = await prisma.variant.findMany({
    where: { id: { in: [...requested.keys()] } },
    include: {
      product: {
        include: { images: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  const byId = new Map(variants.map((variant) => [variant.id, variant]));
  const lines: PricedLine[] = [];
  const issues: CartIssue[] = [];

  for (const [variantId, requestedQuantity] of requested) {
    const variant = byId.get(variantId);

    // Varyant silinmiş veya ürün yayından kaldırılmış
    if (!variant || !variant.product.active) {
      issues.push({
        variantId,
        productName: variant?.product.name ?? "Ürün",
        kind: "kaldirildi",
        message: `${variant?.product.name ?? "Bir ürün"} artık satışta değil, sepetinizden çıkarıldı.`,
      });
      continue;
    }

    const label = `${variant.product.name} (${variant.colorName}, ${variant.size})`;

    if (variant.stock <= 0) {
      issues.push({
        variantId,
        productName: variant.product.name,
        kind: "kaldirildi",
        message: `${label} tükendi, sepetinizden çıkarıldı.`,
      });
      continue;
    }

    const quantity = Math.min(requestedQuantity, variant.stock, MAX_QUANTITY_PER_ITEM);

    if (quantity < requestedQuantity) {
      issues.push({
        variantId,
        productName: variant.product.name,
        kind: "stok-azaltildi",
        message: `${label} için ${quantity} adet kaldı, adet güncellendi.`,
      });
    }

    const image =
      variant.product.images.find((img) => img.colorName === variant.colorName)?.url ??
      variant.product.images[0]?.url ??
      null;

    lines.push({
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      colorName: variant.colorName,
      size: variant.size,
      unitPrice: variant.product.price,
      quantity,
      lineTotal: variant.product.price * quantity,
      image,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  /*
   * Kupon burada, sepet KESİNLEŞTİKTEN sonra doğrulanıyor. Önce doğrulansaydı
   * stok yüzünden küçülen bir sepette indirim gerçek tutardan fazla çıkardı.
   */
  let discount = 0;
  let appliedCode: string | null = null;
  let couponError: string | null = null;

  if (couponCode) {
    const result = await applyCoupon(couponCode, subtotal);
    if (result.ok) {
      discount = result.coupon.discount;
      appliedCode = result.coupon.code;
    } else {
      couponError = result.reason;
    }
  }

  const { shippingFee, total } = computeTotals(subtotal, discount, settings);

  return {
    lines,
    issues,
    subtotal,
    discount,
    couponCode: appliedCode,
    couponError,
    shippingFee,
    total,
    settings,
  };
}

/** Demo modunda sepet fiyatlandırması. Yalnızca gösterim amaçlıdır. */
function priceFromDemoCatalog(
  requested: Map<string, number>,
  settings: StoreSettings,
): PricedCart {
  const lines: PricedLine[] = [];

  for (const product of getDemoProducts()) {
    for (const color of product.colors) {
      for (const size of color.sizes) {
        const quantity = requested.get(size.variantId);
        if (!quantity || size.stock <= 0) continue;

        const capped = Math.min(quantity, size.stock, MAX_QUANTITY_PER_ITEM);
        lines.push({
          variantId: size.variantId,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          colorName: color.name,
          size: size.size,
          unitPrice: product.price,
          quantity: capped,
          lineTotal: product.price * capped,
          image: color.images[0]?.url ?? null,
        });
      }
    }
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const { shippingFee, total } = computeTotals(subtotal, 0, settings);

  // Demo modunda kupon yok: kuponlar veritabanında tutuluyor, o da bağlı değil.
  return {
    lines,
    issues: [],
    subtotal,
    discount: 0,
    couponCode: null,
    couponError: null,
    shippingFee,
    total,
    settings,
  };
}
