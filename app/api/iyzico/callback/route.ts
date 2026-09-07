import { NextResponse } from "next/server";
import {
  IYZICO_PAYMENT_STATUS_SUCCESS,
  retrieveCheckoutForm,
  verifyRetrieveSignature,
} from "@/lib/iyzico";
import { sendOrderConfirmation, sendSellerNotification } from "@/lib/mail";
import { captureOrder, failOrder } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

/*
 * iyzico ödeme dönüşü.
 *
 * Kullanıcı ödemeyi tamamladıktan sonra iyzico bu adrese POST eder. Gövdedeki
 * token'a doğrudan güvenmiyoruz: token ile iyzico'ya SORUYORUZ, dönen sonucun
 * imzasını gizli anahtarımızla doğruluyoruz. Ödemenin başarılı sayılması için
 * her ikisinin de geçmesi gerekir.
 */

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** iyzico tarayıcıyı POST ile gönderdiği için 303 ile GET'e çeviriyoruz. */
function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, siteUrl()), 303);
}

export async function POST(request: Request) {
  let token: string | null = null;

  try {
    const formData = await request.formData();
    const value = formData.get("token");
    token = typeof value === "string" ? value : null;
  } catch {
    token = null;
  }

  if (!token) {
    console.error("[iyzico callback] token gelmedi");
    return redirectTo("/odeme?hata=eksik-token");
  }

  const order = await prisma.order.findFirst({
    where: { iyzicoToken: token },
    select: { id: true, orderNo: true, status: true, conversationId: true },
  });

  if (!order) {
    console.error("[iyzico callback] token'a karşılık sipariş bulunamadı");
    return redirectTo("/odeme?hata=siparis-bulunamadi");
  }

  // Aynı callback ikinci kez gelirse (iyzico yeniden dener veya kullanıcı geri gider)
  // siparişi tekrar işlemeden sonuç sayfasına gönderiyoruz.
  if (order.status !== "PENDING") {
    return redirectTo(`/siparis/${order.orderNo}`);
  }

  let result;
  try {
    result = await retrieveCheckoutForm(token, order.conversationId ?? undefined);
  } catch (error) {
    console.error("[iyzico callback] sonuç sorgulanamadı:", error);
    // Ödeme gerçekten alınmış olabilir — siparişi FAILED yapmıyoruz, PENDING kalıyor
    // ki satıcı admin panelinden inceleyip elle karar verebilsin.
    return redirectTo(`/siparis/${order.orderNo}`);
  }

  if (!verifyRetrieveSignature(result)) {
    console.error("[iyzico callback] imza doğrulanamadı, sipariş:", order.orderNo);
    await failOrder(order.id, "İmza doğrulanamadı — ödeme kabul edilmedi.");
    return redirectTo(`/siparis/${order.orderNo}`);
  }

  if (result.status !== "success" || result.paymentStatus !== IYZICO_PAYMENT_STATUS_SUCCESS) {
    const reason = result.errorMessage ?? `Ödeme tamamlanmadı (${result.paymentStatus ?? "bilinmiyor"}).`;
    await failOrder(order.id, reason);
    return redirectTo(`/siparis/${order.orderNo}`);
  }

  const capture = await captureOrder(order.id, result.paymentId);

  if (capture.outcome === "odendi") {
    if (capture.stockWarnings.length > 0) {
      console.error(
        `[iyzico callback] ${order.orderNo}: ödeme alındı fakat stok yetersiz —`,
        capture.stockWarnings.join("; "),
      );
    }

    // E-postalar yalnızca ilk kesinleştirmede gider (callback tekrar gelirse
    // "zaten-islenmis" döner ve buraya girilmez), böylece mükerrer e-posta olmaz.
    const full = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });

    if (full) {
      // Bilinçli olarak bekliyoruz: Vercel gibi ortamlarda yanıt döndükten sonra
      // fonksiyon sonlandırılabilir ve "arka plana atılan" gönderim hiç çalışmaz.
      // Hatalar lib/mail.ts içinde yutulduğu için bu bekleme siparişi riske atmaz.
      await Promise.allSettled([
        sendOrderConfirmation(full),
        sendSellerNotification(full),
      ]);
    }
  }

  return redirectTo(`/siparis/${order.orderNo}`);
}

/**
 * Bazı durumlarda (kullanıcı geri tuşuna basar, banka GET ile döner) bu adrese
 * GET gelebilir. Kullanıcıyı boş sayfada bırakmamak için ana sayfaya alıyoruz.
 */
export async function GET() {
  return redirectTo("/");
}
