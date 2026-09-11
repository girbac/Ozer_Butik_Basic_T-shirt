/*
 * Ziyaret ölçümünün saf kısmı: yol sadeleştirme, doğrulama ve özetleme.
 * Veritabanına dokunmuyor, bu yüzden testlerle doğrudan sınanabiliyor.
 *
 * Neden kendi ölçümümüz: Vercel'in paneli de sayıyor ama oraya girmek için
 * ayrı bir hesaba bakmak gerekiyor. Mağaza sahibinin verisi kendi yönetim
 * panelinde, siparişlerin yanında olmalı.
 */

/** Bir sayfada geçirilen süre bundan uzun olamaz. */
export const MAX_DURATION_MS = 30 * 60 * 1000;
/** Bundan kısa kalışlar sayılmaz: sekmeyi açıp hemen kapatmak "ziyaret" değil. */
export const MIN_DURATION_MS = 300;

export type Device = "mobil" | "masaustu";

/**
 * Ham adresi ölçümde saklanacak hâline çevirir.
 *
 * İki iş yapıyor:
 *
 * 1. DEĞİŞKEN KISIMLARI SABİTLİYOR. /siparis/OB-2026-1171 kaydedilseydi hem
 *    sipariş numaraları ölçüm tablosuna sızardı hem de her sipariş ayrı satır
 *    açıp listeyi kullanılmaz hâle getirirdi. Ürün adresleri ise olduğu gibi
 *    kalıyor — hangi modelin ilgi çektiği tam da öğrenmek istediğimiz şey.
 * 2. Sorgu ve çapa kısmını atıyor (?renk=siyah, #detay): aynı sayfa tek satırda
 *    toplansın.
 */
export function normalizePath(raw: string): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/")) return null;

  /*
   * "//evil.com" bir yol değil, protokol-göreli bir DIŞ ADRES — tarayıcı onu
   * https://evil.com diye çözer. Bizim tablomuzda yer almamalı: panelde bir
   * gün bağlantıya dönüştürülürse mağaza sahibini dışarı çıkarırdı.
   */
  if (raw.startsWith("//")) return null;

  const yol = raw.split(/[?#]/)[0];
  if (yol.length > 120) return null;
  // Yalnızca beklenen karakterler; geri kalanı çöp veya saldırı denemesidir.
  if (!/^\/[A-Za-z0-9\-._~/%]*$/.test(yol)) return null;

  // Sondaki eğik çizgiyi at ("/sepet/" ile "/sepet" aynı sayfa).
  const temiz = yol.length > 1 ? yol.replace(/\/+$/, "") : yol;

  // Sipariş numarası kişiye bağlı bir bilgi; ölçüme girmemeli.
  if (/^\/siparis\/[^/]+$/.test(temiz)) return "/siparis/[no]";

  return temiz || "/";
}

/** Sayfa yolunu mağaza sahibinin anlayacağı ada çevirir. */
export function pathLabel(path: string): string {
  const SABIT: Record<string, string> = {
    "/": "Ana sayfa",
    "/sepet": "Sepet",
    "/odeme": "Ödeme",
    "/siparis-takip": "Sipariş takibi",
    "/siparis/[no]": "Sipariş sonucu",
    "/hakkimizda": "Hakkımızda",
    "/iletisim": "İletişim",
    "/kargo-ve-teslimat": "Kargo ve Teslimat",
    "/iptal-ve-iade": "İptal ve İade",
    "/mesafeli-satis": "Mesafeli Satış",
    "/on-bilgilendirme": "Ön Bilgilendirme",
    "/gizlilik": "Gizlilik ve KVKK",
    "/cerez-politikasi": "Çerez Politikası",
  };
  if (SABIT[path]) return SABIT[path];

  // /urun/slim-fit-basic-tee → "Ürün: Slim Fit Basic Tee"
  const urun = path.match(/^\/urun\/(.+)$/);
  if (urun) {
    const ad = urun[1]
      .split("-")
      .map((kelime) => kelime.charAt(0).toUpperCase() + kelime.slice(1))
      .join(" ");
    return `Ürün: ${ad}`;
  }

  return path;
}

export type OlcumGirdisi = {
  path: string;
  visitId: string;
  durationMs: number;
  device: Device;
};

/**
 * Tarayıcıdan gelen ham ölçüm kaydını doğrular.
 *
 * Bu uç nokta giriş şifresi istemiyor — istemesi de saçma olurdu, ziyaretçi
 * anonim. O yüzden gelen her alan burada sınırlanıyor: uydurma yollar
 * kaydedilmiyor, süre kırpılıyor, kimlik uzunluğu sabitleniyor. Aksi hâlde
 * tablo çöple doldurulabilirdi.
 */
export function parseOlcum(raw: unknown): OlcumGirdisi | null {
  if (typeof raw !== "object" || raw === null) return null;
  const veri = raw as Record<string, unknown>;

  const path = typeof veri.path === "string" ? normalizePath(veri.path) : null;
  if (!path) return null;

  const visitId = typeof veri.visitId === "string" ? veri.visitId.trim() : "";
  if (!/^[A-Za-z0-9-]{8,64}$/.test(visitId)) return null;

  const device = veri.device === "mobil" || veri.device === "masaustu" ? veri.device : null;
  if (!device) return null;

  const ham = typeof veri.durationMs === "number" ? veri.durationMs : NaN;
  if (!Number.isFinite(ham) || ham < MIN_DURATION_MS) return null;
  const durationMs = Math.min(Math.round(ham), MAX_DURATION_MS);

  return { path, visitId, durationMs, device };
}

/** "1 dk 20 sn" gibi okunur süre. */
export function formatDuration(ms: number): string {
  const saniye = Math.round(ms / 1000);
  if (saniye < 60) return `${saniye} sn`;
  const dakika = Math.floor(saniye / 60);
  const kalan = saniye % 60;
  return kalan === 0 ? `${dakika} dk` : `${dakika} dk ${kalan} sn`;
}
