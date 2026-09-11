/*
 * Basit, bellekte tutulan istek sayacı.
 *
 * Şifresiz uçlar (ölçüm kaydı gibi) için: kimse giriş yapmadığından tek
 * koruma budur. Sunucu yeniden başlayınca veya birden fazla örnek çalışınca
 * sıfırlanır, yani kusursuz değil — sıradan bir kötüye kullanımı durdurmak
 * için yeterli, gerçek bir kilit için değil.
 *
 * Sipariş takibi kendi sayacını kullanıyor (lib/order-lookup.ts): oradaki
 * kurallar güvenlikle ilgili ve testleri ayrı, bu yüzden bilinçli olarak
 * birleştirilmedi.
 */

export type Limiter = {
  /** Bir istek daha yapılabilir mi? Yapılabiliyorsa sayacı artırır. */
  allow(key: string, now?: number): boolean;
};

export function createLimiter({ max, windowMs }: { max: number; windowMs: number }): Limiter {
  const buckets = new Map<string, { count: number; firstAt: number }>();

  return {
    allow(key: string, now: number = Date.now()): boolean {
      // Sayaç sonsuza kadar büyümesin.
      for (const [k, v] of buckets) {
        if (now - v.firstAt > windowMs) buckets.delete(k);
      }

      const current = buckets.get(key);
      if (!current || now - current.firstAt > windowMs) {
        buckets.set(key, { count: 1, firstAt: now });
        return true;
      }
      if (current.count >= max) return false;

      current.count += 1;
      return true;
    },
  };
}
