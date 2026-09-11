import "server-only";

import { prisma } from "@/lib/prisma";

/*
 * Ziyaret özetini veritabanından okur.
 *
 * Toplama SQL'de yapılıyor; satırları Node'a çekip burada toplasaydık birkaç
 * bin ziyaretten sonra sayfa yavaşlardı.
 */

/** Bu kadar günden eski kayıtlar temizlenir. */
export const RETENTION_DAYS = 90;

export type SayfaOzeti = {
  path: string;
  goruntuleme: number;
  ziyaret: number;
  toplamSure: number;
  ortalamaSure: number;
};

export type ZiyaretOzeti = {
  gun: number;
  toplamZiyaret: number;
  toplamGoruntuleme: number;
  mobilOran: number | null;
  sayfalar: SayfaOzeti[];
  gunluk: { tarih: string; ziyaret: number }[];
};

function since(gun: number): Date {
  return new Date(Date.now() - gun * 24 * 60 * 60 * 1000);
}

/**
 * Seçilen gün aralığı için ziyaret özetini döndürür.
 *
 * @param gun Kaç günlük veri. 7 veya 30 gibi.
 */
export async function getZiyaretOzeti(gun: number): Promise<ZiyaretOzeti> {
  const baslangic = since(gun);

  /*
   * Sayfa kırılımı. "ziyaret" sütunu DISTINCT visitId — aynı ziyaretçinin
   * sayfayı üç kez açması üç görüntüleme ama tek ziyaret sayılmalı.
   */
  const sayfalar = await prisma.$queryRaw<
    { path: string; goruntuleme: bigint; ziyaret: bigint; toplam: bigint }[]
  >`
    SELECT path,
           COUNT(*)                        AS goruntuleme,
           COUNT(DISTINCT "visitId")       AS ziyaret,
           COALESCE(SUM("durationMs"), 0)  AS toplam
    FROM "PageView"
    WHERE "createdAt" >= ${baslangic}
    GROUP BY path
    ORDER BY toplam DESC
    LIMIT 50
  `;

  const genel = await prisma.$queryRaw<
    { ziyaret: bigint; goruntuleme: bigint; mobil: bigint }[]
  >`
    SELECT COUNT(DISTINCT "visitId")                             AS ziyaret,
           COUNT(*)                                             AS goruntuleme,
           COUNT(*) FILTER (WHERE device = 'mobil')             AS mobil
    FROM "PageView"
    WHERE "createdAt" >= ${baslangic}
  `;

  const gunluk = await prisma.$queryRaw<{ tarih: Date; ziyaret: bigint }[]>`
    SELECT DATE_TRUNC('day', "createdAt") AS tarih,
           COUNT(DISTINCT "visitId")      AS ziyaret
    FROM "PageView"
    WHERE "createdAt" >= ${baslangic}
    GROUP BY 1
    ORDER BY 1
  `;

  const toplamGoruntuleme = Number(genel[0]?.goruntuleme ?? 0);
  const mobil = Number(genel[0]?.mobil ?? 0);

  return {
    gun,
    toplamZiyaret: Number(genel[0]?.ziyaret ?? 0),
    toplamGoruntuleme,
    mobilOran: toplamGoruntuleme > 0 ? Math.round((mobil / toplamGoruntuleme) * 100) : null,
    sayfalar: sayfalar.map((satir) => {
      const goruntuleme = Number(satir.goruntuleme);
      const toplamSure = Number(satir.toplam);
      return {
        path: satir.path,
        goruntuleme,
        ziyaret: Number(satir.ziyaret),
        toplamSure,
        ortalamaSure: goruntuleme > 0 ? Math.round(toplamSure / goruntuleme) : 0,
      };
    }),
    gunluk: gunluk.map((satir) => ({
      tarih: satir.tarih.toISOString().slice(0, 10),
      ziyaret: Number(satir.ziyaret),
    })),
  };
}

/**
 * Eski kayıtları siler.
 *
 * Ayrı bir zamanlanmış görev kurmak yerine panel açıldığında çalışıyor: ölçüm
 * tablosu tek büyüyen tablo, sınırsız büyümesinin tek zararı da depolama.
 * Panele kimse bakmıyorsa zaten aciliyeti yok.
 */
export async function pruneOldPageViews(): Promise<void> {
  try {
    await prisma.pageView.deleteMany({ where: { createdAt: { lt: since(RETENTION_DAYS) } } });
  } catch (error) {
    console.error("[olcum] eski kayıtlar temizlenemedi:", error);
  }
}
