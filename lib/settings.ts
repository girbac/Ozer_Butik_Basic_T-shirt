import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export type StoreSettings = {
  /** Kargo ücreti, kuruş */
  shippingFee: number;
  /** Bu tutarın üzerinde kargo bedava, kuruş */
  freeShippingThreshold: number;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  shippingFee: 4900,
  freeShippingThreshold: 50000,
};

/*
 * Ayarlar mağaza çerçevesinde (başlık şeridi, kargo eşiği) kullanılıyor ve bu
 * çerçeve HER sayfada var. Buradan fırlayan bir hata sayfa değil DÜZEN
 * seviyesinde olduğu için hata sınırına yakalanmıyor ve tüm siteyi Vercel'in
 * genel 500 ekranına düşürüyordu.
 *
 * Bu yüzden ayarlar okunamazsa varsayılanlara düşüyoruz: duyuru metni ve kargo
 * ücreti gibi değerler kozmetik, mağazayı komple kapatmaya değmez. Asıl sorun
 * gizlenmiyor — log'a yazılıyor ve ürünleri okuyan sayfa zaten kendi hatasını
 * açıkça gösteriyor (bkz. app/(shop)/page.tsx).
 */
export async function getSettings(): Promise<StoreSettings> {
  // Veritabanı henüz bağlanmadıysa site yine de açılsın (demo görünümü)
  if (!isDatabaseConfigured()) return DEFAULT_SETTINGS;

  try {
    return await readSettingsFromDatabase();
  } catch (error) {
    console.error("[settings] okunamadı, varsayılanlar kullanılıyor:", error);
    return DEFAULT_SETTINGS;
  }
}

async function readSettingsFromDatabase(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((row) => [row.key, row.value]));

  const readNumber = (key: keyof StoreSettings, fallback: number) => {
    const parsed = Number(map.get(key));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  return {
    shippingFee: readNumber("shippingFee", DEFAULT_SETTINGS.shippingFee),
    freeShippingThreshold: readNumber(
      "freeShippingThreshold",
      DEFAULT_SETTINGS.freeShippingThreshold,
    ),
  };
}

/** Ara toplama göre kargo ücretini hesaplar. Tek doğru kaynak burasıdır. */
export function calculateShipping(subtotal: number, settings: StoreSettings): number {
  if (subtotal <= 0) return 0;
  return subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
}
