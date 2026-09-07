/*
 * Sipariş kesinleştirme testleri.
 *
 * Buradaki mantık sitenin en riskli parçası: iyzico callback'i iki kez gelirse
 * stok iki kez düşmemeli, stok yetmiyorsa eksiye inmemeli, başarısız ödemede
 * hiç düşmemeli. Bu davranışları gerçek veritabanına karşı doğruluyoruz.
 *
 * Çalıştırma: npm test   (DATABASE_URL gerekli)
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { captureOrder, createPendingOrder, failOrder } from "../lib/orders";
import { priceCart } from "../lib/cart-server";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const TEST_SLUG = "test-urun-siparis-testi";

const customer = {
  email: "test@ornek.com",
  phone: "5551112233",
  fullName: "Test Kullanıcı",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Test Mahallesi, Test Sokak No:1 Daire:2",
  postalCode: "34700",
  note: "",
  contractAccepted: true as const,
};

let variantId: string;
let productId: string;

async function cleanup() {
  const product = await prisma.product.findUnique({
    where: { slug: TEST_SLUG },
    include: { variants: true },
  });
  if (!product) return;

  const variantIds = product.variants.map((v) => v.id);
  const orderIds = (
    await prisma.orderItem.findMany({
      where: { variantId: { in: variantIds } },
      select: { orderId: true },
    })
  ).map((item) => item.orderId);

  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  await prisma.product.delete({ where: { id: product.id } });
}

async function createPendingOrderFor(quantity: number) {
  const cart = await priceCart([{ variantId, quantity }]);
  return createPendingOrder(customer, cart, `test-${crypto.randomUUID()}`);
}

async function getStock(): Promise<number> {
  const variant = await prisma.variant.findUniqueOrThrow({ where: { id: variantId } });
  return variant.stock;
}

describe("sipariş kesinleştirme", () => {
  before(async () => {
    await cleanup();

    const product = await prisma.product.create({
      data: {
        slug: TEST_SLUG,
        name: "Test Ürünü",
        description: "Test amaçlı ürün.",
        price: 10000, // 100,00 TL
        sortOrder: 999,
        active: true,
        variants: {
          create: {
            colorName: "Siyah",
            colorHex: "#111111",
            size: "M",
            stock: 5,
            sku: `TEST-${Date.now()}`,
          },
        },
      },
      include: { variants: true },
    });

    productId = product.id;
    variantId = product.variants[0].id;
  });

  after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it("ödeme onaylanınca stok bir kez düşer", async () => {
    const stockBefore = await getStock();
    const order = await createPendingOrderFor(2);

    const result = await captureOrder(order.id, "test-payment-1");

    assert.equal(result.outcome, "odendi");
    assert.equal(await getStock(), stockBefore - 2);

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(updated.status, "PAID");
    assert.ok(updated.paidAt, "paidAt doldurulmalı");
    assert.equal(updated.iyzicoPaymentId, "test-payment-1");
  });

  it("aynı callback ikinci kez gelirse stok tekrar düşmez", async () => {
    const order = await createPendingOrderFor(1);

    const first = await captureOrder(order.id, "test-payment-2");
    const stockAfterFirst = await getStock();

    const second = await captureOrder(order.id, "test-payment-2");

    assert.equal(first.outcome, "odendi");
    assert.equal(second.outcome, "zaten-islenmis");
    assert.equal(await getStock(), stockAfterFirst, "stok ikinci çağrıda değişmemeli");
  });

  it("eşzamanlı iki callback'ten yalnızca biri stoğu düşer", async () => {
    const order = await createPendingOrderFor(1);
    const stockBefore = await getStock();

    const [a, b] = await Promise.all([
      captureOrder(order.id, "test-payment-3"),
      captureOrder(order.id, "test-payment-3"),
    ]);

    const outcomes = [a.outcome, b.outcome].sort();
    assert.deepEqual(outcomes, ["odendi", "zaten-islenmis"]);
    assert.equal(await getStock(), stockBefore - 1);
  });

  it("stok yetmiyorsa eksiye düşmez ve uyarı üretir", async () => {
    // Kalan stoktan fazlasını sipariş edebilmek için siparişi doğrudan kuruyoruz;
    // priceCart normalde adedi stoğa çekerdi.
    const stockBefore = await getStock();

    const order = await prisma.order.create({
      data: {
        orderNo: `TEST-${Date.now()}`,
        conversationId: `test-${crypto.randomUUID()}`,
        status: "PENDING",
        email: customer.email,
        phone: customer.phone,
        fullName: customer.fullName,
        city: customer.city,
        district: customer.district,
        address: customer.address,
        subtotal: 10000,
        shippingFee: 0,
        total: 10000,
        items: {
          create: {
            variantId,
            productName: "Test Ürünü",
            productSlug: TEST_SLUG,
            colorName: "Siyah",
            size: "M",
            unitPrice: 10000,
            quantity: stockBefore + 10,
          },
        },
      },
    });

    const result = await captureOrder(order.id, "test-payment-4");

    assert.equal(result.outcome, "odendi");
    assert.ok(
      result.outcome === "odendi" && result.stockWarnings.length === 1,
      "stok uyarısı üretilmeli",
    );
    assert.equal(await getStock(), stockBefore, "stok değişmemeli");

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.match(updated.errorMessage ?? "", /stok yetersiz/i);
  });

  it("ödeme başarısızsa stok düşmez ve sipariş FAILED olur", async () => {
    const order = await createPendingOrderFor(1);
    const stockBefore = await getStock();

    await failOrder(order.id, "Test: kart reddedildi");

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(updated.status, "FAILED");
    assert.equal(updated.errorMessage, "Test: kart reddedildi");
    assert.equal(await getStock(), stockBefore);
  });

  it("başarısız sipariş sonradan PAID yapılamaz", async () => {
    const order = await createPendingOrderFor(1);
    await failOrder(order.id, "Test: iptal");

    const result = await captureOrder(order.id, "test-payment-5");

    assert.equal(result.outcome, "zaten-islenmis");
    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(updated.status, "FAILED");
  });

  it("priceCart istemciden gelen fiyatı yok sayar, veritabanındakini kullanır", async () => {
    const cart = await priceCart([{ variantId, quantity: 1 }]);

    assert.equal(cart.lines.length, 1);
    assert.equal(cart.lines[0].unitPrice, 10000, "fiyat veritabanından gelmeli");
    assert.equal(cart.subtotal, 10000);
    assert.ok(productId, "ürün oluşturulmuş olmalı");
  });

  it("priceCart stoktan fazla adedi stoğa çeker ve uyarır", async () => {
    const stock = await getStock();
    const cart = await priceCart([{ variantId, quantity: stock + 5 }]);

    assert.equal(cart.lines[0].quantity, Math.min(stock, 10));
    assert.ok(
      cart.issues.some((issue) => issue.kind === "stok-azaltildi"),
      "stok uyarısı olmalı",
    );
  });
});
