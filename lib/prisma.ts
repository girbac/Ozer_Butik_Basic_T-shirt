import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { findDatabaseUrl, listPostgresEnvNames } from "@/lib/database-url.mjs";

/*
 * Veritabanı istemcisi — TEMBEL kurulur.
 *
 * Neden tembel: istemci modül yüklenirken kurulsaydı, `import { prisma }` yazan
 * her dosya DATABASE_URL yokken çökerdi. Next.js derleme sırasında sayfa ve API
 * rotası modüllerini değerlendirdiği için, veritabanı bağlanmamış bir projede
 * (ör. Vercel'e ilk yayın) derleme şu hatayla dururdu:
 *
 *   Failed to collect page data for /api/checkout
 *   [cause]: DATABASE_URL tanımlı değil
 *
 * Aşağıdaki Proxy sayesinde istemci yalnızca gerçekten bir sorgu çalıştırıldığında
 * kuruluyor. Böylece derleme geçiyor, veritabanı gerektiren istekler ise çalışma
 * anında net bir hata veriyor — sorun gizlenmiyor, ertelenmiş oluyor.
 */

// Next.js geliştirme modunda hot reload her seferinde yeni bir client yaratmasın diye
// global üzerinde tekil örnek tutuyoruz. Aksi halde bağlantı havuzu tükeniyor.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Kullanılabilir bir veritabanı adresi var mı?
 *
 * Yeni kurulan bir projede (ör. Vercel'e ilk yayın) veritabanı henüz bağlanmamış
 * olabilir. Bu durumda uygulamanın çökmesi yerine kurulum yönergesi göstermesini
 * istiyoruz. Yalnızca adresin VARLIĞINI kontrol eder — bağlantı hatalarını
 * gizlemez, onlar normal şekilde yükselir.
 *
 * Adres tek bir değişken adına bağlı değil; bkz. lib/database-url.mjs.
 */
export function isDatabaseConfigured(): boolean {
  return findDatabaseUrl() !== null;
}

/** Adresin hangi ortam değişkeninde bulunduğu. Kurulum durumu sayfası için. */
export function getDatabaseUrlSource(): string | null {
  return findDatabaseUrl()?.source ?? null;
}

function createPrismaClient(): PrismaClient {
  const found = findDatabaseUrl();

  if (!found) {
    // Hata mesajı ne ARADIĞIMIZI değil, ne BULDUĞUMUZU söylesin: log'a bakan
    // kişi eksik olanın ne olduğunu tahmin etmek zorunda kalmasın.
    const seen = listPostgresEnvNames();
    throw new Error(
      "Veritabanı adresi bulunamadı. " +
        (seen.length > 0
          ? `Postgres adresi taşıyan değişkenler: ${seen.join(", ")} — ama hiçbiri okunamadı.`
          : "Ortamda Postgres adresi taşıyan hiçbir değişken yok.") +
        " Yerelde .env dosyanızı .env.example'a bakarak doldurun; " +
        "Vercel'de Storage sekmesinden bir Postgres veritabanı bağlayın.",
    );
  }

  const connectionString = found.url;

  // Prisma 7 Postgres için sürücü adaptörü zorunlu.
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Gerçek istemciye tembel geçiş yapan vekil. Dışarıdan normal bir PrismaClient
 * gibi kullanılır: `prisma.product.findMany()`, `prisma.$transaction(...)` vb.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property) as unknown;
    // $transaction, $queryRaw gibi metotlar istemciye bağlı kalmalı
    return typeof value === "function" ? value.bind(client) : value;
  },
});
