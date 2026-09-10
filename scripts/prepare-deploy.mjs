/*
 * Yayın öncesi veritabanı hazırlığı. Vercel'de `next build`'den ÖNCE çalışır.
 *
 * Yaptığı üç iş:
 *   1. Veritabanı adresini bulur — değişkenin adı ne olursa olsun.
 *   2. Bekleyen migration'ları uygular (tablolar yoksa oluşturur).
 *   3. Ürün tablosu TAMAMEN BOŞSA başlangıç verisini yükler.
 *
 * Üçüncü adımdaki koşul kritik: dolu bir katalog varsa hiçbir şeye dokunmaz.
 * Aksi hâlde her yayında mağaza sahibinin düzenlemeleri örnek verilerle
 * ezilirdi.
 *
 * Adres bulunamazsa (ör. veritabanı henüz bağlanmamış yeni bir Vercel projesi)
 * hata vermeden çıkar — derleme tamamlanır ve site demo görünümünde açılır:
 * beş model görünür, sipariş alınmaz.
 */
import { execFileSync } from "node:child_process";
import { findDatabaseUrl, listPostgresEnvNames } from "../lib/database-url.mjs";

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

/*
 * Migration için havuzsuz bağlantı tercih ediliyor: şema değişiklikleri
 * havuzlayıcı üzerinden bazı kurulumlarda takılıyor. Böyle bir değişken yoksa
 * normal adres kullanılıyor, o da çalışıyor.
 */
const found = findDatabaseUrl(process.env, { preferDirect: true });

if (!found) {
  const seen = listPostgresEnvNames();
  console.warn(
    "[prepare-deploy] Veritabanı adresi bulunamadı — migration ve seed atlandı.\n" +
      (seen.length > 0
        ? `[prepare-deploy] Postgres adresi taşıyan değişkenler: ${seen.join(", ")}\n`
        : "[prepare-deploy] Ortamda Postgres adresi taşıyan hiçbir değişken yok.\n") +
      "[prepare-deploy] Site DEMO görünümünde açılacak: ürünler görünür, sipariş alınmaz.\n" +
      "[prepare-deploy] Gerçek mağaza için Vercel'de Storage → Postgres bağlayıp yeniden dağıtın.",
  );
  process.exit(0);
}

/*
 * Bulunan adresi DATABASE_URL olarak yazıyoruz. Alt süreçler (prisma CLI ve
 * seed betiği) ortamı miras aldığı için ikisi de artık doğru adresi görüyor;
 * onları ayrı ayrı değiştirmeye gerek kalmıyor.
 */
process.env.DATABASE_URL = found.url;
console.log(`[prepare-deploy] Veritabanı adresi ${found.source} değişkeninde bulundu.`);

console.log("[prepare-deploy] Migration'lar uygulanıyor…");
run("npx", ["prisma", "migrate", "deploy"]);

console.log("[prepare-deploy] Katalog kontrol ediliyor…");
run("npx", ["tsx", "prisma/seed.ts", "--if-empty"]);
