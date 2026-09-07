"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, isPasswordCorrect, requireAdmin } from "@/lib/auth";
import { sendShippingNotification } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

/*
 * Yönetim paneli işlemleri.
 *
 * Her işlemin başında requireAdmin() çağrılıyor. proxy.ts zaten /admin altını
 * koruyor ama Server Action'lar sayfadan bağımsız olarak da çağrılabildiği için
 * yetki kontrolü burada tekrar yapılıyor.
 */

type FormState = { error?: string; success?: string };

export async function loginAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!isPasswordCorrect(password)) {
    // Kasıtlı olarak "şifre yanlış" demiyoruz — hangi bilginin yanlış olduğunu
    // sızdırmamak iyi bir alışkanlık.
    return { error: "Giriş yapılamadı. Bilgilerinizi kontrol edin." };
  }

  await createSession();
  // Açık yönlendirme (open redirect) olmasın diye yalnızca site içi yolları kabul et.
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/giris");
}

/** Bir varyantın stok adedini günceller. */
export async function updateStockAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const variantId = String(formData.get("variantId") ?? "");
  const stock = Number(formData.get("stock"));

  if (!variantId || !Number.isInteger(stock) || stock < 0) {
    return { error: "Stok adedi 0 veya daha büyük bir tam sayı olmalı." };
  }

  await prisma.variant.update({ where: { id: variantId }, data: { stock } });

  revalidatePath("/admin/urunler");
  revalidatePath("/");
  return { success: "Stok güncellendi." };
}

/** Ürünün ad, fiyat, açıklama gibi bilgilerini günceller. */
export async function updateProductAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const fabric = String(formData.get("fabric") ?? "").trim();
  const careInfo = String(formData.get("careInfo") ?? "").trim();
  const active = formData.get("active") === "on";

  // Fiyat kullanıcıdan TL olarak alınıp kuruşa çevriliyor; veritabanında her zaman
  // kuruş cinsinden Int tutuluyor.
  const priceLira = Number(String(formData.get("price") ?? "").replace(",", "."));
  const comparePriceRaw = String(formData.get("comparePrice") ?? "").replace(",", ".");
  const comparePriceLira = comparePriceRaw ? Number(comparePriceRaw) : null;

  if (!id || name.length < 2) {
    return { error: "Ürün adı en az 2 karakter olmalı." };
  }
  if (!Number.isFinite(priceLira) || priceLira <= 0) {
    return { error: "Geçerli bir fiyat girin." };
  }
  if (comparePriceLira !== null && (!Number.isFinite(comparePriceLira) || comparePriceLira <= 0)) {
    return { error: "Geçerli bir eski fiyat girin veya alanı boş bırakın." };
  }

  await prisma.product.update({
    where: { id },
    data: {
      name,
      tagline: tagline || null,
      description,
      fabric: fabric || null,
      careInfo: careInfo || null,
      price: Math.round(priceLira * 100),
      comparePrice: comparePriceLira === null ? null : Math.round(comparePriceLira * 100),
      active,
    },
  });

  revalidatePath("/admin/urunler");
  revalidatePath("/");
  revalidatePath("/urun/[slug]", "page");
  return { success: "Ürün güncellendi." };
}

/** Sipariş durumunu değiştirir; kargo takip numarası girilirse müşteriye e-posta gider. */
export async function updateOrderAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const trackingCode = String(formData.get("trackingCode") ?? "").trim();

  const allowed = ["PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
  if (!allowed.includes(status as (typeof allowed)[number])) {
    return { error: "Geçersiz sipariş durumu." };
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return { error: "Sipariş bulunamadı." };

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: status as (typeof allowed)[number],
      trackingCode: trackingCode || null,
    },
  });

  // Takip numarası ilk kez girildiyse müşteriyi bilgilendir. Aynı numara tekrar
  // kaydedilirse e-posta gönderilmez.
  const isNewTracking = trackingCode && trackingCode !== existing.trackingCode;
  if (isNewTracking) {
    await sendShippingNotification(
      { orderNo: updated.orderNo, email: updated.email, fullName: updated.fullName },
      trackingCode,
    );
  }

  revalidatePath("/admin");
  revalidatePath(`/siparis/${updated.orderNo}`);
  return {
    success: isNewTracking
      ? "Sipariş güncellendi, kargo bildirimi gönderildi."
      : "Sipariş güncellendi.",
  };
}

/** Kargo ücreti, ücretsiz kargo eşiği ve duyuru şeridi metni. */
export async function updateSettingsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const shippingFeeLira = Number(String(formData.get("shippingFee") ?? "").replace(",", "."));
  const thresholdLira = Number(
    String(formData.get("freeShippingThreshold") ?? "").replace(",", "."),
  );
  const announcement = String(formData.get("announcement") ?? "").trim();

  if (!Number.isFinite(shippingFeeLira) || shippingFeeLira < 0) {
    return { error: "Kargo ücreti 0 veya daha büyük olmalı." };
  }
  if (!Number.isFinite(thresholdLira) || thresholdLira < 0) {
    return { error: "Ücretsiz kargo eşiği 0 veya daha büyük olmalı." };
  }
  if (announcement.length > 120) {
    return { error: "Duyuru metni en fazla 120 karakter olabilir." };
  }

  const values: Record<string, string> = {
    shippingFee: String(Math.round(shippingFeeLira * 100)),
    freeShippingThreshold: String(Math.round(thresholdLira * 100)),
    announcement,
  };

  for (const [key, value] of Object.entries(values)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  revalidatePath("/", "layout");
  return { success: "Ayarlar kaydedildi." };
}
