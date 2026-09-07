/*
 * Sitenin genel adresi.
 *
 * Neden ayrı bir dosya: `process.env.X ?? "yedek"` yazmak YETERLİ DEĞİL. `??`
 * yalnızca undefined/null için yedeğe düşer, BOŞ METİN için düşmez. Vercel'de
 * tanımlanıp boş bırakılmış bir değişken bu yüzden yedeği devre dışı bırakıp
 * `new URL("")` ile derlemeyi kırıyordu. Burada boş ve yalnızca boşluktan oluşan
 * değerler de "tanımsız" sayılıyor.
 */

/** Boş veya yalnızca boşluk içeren değerleri yok sayar. */
function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/**
 * Sırasıyla:
 *   1. NEXT_PUBLIC_SITE_URL — kendi alan adınız (canlıda bu kullanılmalı)
 *   2. Vercel'in otomatik verdiği adres — değişken girilmemiş olsa bile site çalışsın
 *   3. localhost — geliştirme
 *
 * Sondaki eğik çizgi temizlenir ki `${siteUrl}/api/...` birleşimi çift çizgi üretmesin.
 */
export function getSiteUrl(): string {
  const explicit = readEnv("NEXT_PUBLIC_SITE_URL");
  if (explicit) return stripTrailingSlash(withProtocol(explicit));

  // Vercel bu değişkenleri kendisi tanımlar; protokol içermezler.
  const vercelHost =
    readEnv("VERCEL_PROJECT_PRODUCTION_URL") ?? readEnv("VERCEL_URL");
  if (vercelHost) return stripTrailingSlash(`https://${vercelHost}`);

  return "http://localhost:3000";
}

function withProtocol(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** iyzico API adresi. Girilmemişse sandbox — canlıya yanlışlıkla geçilmesin diye. */
export function getIyzicoUri(): string {
  return readEnv("IYZIPAY_URI") ?? "https://sandbox-api.iyzipay.com";
}

export { readEnv };
