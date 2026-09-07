/*
 * Yayın öncesi veritabanı hazırlığı. Vercel'de `next build`'den ÖNCE çalışır.
 *
 * Yaptığı iki iş:
 *   1. Bekleyen migration'ları uygular (tablolar yoksa oluşturur).
 *   2. Ürün tablosu TAMAMEN BOŞSA başlangıç verisini yükler.
 *
 * İkinci adımdaki koşul kritik: dolu bir katalog varsa hiçbir şeye dokunmaz.
 * Aksi hâlde her yayında mağaza sahibinin düzenlemeleri örnek verilerle
 * ezilirdi.
 *
 * DATABASE_URL tanımlı değilse (ör. veritabanı henüz bağlanmamış yeni bir
 * Vercel projesi) hata vermeden çıkar — derleme yine de tamamlanır ve site
 * kurulum yönergesi gösterir.
 */
import { execFileSync } from "node:child_process";

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

if (!process.env.DATABASE_URL) {
  console.warn(
    "[prepare-deploy] DATABASE_URL tanımlı değil — migration ve seed atlandı.\n" +
      "[prepare-deploy] Site derlenecek ancak veritabanı bağlanana kadar kurulum ekranı gösterecek.",
  );
  process.exit(0);
}

console.log("[prepare-deploy] Migration'lar uygulanıyor…");
run("npx", ["prisma", "migrate", "deploy"]);

console.log("[prepare-deploy] Katalog kontrol ediliyor…");
run("npx", ["tsx", "prisma/seed.ts", "--if-empty"]);
