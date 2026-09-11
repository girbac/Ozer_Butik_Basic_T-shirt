"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  attemptKey,
  clearAttempts,
  emailMatches,
  formatRetryAfter,
  isValidEmail,
  isValidOrderNo,
  normalizeEmail,
  normalizeOrderNo,
  registerAttempt,
} from "@/lib/order-lookup";

/*
 * Sipariş takibi — giriş şifresi olmadan çalışan tek sorgulama noktası.
 *
 * Üç kural:
 *
 * 1. SİPARİŞ NUMARASI TEK BAŞINA YETMEZ. Numaralar sıralı üretiliyor, yani
 *    tahmin edilebilir. Açan şey numara + o siparişin e-postası.
 * 2. HER BAŞARISIZLIK AYNI CEVABI VERİR. "Böyle bir sipariş yok" ile "e-posta
 *    tutmuyor" ayrı cevaplar olsaydı, saldırgan numaraları tarayarak hangi
 *    numaraların var olduğunu öğrenirdi.
 * 3. DENEME SAYISI SINIRLI. Aksi hâlde e-postasını bildiğiniz birinin
 *    siparişini numara tarayarak bulmak mümkün olurdu.
 */

export type TakipSonucu =
  | { durum: "bos" }
  | { durum: "hata"; mesaj: string }
  | { durum: "bulundu"; siparis: TakipSiparisi };

export type TakipSiparisi = {
  orderNo: string;
  status: string;
  createdAt: Date;
  trackingCode: string | null;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingFee: number;
  total: number;
  /* Adresin tamamı DEĞİL, yalnızca ilçe/il. Doğru siparişe baktığını
     anlamaya yeter; e-postası sızmış birinin ev adresini ifşa etmez. */
  district: string;
  city: string;
  items: {
    productName: string;
    colorName: string;
    size: string;
    quantity: number;
    unitPrice: number;
  }[];
};

const BULUNAMADI =
  "Bu bilgilerle bir sipariş bulamadık. Sipariş numarasını ve siparişi verirken " +
  "kullandığınız e-posta adresini kontrol edin.";

/**
 * İstemcinin IP'sini bulur. Deneme sayacının anahtarı bu IP ile girilen
 * e-postanın birleşimi (bkz. attemptKey).
 *
 * Vercel isteği bir vekil sunucu üzerinden geçirdiği için gerçek IP başlıkta
 * geliyor. Başlık bulunamazsa herkes aynı kovaya düşer — sayaç yine çalışır,
 * sadece daha sıkı olur. Bilerek böyle: şüphede kalınca kısıtla.
 */
async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "bilinmeyen";
}

export async function lookupOrderAction(
  _previous: TakipSonucu,
  formData: FormData,
): Promise<TakipSonucu> {
  const orderNo = normalizeOrderNo(String(formData.get("orderNo") ?? ""));
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!orderNo || !email) {
    return { durum: "hata", mesaj: "Sipariş numarası ve e-posta adresi gerekli." };
  }

  /*
   * Biçim kontrolü sayaçtan ÖNCE: yanlışlıkla boş bırakılan veya bariz hatalı
   * bir form, müşterinin deneme hakkını yakmasın.
   */
  if (!isValidOrderNo(orderNo) || !isValidEmail(email)) {
    return { durum: "hata", mesaj: BULUNAMADI };
  }

  const key = attemptKey(await clientIp(), email);
  const rate = registerAttempt(key);
  if (!rate.allowed) {
    return {
      durum: "hata",
      mesaj: `Çok fazla deneme yapıldı. ${formatRetryAfter(rate.retryAfterMs)} sonra tekrar deneyin.`,
    };
  }

  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: { items: true },
  });

  // İkisi de aynı cevabı veriyor — bkz. yukarıdaki 2. kural.
  if (!order || !emailMatches(email, order.email)) {
    return { durum: "hata", mesaj: BULUNAMADI };
  }

  /*
   * Ödemesi tamamlanmamış sipariş de "yok" sayılıyor. Bu kayıtlar ödeme
   * denemesinin izi; müşteriye "siparişiniz var" dedirtmek kafa karıştırır.
   */
  if (order.status === "PENDING" || order.status === "FAILED") {
    return { durum: "hata", mesaj: BULUNAMADI };
  }

  clearAttempts(key);

  return {
    durum: "bulundu",
    siparis: {
      orderNo: order.orderNo,
      status: order.status,
      createdAt: order.createdAt,
      trackingCode: order.trackingCode,
      subtotal: order.subtotal,
      discount: order.discount,
      couponCode: order.couponCode,
      shippingFee: order.shippingFee,
      total: order.total,
      district: order.district,
      city: order.city,
      items: order.items.map((item) => ({
        productName: item.productName,
        colorName: item.colorName,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    },
  };
}
