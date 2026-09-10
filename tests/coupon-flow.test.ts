/*
 * Kuponun sipariş akışındaki davranışı — gerçek veritabanına karşı.
 *
 * lib/coupon-math.ts'teki saf kurallar ayrı dosyada sınanıyor (tests/coupon.test.ts).
 * Burada sınanan şey para ve sayaç: indirim toplama doğru yansıyor mu, kullanım
 * sayacı YALNIZCA ödeme başarılı olunca artıyor mu, sınıra dayanmış kupon
 * eşzamanlı iki siparişte iki kez tüketilebiliyor mu.
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

const TEST_SLUG = "test-urun-kupon-testi";
const CODE_PERCENT = "TESTYUZDE";
const CODE_AMOUNT = "TESTTUTAR";
const CODE_LIMITED = "TESTSINIR";
const ALL_CODES = [CODE_PERCENT, CODE_AMOUNT, CODE_LIMITED];

const customer = {
  email: "kupon@ornek.com",
  phone: "5551112233",
  fullName: "Kupon Test",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Test Mahallesi, Test Sokak No:1",
  postalCode: "34700",
  note: "",
  contractAccepted: true as const,
};

let variantId: string;

async function cleanup() {
  const product = await prisma.product.findUnique({
    where: { slug: TEST_SLUG },
    include: { variants: true },
  });

  if (product) {
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

  await prisma.coupon.deleteMany({ where: { code: { in: ALL_CODES } } });
}

/** Sayacı test içinde okumak için. */
async function usedCount(code: string): Promise<number> {
  const coupon = await prisma.coupon.findUniqueOrThrow({ where: { code } });
  return coupon.usedCount;
}

describe("kupon sipariş akışı", () => {
  before(async () => {
    await cleanup();

    const product = await prisma.product.create({
      data: {
        slug: TEST_SLUG,
        name: "Kupon Test Ürünü",
        description: "Test amaçlı ürün.",
        price: 20000, // 200,00 TL
        sortOrder: 998,
        active: true,
        variants: {
          create: {
            colorName: "Siyah",
            colorHex: "#111111",
            size: "M",
            stock: 20,
            sku: `KUPON-${Date.now()}`,
          },
        },
      },
      include: { variants: true },
    });

    variantId = product.variants[0].id;

    await prisma.coupon.createMany({
      data: [
        { code: CODE_PERCENT, kind: "PERCENT", value: 25 },
        { code: CODE_AMOUNT, kind: "AMOUNT", value: 5000, minSubtotal: 30000 },
        { code: CODE_LIMITED, kind: "PERCENT", value: 10, maxUses: 1 },
      ],
    });
  });

  after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it("yüzde kuponu ara toplamdan düşülür, kargo indirim öncesine bakar", async () => {
    const cart = await priceCart([{ variantId, quantity: 1 }], CODE_PERCENT);

    assert.equal(cart.subtotal, 20000);
    assert.equal(cart.discount, 5000, "200 TL'nin %25'i 50 TL");
    assert.equal(cart.couponCode, CODE_PERCENT);
    assert.equal(cart.couponError, null);
    assert.equal(
      cart.total,
      cart.subtotal - cart.discount + cart.shippingFee,
      "toplam = ara toplam - indirim + kargo",
    );
  });

  it("küçük harfle yazılan kod da kabul edilir", async () => {
    const cart = await priceCart([{ variantId, quantity: 1 }], "  testyuzde ");

    assert.equal(cart.couponCode, CODE_PERCENT);
    assert.equal(cart.discount, 5000);
  });

  it("alt limitin altındaki sepette kupon uygulanmaz ve sebebi söylenir", async () => {
    const cart = await priceCart([{ variantId, quantity: 1 }], CODE_AMOUNT);

    assert.equal(cart.discount, 0, "indirim uygulanmamalı");
    assert.equal(cart.couponCode, null);
    assert.match(cart.couponError ?? "", /en az/i);
    assert.equal(cart.total, cart.subtotal + cart.shippingFee);
  });

  it("olmayan kod sepeti bozmaz, yalnızca hata döner", async () => {
    const cart = await priceCart([{ variantId, quantity: 1 }], "BOYLEBIRKODYOK");

    assert.equal(cart.discount, 0);
    assert.equal(cart.couponCode, null);
    assert.ok(cart.couponError, "hata mesajı olmalı");
    assert.equal(cart.total, cart.subtotal + cart.shippingFee);
  });

  it("indirim siparişe kaydedilir ve sayaç yalnızca ödeme sonrası artar", async () => {
    const before = await usedCount(CODE_PERCENT);
    const cart = await priceCart([{ variantId, quantity: 1 }], CODE_PERCENT);
    const order = await createPendingOrder(customer, cart, `test-${crypto.randomUUID()}`);

    const pending = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(pending.discount, 5000);
    assert.equal(pending.couponCode, CODE_PERCENT);
    assert.equal(pending.total, cart.total);
    assert.equal(await usedCount(CODE_PERCENT), before, "ödeme öncesi sayaç artmamalı");

    const result = await captureOrder(order.id, `kupon-odeme-${crypto.randomUUID()}`);

    assert.equal(result.outcome, "odendi");
    assert.equal(await usedCount(CODE_PERCENT), before + 1, "ödeme sonrası sayaç artmalı");
  });

  it("ödeme başarısızsa kupon tüketilmez", async () => {
    const before = await usedCount(CODE_PERCENT);
    const cart = await priceCart([{ variantId, quantity: 1 }], CODE_PERCENT);
    const order = await createPendingOrder(customer, cart, `test-${crypto.randomUUID()}`);

    await failOrder(order.id, "Test: kart reddedildi");

    assert.equal(await usedCount(CODE_PERCENT), before, "sayaç artmamalı");
  });

  it("aynı callback iki kez gelirse kupon iki kez tüketilmez", async () => {
    const before = await usedCount(CODE_PERCENT);
    const cart = await priceCart([{ variantId, quantity: 1 }], CODE_PERCENT);
    const order = await createPendingOrder(customer, cart, `test-${crypto.randomUUID()}`);
    const paymentId = `kupon-odeme-${crypto.randomUUID()}`;

    await captureOrder(order.id, paymentId);
    await captureOrder(order.id, paymentId);

    assert.equal(await usedCount(CODE_PERCENT), before + 1);
  });

  it("kullanım sınırı dolan kupon bir daha uygulanmaz", async () => {
    const cart = await priceCart([{ variantId, quantity: 1 }], CODE_LIMITED);
    assert.equal(cart.couponCode, CODE_LIMITED, "ilk kullanımda geçerli olmalı");

    const order = await createPendingOrder(customer, cart, `test-${crypto.randomUUID()}`);
    await captureOrder(order.id, `kupon-odeme-${crypto.randomUUID()}`);

    assert.equal(await usedCount(CODE_LIMITED), 1);

    const second = await priceCart([{ variantId, quantity: 1 }], CODE_LIMITED);
    assert.equal(second.discount, 0);
    assert.match(second.couponError ?? "", /sınır/i);
  });

  it("sınırdaki kupon eşzamanlı iki siparişte yalnızca bir kez tüketilir", async () => {
    /*
     * İki müşteri son kullanım hakkı için aynı anda ödeme yaparsa sayaç
     * sınırın üstüne çıkmamalı. Kontrol UPDATE'in kendi WHERE'inde yapılıyor,
     * "önce oku sonra yaz" olsaydı ikisi de geçerdi.
     */
    await prisma.coupon.update({
      where: { code: CODE_LIMITED },
      data: { usedCount: 0, maxUses: 1 },
    });

    const orders = await Promise.all(
      [1, 2].map(async () => {
        const cart = await priceCart([{ variantId, quantity: 1 }], CODE_LIMITED);
        return createPendingOrder(customer, cart, `test-${crypto.randomUUID()}`);
      }),
    );

    await Promise.all(
      orders.map((order) => captureOrder(order.id, `kupon-odeme-${crypto.randomUUID()}`)),
    );

    assert.equal(await usedCount(CODE_LIMITED), 1, "sayaç sınırı aşmamalı");
  });
});
