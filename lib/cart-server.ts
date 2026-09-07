import "server-only";

import { prisma } from "@/lib/prisma";
import { calculateShipping, getSettings, type StoreSettings } from "@/lib/settings";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart-store";

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
  shippingFee: number;
  total: number;
  settings: StoreSettings;
};

/**
 * Sepeti veritabanına göre yeniden fiyatlandırır ve stok sınırlarına oturtur.
 *
 * Ürün yayından kaldırılmışsa satır düşer; stok yetmiyorsa adet mevcut stoğa
 * çekilir; fiyat değişmişse güncel fiyat kullanılır. Her düzeltme `issues`
 * içinde raporlanır ki kullanıcı sessizce farklı bir sipariş vermesin.
 */
export async function priceCart(input: CartLineInput[]): Promise<PricedCart> {
  const settings = await getSettings();

  // Aynı varyant birden fazla kez gönderilmişse tek satırda topla.
  const requested = new Map<string, number>();
  for (const line of input) {
    if (typeof line.variantId !== "string" || !Number.isInteger(line.quantity)) continue;
    if (line.quantity <= 0) continue;
    requested.set(line.variantId, (requested.get(line.variantId) ?? 0) + line.quantity);
  }

  if (requested.size === 0) {
    return { lines: [], issues: [], subtotal: 0, shippingFee: 0, total: 0, settings };
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
  const shippingFee = calculateShipping(subtotal, settings);

  return {
    lines,
    issues,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    settings,
  };
}
