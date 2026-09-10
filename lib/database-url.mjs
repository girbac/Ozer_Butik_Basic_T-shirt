/*
 * Veritabanı adresini ORTAM DEĞİŞKENLERİNİN ADINDAN BAĞIMSIZ bulur.
 *
 * Neden gerekli: Vercel'de bir Postgres bağlarken "Custom Environment Variable
 * Prefix" diye bir alan var ve varsayılanı her zaman DATABASE değil. Ön ek
 * STORAGE seçilirse değişken STORAGE_URL olarak oluşuyor; uygulama
 * DATABASE_URL aradığı için veritabanı bağlı olduğu hâlde "tanımlı değil"
 * diyordu. Kullanıcının bunu ekrandan anlaması mümkün değil — hata veritabanında
 * değil, iki ismin uyuşmamasında.
 *
 * Bu yüzden isim aramayı uygulama yapıyor:
 *   1. Bilinen isimler sırayla denenir (aşağıdaki listeler).
 *   2. Hiçbiri yoksa _URL ile biten TÜM değişkenler taranır ve değeri
 *      postgres:// veya postgresql:// ile başlayan ilki kullanılır.
 *
 * İkinci adım değeri de kontrol ettiği için yanlış bir değişkeni seçme riski yok:
 * Postgres adresi olmayan hiçbir şey eşleşmiyor.
 *
 * Bu dosya .mjs — hem Next.js çalışma anından (TypeScript), hem yayın öncesi
 * çalışan düz node betiğinden, hem de Prisma yapılandırmasından aynı mantığın
 * kullanılabilmesi için. Üç yerde ayrı ayrı yazılsaydı biri güncellenip
 * diğerleri unutulurdu.
 */

/**
 * Havuzlanmış (pooled) bağlantı isimleri. Uygulama çalışırken bunlar tercih
 * edilir: çok sayıda kısa ömürlü sunucusuz istek için doğru olan bu.
 */
const POOLED_NAMES = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_POSTGRES_URL",
  "STORAGE_URL",
  "STORAGE_POSTGRES_URL",
];

/**
 * Doğrudan (havuzsuz) bağlantı isimleri. Migration çalıştırırken bunlar tercih
 * edilir: şema değişiklikleri havuzlayıcı üzerinden bazı kurulumlarda
 * takılabiliyor.
 */
const DIRECT_NAMES = [
  "DIRECT_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "STORAGE_URL_UNPOOLED",
];

/** Değer gerçekten bir Postgres adresi mi? */
function looksLikePostgresUrl(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.startsWith("postgres://") || trimmed.startsWith("postgresql://");
}

function readCandidate(env, name) {
  const value = env[name];
  if (!looksLikePostgresUrl(value)) return null;
  return { url: value.trim(), source: name };
}

/**
 * Kullanılabilir bir Postgres adresi arar.
 *
 * @param {Record<string, string | undefined>} [env] Aranacak ortam değişkenleri.
 * @param {{ preferDirect?: boolean }} [options]
 *   preferDirect: migration gibi işler için havuzsuz bağlantıyı öne al.
 * @returns {{ url: string, source: string } | null}
 *   Bulunan adres ve HANGİ değişkende bulunduğu. Bulunamazsa null.
 */
export function findDatabaseUrl(env = process.env, options = {}) {
  const ordered = options.preferDirect
    ? [...DIRECT_NAMES, ...POOLED_NAMES]
    : [...POOLED_NAMES, ...DIRECT_NAMES];

  for (const name of ordered) {
    const found = readCandidate(env, name);
    if (found) return found;
  }

  /*
   * Bilinen isimlerin hiçbiri yoksa: adı _URL ile biten değişkenleri tara.
   * Sıralı geziyoruz ki aynı ortamda her zaman aynı değişken seçilsin —
   * nesne anahtar sırasına güvenmek, kurulumdan kuruluma değişen davranış
   * üretirdi.
   */
  for (const name of Object.keys(env).sort()) {
    if (!name.endsWith("_URL")) continue;
    const found = readCandidate(env, name);
    if (found) return found;
  }

  return null;
}

/**
 * Postgres adresi taşıyan değişkenlerin ADLARINI döndürür — değerlerini asla.
 *
 * Kurulum durumu sayfasında "hangi isimler var" diye göstermek için. Değer
 * gösterilmediği için gizli bilgi sızmıyor; isim ise kullanıcının Vercel
 * ekranında zaten gördüğü şey.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {string[]}
 */
export function listPostgresEnvNames(env = process.env) {
  return Object.keys(env)
    .filter((name) => looksLikePostgresUrl(env[name]))
    .sort();
}
