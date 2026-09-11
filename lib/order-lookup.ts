/*
 * Sipariş takibinin veritabanına dokunmayan kısmı: kod/e-posta biçimlendirme,
 * eşleştirme ve deneme sınırı. Burada tutulmasının sebebi testlenebilmesi —
 * bu ekran giriş şifresi olmadan herkese açık, dolayısıyla kuralları
 * doğrulanmış olmalı.
 *
 * TEHDİT: sipariş numaraları SIRALI (OB-2026-1171, -1172 …). Yani numara sır
 * değil, tahmin edilebilir. Siparişi açan şey numara değil, numara + e-posta
 * ikilisi. Birini bilen diğerini denemesin diye de deneme sayısı sınırlı.
 */

/** Aynı anahtar için bu süre içinde izin verilen başarısız deneme sayısı. */
export const MAX_ATTEMPTS = 8;
export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Sayacın anahtarı: IP + e-posta.
 *
 * Yalnızca IP kullanmak yanlış olurdu. Türkiye'de mobil operatörler CGNAT
 * kullanıyor, yani binlerce abone tek bir IP'nin arkasından çıkıyor; sırf IP'ye
 * bakan bir sayaç, birbirini hiç tanımayan müşterileri birbirine kilitlerdi.
 *
 * Saldırı senaryosu zaten "e-postasını bildiğim kişinin sipariş numarasını
 * tara" olduğu için saldırganın denemeleri hep AYNI e-postayla yapılmak
 * zorunda — dolayısıyla hepsi tek kovaya düşüyor ve sınır onu yakalıyor.
 */
export function attemptKey(ip: string, email: string): string {
  return `${ip}|${normalizeEmail(email)}`;
}

/**
 * Kullanıcının yazdığı sipariş numarasını saklama biçimine çevirir.
 *
 * Müşteri numarayı e-postadan kopyalarken başına/sonuna boşluk alabiliyor,
 * küçük harfle veya tirelerle yazabiliyor. "ob 2026 1171", "OB-2026-1171"
 * ve " ob-2026-1171 " aynı siparişi bulmalı.
 */
export function normalizeOrderNo(input: string): string {
  const temiz = input.trim().toUpperCase().replace(/[\s_]+/g, "-");
  // Birden fazla tireyi teke indir, baştaki/sondaki tireyi at.
  return temiz.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/** Boşlukları atar ve küçük harfe çevirir. E-posta karşılaştırması büyük/küçük harf duyarsızdır. */
export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/** Biçim olarak sipariş numarasına benziyor mu? Benzemiyorsa veritabanına hiç gitmiyoruz. */
export function isValidOrderNo(orderNo: string): boolean {
  return /^[A-Z0-9]+(-[A-Z0-9]+){1,3}$/.test(orderNo) && orderNo.length <= 32;
}

/** Kabaca e-posta mı? Zod'daki kadar katı değil; amaç sadece boş/saçma girdiyi elemek. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120;
}

/**
 * Girilen e-posta siparişin e-postasıyla eşleşiyor mu?
 *
 * Karşılaştırma normalize edilmiş hâlleri üzerinden yapılıyor; müşteri
 * "Ahmet@Ornek.com" yazsa da siparişi bulabilmeli.
 */
export function emailMatches(girilen: string, kayitli: string): boolean {
  return normalizeEmail(girilen) === normalizeEmail(kayitli);
}

/*
 * Deneme sayacı — bellekte.
 *
 * Sunucu yeniden başlayınca veya birden fazla örnek çalışınca sıfırlanır, yani
 * kusursuz değil. Yine de sıradan bir deneme-yanılma saldırısını (tek makineden
 * yüzlerce numara denemek) durdurur. Gerçek bir kilit gerekirse bunun
 * veritabanına taşınması gerekir; 5 ürünlük bir mağaza için orantısız olurdu.
 */
type Attempt = { count: number; firstAt: number };
const attempts = new Map<string, Attempt>();

/** Sayaç sonsuza kadar büyümesin: penceresi geçmiş kayıtları at. */
function sweep(now: number): void {
  for (const [key, value] of attempts) {
    if (now - value.firstAt > ATTEMPT_WINDOW_MS) attempts.delete(key);
  }
}

export type RateCheck = { allowed: true } | { allowed: false; retryAfterMs: number };

/**
 * Bu anahtar (genellikle IP) bir deneme daha yapabilir mi?
 *
 * @param key Sayacın tutulacağı anahtar.
 * @param now Şimdiki zaman; testlerde sabitlenebilsin diye dışarıdan verilebilir.
 */
export function registerAttempt(key: string, now: number = Date.now()): RateCheck {
  sweep(now);

  const current = attempts.get(key);
  if (!current || now - current.firstAt > ATTEMPT_WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return { allowed: true };
  }

  if (current.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: ATTEMPT_WINDOW_MS - (now - current.firstAt) };
  }

  current.count += 1;
  return { allowed: true };
}

/** Başarılı sorgudan sonra sayacı sıfırlar — doğru bilen kişi cezalandırılmasın. */
export function clearAttempts(key: string): void {
  attempts.delete(key);
}

/** Testlerin birbirini etkilememesi için. */
export function resetAttempts(): void {
  attempts.clear();
}

/** Kalan süreyi "3 dakika" gibi okunur hâle çevirir. */
export function formatRetryAfter(ms: number): string {
  const dakika = Math.max(1, Math.ceil(ms / 60000));
  return `${dakika} dakika`;
}
