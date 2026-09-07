/*
 * Katalog tanımı — 5 basic t-shirt modeli.
 *
 * TEK KAYNAK: hem veritabanı başlangıç verisi (prisma/seed.ts) hem de veritabanı
 * bağlı değilken gösterilen tanıtım kataloğu (lib/demo-catalog.ts) buradan okur.
 * İki yerde ayrı listeler tutulsaydı biri güncellenip diğeri unutulurdu.
 *
 * DİKKAT: Buradaki isimler, fiyatlar ve renkler GEÇİCİ yer tutuculardır.
 * Gerçek bilgiler netleştiğinde admin panelinden düzenlenir; bu dosyayı
 * güncellemek gerekmez.
 */

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

/** Renk paleti — public/urunler/<slug>-<görünüm>.webp dosyalarıyla eşleşir. */
export const COLORS = {
  siyah: { name: "Siyah", hex: "#1a1815" },
  beyaz: { name: "Beyaz", hex: "#fdfcfa" },
  gri: { name: "Gri", hex: "#9b968e" },
  lacivert: { name: "Lacivert", hex: "#232d45" },
  bej: { name: "Bej", hex: "#d8cbb4" },
  haki: { name: "Haki", hex: "#4d5340" },
  antrasit: { name: "Antrasit", hex: "#3a3835" },
} as const;

export type ColorSlug = keyof typeof COLORS;

export type CatalogProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  fabric: string;
  careInfo: string;
  price: number;
  comparePrice?: number;
  sortOrder: number;
  colors: ColorSlug[];
  /** Beden bazında stok. Belirtilmeyen beden için varsayılan kullanılır. */
  stockOverrides?: Record<string, number>;
};

export const PRODUCTS: CatalogProduct[] = [
  {
    slug: "regular-fit-basic-tee",
    name: "Regular Fit Basic Tee",
    tagline: "Ne dar ne bol — her güne uyan klasik kalıp.",
    description:
      "Günlük kullanım için tasarlanmış, vücudu sarmayan klasik kalıp. Omuz dikişi tam omuz hizasında oturur, kol boyu dirseğin üzerinde biter. Yıkamada çekme yapmaması için kumaş ön işlemden geçirilmiştir.",
    fabric: "%100 penye pamuk · 190 g/m² · Bisiklet yaka",
    careInfo:
      "30°C'de tersten yıkayın. Çamaşır suyu kullanmayın. Düşük ısıda ütüleyin. Kurutma makinesinde kurutmayın.",
    price: 49900,
    sortOrder: 1,
    colors: ["siyah", "beyaz", "gri", "lacivert"],
    stockOverrides: { XXL: 0 },
  },
  {
    slug: "oversize-basic-tee",
    name: "Oversize Basic Tee",
    tagline: "Düşük omuz, geniş kalıp, rahat duruş.",
    description:
      "Omuz dikişi kolun üzerine düşer, gövde bol keser. Bir beden küçük almanız gerekmez — normal bedeninizi seçin. Boyu kalçayı kapatacak uzunluktadır.",
    fabric: "%100 penye pamuk · 220 g/m² · Düşük omuz, bisiklet yaka",
    careInfo:
      "30°C'de tersten yıkayın. Çamaşır suyu kullanmayın. Düşük ısıda ütüleyin. Kurutma makinesinde kurutmayın.",
    price: 59900,
    sortOrder: 2,
    colors: ["siyah", "beyaz", "bej", "haki"],
  },
  {
    slug: "slim-fit-basic-tee",
    name: "Slim Fit Basic Tee",
    tagline: "Vücuda oturan dar kalıp.",
    description:
      "Bel hizasında daralan, vücut hatlarını takip eden kalıp. Ceket altında kullanmak için idealdir. Aranızda kaldıysa bir üst bedeni tercih edin.",
    fabric: "%95 pamuk %5 elastan · 180 g/m² · Bisiklet yaka",
    careInfo:
      "30°C'de tersten yıkayın. Çamaşır suyu kullanmayın. Düşük ısıda ütüleyin. Kurutma makinesinde kurutmayın.",
    price: 49900,
    sortOrder: 3,
    colors: ["siyah", "beyaz", "antrasit"],
    stockOverrides: { S: 2 },
  },
  {
    slug: "v-yaka-basic-tee",
    name: "V Yaka Basic Tee",
    tagline: "Yumuşak dokulu, sade V yaka.",
    description:
      "Boynu açık bırakan orta derinlikte V yaka. Yaka bandı esnekliğini kaybetmemesi için çift dikişle takviye edilmiştir. Regular Fit kalıpla aynı ölçülerdedir.",
    fabric: "%100 penye pamuk · 185 g/m² · V yaka",
    careInfo:
      "30°C'de tersten yıkayın. Çamaşır suyu kullanmayın. Düşük ısıda ütüleyin. Kurutma makinesinde kurutmayın.",
    price: 47900,
    sortOrder: 4,
    colors: ["siyah", "beyaz", "gri"],
  },
  {
    slug: "agir-gramaj-basic-tee",
    name: "Ağır Gramaj Basic Tee",
    tagline: "Kalın kumaş, dik duruş, uzun ömür.",
    description:
      "240 g/m² kumaşıyla koleksiyonun en kalın modeli. Işığa tutulduğunda içini göstermez, yıkandıkça formunu korur. Yaka ve etek ucu ekstra takviyelidir.",
    fabric: "%100 taranmış pamuk · 240 g/m² · Bisiklet yaka, takviyeli",
    careInfo:
      "30°C'de tersten yıkayın. Çamaşır suyu kullanmayın. Orta ısıda ütüleyin. Kurutma makinesinde kurutmayın.",
    price: 69900,
    comparePrice: 79900,
    sortOrder: 5,
    colors: ["siyah", "beyaz", "lacivert", "haki"],
  },
];

export const DEFAULT_STOCK = 12;

/** SKU: OB-REG-SIYAH-M gibi okunabilir ve benzersiz. */
export function buildSku(productSlug: string, colorSlug: string, size: string) {
  const productCode = productSlug.split("-")[0].slice(0, 6).toUpperCase();
  return `OB-${productCode}-${colorSlug.toUpperCase()}-${size}`;
}

export const VIEWS = ["on", "arka", "detay"] as const;
export type View = (typeof VIEWS)[number];

/** public/urunler altındaki yer tutucu görselin yolu. */
export function imageUrl(colorSlug: ColorSlug, view: View): string {
  return `/urunler/${colorSlug}-${view}.webp`;
}

export function imageAlt(productName: string, colorSlug: ColorSlug, view: View): string {
  const nasil = view === "on" ? "önden" : view === "arka" ? "arkadan" : "kumaş detayı";
  return `${productName} — ${COLORS[colorSlug].name} (${nasil})`;
}
