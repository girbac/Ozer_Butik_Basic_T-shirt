import "server-only";

import { prisma } from "@/lib/prisma";
import type { PricedCart } from "@/lib/cart-server";
import type { CheckoutInput } from "@/lib/validation";

/**
 * OB-2026-1042 biçiminde, eşzamanlılığa dayanıklı sipariş numarası üretir.
 * Sayaç veritabanındaki `order_no_seq` sequence'ından gelir.
 */
export async function generateOrderNo(): Promise<string> {
  const rows = await prisma.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('order_no_seq')`;
  const value = rows[0]?.nextval ?? BigInt(Date.now());
  return `OB-${new Date().getFullYear()}-${value}`;
}

/**
 * Ödemesi henüz alınmamış (PENDING) siparişi kaydeder.
 *
 * Bu aşamada stok DÜŞÜLMEZ — ödeme başarısız olursa stoğu boşuna kilitlemiş
 * oluruz. Stok, iyzico callback'inde ödeme onaylandığında düşülür.
 */
export async function createPendingOrder(
  customer: CheckoutInput,
  cart: PricedCart,
  conversationId: string,
) {
  const orderNo = await generateOrderNo();

  return prisma.order.create({
    data: {
      orderNo,
      conversationId,
      status: "PENDING",
      email: customer.email,
      phone: customer.phone,
      fullName: customer.fullName,
      city: customer.city,
      district: customer.district,
      address: customer.address,
      postalCode: customer.postalCode || null,
      note: customer.note || null,
      subtotal: cart.subtotal,
      shippingFee: cart.shippingFee,
      total: cart.total,
      items: {
        create: cart.lines.map((line) => ({
          variantId: line.variantId,
          productName: line.productName,
          productSlug: line.productSlug,
          colorName: line.colorName,
          size: line.size,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
        })),
      },
    },
    include: { items: true },
  });
}

export type CaptureResult =
  | { outcome: "zaten-islenmis" }
  | { outcome: "odendi"; stockWarnings: string[] }
  | { outcome: "basarisiz" };

/**
 * Ödeme onaylandığında siparişi kesinleştirir: durumu PAID yapar ve stoğu düşer.
 *
 * Tamamı tek bir veritabanı işlemi (transaction) içinde çalışır ve yalnızca hâlâ
 * PENDING olan siparişe uygulanır. iyzico callback'i iki kez gelirse ikincisi
 * "zaten-islenmis" döner — stok iki kez düşmez.
 */
export async function captureOrder(
  orderId: string,
  paymentId: string | undefined,
): Promise<CaptureResult> {
  return prisma.$transaction(async (tx) => {
    // Koşullu güncelleme: yalnızca PENDING ise PAID yap. Aynı anda gelen ikinci
    // callback burada 0 satır günceller ve işlem yapmadan döner.
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date(), iyzicoPaymentId: paymentId ?? null },
    });

    if (claimed.count === 0) {
      return { outcome: "zaten-islenmis" as const };
    }

    const items = await tx.orderItem.findMany({ where: { orderId } });
    const stockWarnings: string[] = [];

    for (const item of items) {
      // stock >= quantity koşulu, aynı anda satılan son ürünlerde stoğun
      // eksiye düşmesini engeller.
      const updated = await tx.variant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (updated.count === 0) {
        stockWarnings.push(
          `${item.productName} (${item.colorName}, ${item.size}) × ${item.quantity} — stok yetersiz`,
        );
      }
    }

    // Ödeme alındı ama stok yetmediyse siparişi iptal etmiyoruz; parayı tahsil ettik.
    // Durumu satıcının görebilmesi için nota yazıyoruz, admin panelinde görünür.
    if (stockWarnings.length > 0) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          errorMessage: `DİKKAT — ödeme alındı fakat stok yetersiz: ${stockWarnings.join("; ")}`,
        },
      });
    }

    return { outcome: "odendi" as const, stockWarnings };
  });
}

/** Ödeme başarısız olduğunda siparişi işaretler. Stok zaten düşmemişti. */
export async function failOrder(orderId: string, reason: string) {
  await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "FAILED", errorMessage: reason.slice(0, 500) },
  });
}

export async function getOrderByNo(orderNo: string) {
  return prisma.order.findUnique({
    where: { orderNo },
    include: { items: true },
  });
}
