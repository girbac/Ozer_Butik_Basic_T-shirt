import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { priceCart } from "@/lib/cart-server";
import { initializeCheckoutForm, Iyzipay } from "@/lib/iyzico";
import { createPendingOrder } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { kurusToIyzicoPrice } from "@/lib/format";
import { checkoutRequestSchema, toInternationalPhone } from "@/lib/validation";

/*
 * Sipariş oluşturur ve iyzico ödeme sayfasını başlatır.
 *
 * İstemciden gelen fiyata GÜVENİLMEZ: sepet burada veritabanına göre yeniden
 * fiyatlandırılır, iyzico'ya ve veritabanına giden tutarlar bu hesaptan gelir.
 */

/*
 * iyzico buyer.identityNumber alanını zorunlu tutuyor. Misafir alışverişte TC kimlik
 * numarası istemiyoruz — hem dönüşümü düşürür hem de KVKK açısından gereksiz veri
 * toplamak olur. iyzico'nun bu alan için kabul ettiği dolgu değerini gönderiyoruz.
 */
const PLACEHOLDER_IDENTITY_NUMBER = "11111111111";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "85.34.78.112";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Bilgilerinizi kontrol edin." },
      { status: 400 },
    );
  }

  const { customer, lines } = parsed.data;

  // Sepeti sunucuda yeniden fiyatlandır — tek doğru kaynak burası.
  const cart = await priceCart(lines);

  if (cart.lines.length === 0) {
    return NextResponse.json(
      { error: "Sepetinizdeki ürünler artık mevcut değil. Sepetinizi kontrol edin." },
      { status: 409 },
    );
  }

  // Stok azaldı veya ürün düştüyse kullanıcıyı ödemeye göndermeden önce uyar.
  if (cart.issues.length > 0) {
    return NextResponse.json(
      {
        error: "Sepetinizde değişiklik oldu, lütfen kontrol edip tekrar deneyin.",
        issues: cart.issues.map((issue) => issue.message),
      },
      { status: 409 },
    );
  }

  const conversationId = randomUUID();
  const order = await createPendingOrder(customer, cart, conversationId);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [firstName, ...restOfName] = customer.fullName.split(/\s+/);
  const surname = restOfName.join(" ") || firstName;

  try {
    const result = await initializeCheckoutForm({
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      // price: ürünlerin toplamı, paidPrice: kargo dahil tahsil edilecek tutar
      price: kurusToIyzicoPrice(cart.subtotal),
      paidPrice: kurusToIyzicoPrice(cart.total),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: order.orderNo,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${siteUrl}/api/iyzico/callback`,
      buyer: {
        id: order.id,
        name: firstName,
        surname,
        gsmNumber: toInternationalPhone(customer.phone),
        email: customer.email,
        identityNumber: PLACEHOLDER_IDENTITY_NUMBER,
        registrationAddress: `${customer.address} ${customer.district}/${customer.city}`,
        ip: getClientIp(request),
        city: customer.city,
        country: "Turkey",
        zipCode: customer.postalCode || undefined,
      },
      shippingAddress: {
        contactName: customer.fullName,
        city: customer.city,
        country: "Turkey",
        address: `${customer.address} ${customer.district}/${customer.city}`,
        zipCode: customer.postalCode || undefined,
      },
      billingAddress: {
        contactName: customer.fullName,
        city: customer.city,
        country: "Turkey",
        address: `${customer.address} ${customer.district}/${customer.city}`,
        zipCode: customer.postalCode || undefined,
      },
      basketItems: cart.lines.map((line) => ({
        id: line.variantId,
        name: `${line.productName} — ${line.colorName} ${line.size}`,
        category1: "Tişört",
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: kurusToIyzicoPrice(line.lineTotal),
      })),
    });

    if (result.status !== "success" || !result.paymentPageUrl) {
      const reason = result.errorMessage ?? "iyzico ödeme sayfası başlatılamadı.";
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED", errorMessage: reason.slice(0, 500) },
      });
      return NextResponse.json({ error: reason }, { status: 502 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { iyzicoToken: result.token ?? null },
    });

    return NextResponse.json({
      orderNo: order.orderNo,
      paymentPageUrl: result.paymentPageUrl,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Bilinmeyen hata";
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED", errorMessage: reason.slice(0, 500) },
    });
    console.error("[checkout] iyzico başlatılamadı:", error);
    return NextResponse.json(
      { error: "Ödeme başlatılamadı. Lütfen daha sonra tekrar deneyin." },
      { status: 502 },
    );
  }
}
