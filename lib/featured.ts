/*
 * Vitrinde öne çıkan (büyük) modelin sırayla değişmesi.
 *
 * Neden ekranda değil, sayfa açılışında: büyük kart iki sütun kaplıyor,
 * küçükler bir. Öne çıkan değişince diğer kartlar da yer değiştirmek zorunda
 * kalıyor, yani ızgaranın tamamı kayıyor. Müşteri "Sepete Ekle"ye basmak
 * üzereyken düğme parmağının altından kaçardı; seçtiği beden de sıfırlanırdı.
 * Ayrıca kendiliğinden değişen içerik için erişilebilirlik kuralı "durdur"
 * düğmesi istiyor (WCAG 2.2.2).
 *
 * Bunun yerine seçim SAATE bağlı: aynı saat içinde herkes aynı modeli görüyor,
 * saat değişince sıradaki model öne geçiyor. Ziyaretçi bakarken hiçbir şey
 * oynamıyor ama farklı zamanlarda gelen farklı modeli görüyor.
 *
 * Sunucuda hesaplanıyor, JavaScript gerekmiyor. Ana sayfa 60 saniyede bir
 * tazelendiği için (bkz. app/(shop)/page.tsx) saat dönümü en geç bir dakika
 * içinde yansıyor.
 */

const BIR_SAAT_MS = 60 * 60 * 1000;

/**
 * Diziyi, o saatin öne çıkan ögesi başa gelecek şekilde sıralar.
 *
 * Kalanlar kendi aralarındaki sırayı korur — böylece yalnızca bir kart yer
 * değiştirmiş gibi görünür, liste her saat baştan karılmış gibi olmaz.
 *
 * @param items Sıralanacak liste.
 * @param now Zaman damgası; testlerde sabitlenebilsin diye dışarıdan verilebilir.
 */
export function orderWithFeatured<T>(items: T[], now: number = Date.now()): T[] {
  // Tek öge veya boş liste için döndürecek bir şey yok.
  if (items.length < 2) return items;

  /*
   * Yerel saat yerine epoch'tan bu yana geçen saat sayısı kullanılıyor: sunucunun
   * saat dilimi ne olursa olsun sonuç aynı ve sayı sürekli arttığı için liste
   * düzgün sırayla dönüyor.
   */
  const hoursSinceEpoch = Math.floor(now / BIR_SAAT_MS);
  const index = hoursSinceEpoch % items.length;

  return [items[index], ...items.slice(0, index), ...items.slice(index + 1)];
}
