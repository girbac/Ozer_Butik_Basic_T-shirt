import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export type StoreSettings = {
  /** Kargo ücreti, kuruş */
  shippingFee: number;
  /** Bu tutarın üzerinde kargo bedava, kuruş */
  freeShippingThreshold: number;
  /** Sayfa üstündeki duyuru şeridi metni */
  announcement: string;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  shippingFee: 4900,
  freeShippingThreshold: 50000,
  announcement: "500 TL üzeri kargo bedava · 14 gün içinde ücretsiz iade",
};

export async function getSettings(): Promise<StoreSettings> {
  // Veritabanı henüz bağlanmadıysa site yine de açılsın (bkz. kurulum ekranı)
  if (!isDatabaseConfigured()) return DEFAULT_SETTINGS;

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
    announcement: map.get("announcement") ?? DEFAULT_SETTINGS.announcement,
  };
}

/** Ara toplama göre kargo ücretini hesaplar. Tek doğru kaynak burasıdır. */
export function calculateShipping(subtotal: number, settings: StoreSettings): number {
  if (subtotal <= 0) return 0;
  return subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
}
