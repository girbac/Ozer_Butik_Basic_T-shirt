"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  getAdminConfigProblem,
  isPasswordCorrect,
  requireAdmin,
} from "@/lib/auth";
import { sendShippingNotification } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { isImageUploadAvailable, removeImage, storeImage } from "@/lib/image-store";

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

  // Önce sunucu ayarlarını kontrol et: eksikse hiçbir şifre çalışmaz ve
  // "şifre yanlış" demek mağaza sahibini yanlış yöne sürükler.
  const configProblem = getAdminConfigProblem();
  if (configProblem) {
    console.error(`[auth] yönetici girişi yapılandırılmamış: ${configProblem}`);
    return {
      error:
        `Sunucu ayarı eksik (${configProblem}). Vercel → Settings → ` +
        `Environment Variables bölümünden ekleyip Deployments → Redeploy yapın.`,
    };
  }

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

/*
 * ————— Renk yönetimi —————
 *
 * Renk ayrı bir tablo değil; her varyantın üzerinde ad ve hex olarak duruyor
 * (Variant.colorName / colorHex) ve görseller de renge ADIYLA bağlı
 * (ProductImage.colorName). Bu yüzden bir rengi düzenlemek tek satır değil,
 * o ürünün o renge ait TÜM varyantlarını ve görsellerini birlikte güncellemek
 * demek. İkisi tek işlemde (transaction) yapılıyor: yarıda kalırsa görseller
 * eski adda kalıp renkten kopardı.
 *
 * Sipariş geçmişine DOKUNULMUYOR. OrderItem.colorName sipariş anındaki adın
 * kopyası; müşteri "Bej" aldıysa fişinde Bej yazmalı, sonradan adı "Taş" olsa
 * bile. Bu yüzden orada bilinçli olarak bir güncelleme yok.
 */

/** Rengin adını ve hex kodunu değiştirir. */
export async function updateColorAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const currentName = String(formData.get("currentName") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const hex = String(formData.get("hex") ?? "").trim().toLowerCase();

  if (!productId || !currentName) {
    return { error: "Renk bulunamadı. Sayfayı yenileyip tekrar deneyin." };
  }
  if (name.length < 2 || name.length > 30) {
    return { error: "Renk adı 2 ile 30 karakter arasında olmalı." };
  }
  if (!/^#[0-9a-f]{6}$/.test(hex)) {
    return { error: "Renk kodu #1a1815 biçiminde olmalı." };
  }

  /*
   * Aynı üründe iki renk aynı adı taşıyamaz — veritabanında da böyle bir kural
   * var (productId + colorName + size). Kuralın hatasını beklemek yerine burada
   * yakalayıp anlaşılır bir cümle veriyoruz.
   */
  if (name !== currentName) {
    const clash = await prisma.variant.findFirst({
      where: { productId, colorName: name },
      select: { id: true },
    });
    if (clash) {
      return { error: `Bu üründe zaten "${name}" adında bir renk var.` };
    }
  }

  await prisma.$transaction([
    prisma.variant.updateMany({
      where: { productId, colorName: currentName },
      data: { colorName: name, colorHex: hex },
    }),
    prisma.productImage.updateMany({
      where: { productId, colorName: currentName },
      data: { colorName: name },
    }),
  ]);

  revalidatePath("/admin/urunler");
  revalidatePath("/");
  revalidatePath("/urun/[slug]", "page");
  return { success: `"${name}" kaydedildi.` };
}

/** Bir rengi tüm bedenleriyle birlikte siler. */
export async function deleteColorAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const currentName = String(formData.get("currentName") ?? "");

  if (!productId || !currentName) {
    return { error: "Renk bulunamadı. Sayfayı yenileyip tekrar deneyin." };
  }

  const variants = await prisma.variant.findMany({
    where: { productId },
    select: { id: true, colorName: true, _count: { select: { orderItems: true } } },
  });

  const target = variants.filter((variant) => variant.colorName === currentName);
  if (target.length === 0) {
    return { error: "Renk bulunamadı. Sayfayı yenileyip tekrar deneyin." };
  }

  // Ürünün tek rengi silinirse satılacak bir şey kalmaz.
  const remainingColors = new Set(
    variants.filter((v) => v.colorName !== currentName).map((v) => v.colorName),
  );
  if (remainingColors.size === 0) {
    return { error: "Ürünün son rengi silinemez. Önce başka bir renk ekleyin." };
  }

  /*
   * Satılmış bir rengi silmek sipariş geçmişini kırar. Veritabanı bunu zaten
   * engelliyor (OrderItem → Variant ilişkisi Restrict), ama ham kısıt hatası
   * yerine ne yapılması gerektiğini söylüyoruz: satıştan kaldırmak isteyen
   * kişinin aradığı şey silmek değil, stoğu sıfırlamak.
   */
  const sold = target.reduce((sum, variant) => sum + variant._count.orderItems, 0);
  if (sold > 0) {
    return {
      error:
        `"${currentName}" rengi siparişlerde geçtiği için silinemez. ` +
        `Satıştan kaldırmak için tüm bedenlerinin stoğunu 0 yapın.`,
    };
  }

  // Depodaki dosyaları da temizlemek için adreslerini önce okuyoruz.
  const images = await prisma.productImage.findMany({
    where: { productId, colorName: currentName },
    select: { url: true },
  });

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId, colorName: currentName } }),
    prisma.variant.deleteMany({ where: { productId, colorName: currentName } }),
  ]);

  // Kayıtlar gittikten sonra dosyalar; bu adım başarısız olsa bile silme tamam.
  for (const image of images) {
    await removeImage(image.url);
  }

  revalidatePath("/admin/urunler");
  revalidatePath("/");
  revalidatePath("/urun/[slug]", "page");
  return { success: `"${currentName}" silindi.` };
}

/*
 * ————— Ürün fotoğrafları —————
 *
 * Fotoğraf renge ADIYLA bağlanıyor (ProductImage.colorName). colorName boşsa
 * fotoğraf o ürünün TÜM renklerinde görünüyor — kumaş yakın çekimi gibi renkten
 * bağımsız kareler için.
 *
 * Sıralama ürün sayfasındaki gösterim sırası; ilk sıradaki kare aynı zamanda
 * vitrin kartında görünen karedir. Bu yüzden "kapak yap" ayrı bir işlem olarak
 * duruyor: en sık istenen düzenleme bu.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES_PER_UPLOAD = 10;

/** Yeni fotoğraf(lar) yükler ve bir renge bağlar. */
export async function uploadImagesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  // Boş dize "tüm renkler" demek; veritabanında null olarak saklanıyor.
  const colorNameRaw = String(formData.get("colorName") ?? "").trim();
  const colorName = colorNameRaw || null;

  if (!isImageUploadAvailable()) {
    return {
      error:
        "Fotoğraf yüklenemiyor: depolama bağlı değil. " +
        "Vercel → Storage → Blob oluşturup projeye bağlayın, sonra Redeploy yapın.",
    };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true, name: true },
  });
  if (!product) return { error: "Ürün bulunamadı." };

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) return { error: "Önce bir fotoğraf seçin." };
  if (files.length > MAX_IMAGES_PER_UPLOAD) {
    return { error: `Tek seferde en fazla ${MAX_IMAGES_PER_UPLOAD} fotoğraf yükleyebilirsiniz.` };
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return { error: `"${file.name}" bir fotoğraf değil.` };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: `"${file.name}" çok büyük. Fotoğraf başına en fazla 8 MB.` };
    }
  }

  // Yeni kareler mevcutların ARDINA ekleniyor: yükleme yapmak kapak fotoğrafını
  // değiştirmemeli, o ayrı ve bilinçli bir işlem olmalı.
  const last = await prisma.productImage.findFirst({
    where: { productId, colorName },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  let sortOrder = (last?.sortOrder ?? -1) + 1;

  const alt = colorName ? `${product.name} — ${colorName}` : product.name;

  for (const file of files) {
    const url = await storeImage(file, product.slug);
    await prisma.productImage.create({
      data: { productId, url, alt, colorName, sortOrder: sortOrder++ },
    });
  }

  revalidateStorefront();
  return {
    success:
      files.length === 1 ? "Fotoğraf yüklendi." : `${files.length} fotoğraf yüklendi.`,
  };
}

/** Bir fotoğrafı hem kayıttan hem depodan siler. */
export async function deleteImageAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const imageId = String(formData.get("imageId") ?? "");
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return { error: "Fotoğraf bulunamadı." };

  await prisma.productImage.delete({ where: { id: imageId } });
  await removeImage(image.url);

  revalidateStorefront();
  return { success: "Fotoğraf silindi." };
}

/** Seçilen fotoğrafı kendi renginin ilk sırasına — yani kapağına — taşır. */
export async function setPrimaryImageAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const imageId = String(formData.get("imageId") ?? "");
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return { error: "Fotoğraf bulunamadı." };

  /*
   * Aynı rengin tüm kareleri yeniden numaralanıyor: seçilen 0, kalanlar mevcut
   * sıralarını koruyarak 1'den devam ediyor. Yalnızca seçileni 0 yapmak
   * yetmezdi — zaten 0 olan başka bir kare varsa sıra belirsiz kalırdı.
   */
  const siblings = await prisma.productImage.findMany({
    where: { productId: image.productId, colorName: image.colorName },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  const ordered = [imageId, ...siblings.map((s) => s.id).filter((id) => id !== imageId)];

  await prisma.$transaction(
    ordered.map((id, index) =>
      prisma.productImage.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );

  revalidateStorefront();
  return { success: "Kapak fotoğrafı değiştirildi." };
}

/** Vitrinin fotoğraf gösteren her yerini tazeler. */
function revalidateStorefront(): void {
  revalidatePath("/admin/urunler");
  revalidatePath("/");
  revalidatePath("/urun/[slug]", "page");
}
