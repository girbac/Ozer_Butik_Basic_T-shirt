/*
 * Başlangıç verisi: 5 basic t-shirt modeli.
 *
 * DİKKAT: Buradaki isimler, fiyatlar ve renkler GEÇİCİ yer tutuculardır.
 * Gerçek bilgiler netleştiğinde admin panelinden düzenlenecek — bu dosyayı
 * tekrar çalıştırmak gerekmez.
 *
 * Çalıştırma:
 *   npm run db:seed              → ürünleri yeniden yükler (siparişi olanlara dokunmaz)
 *   npm run db:seed -- --if-empty → yalnızca katalog TAMAMEN BOŞSA yükler
 *
 * --if-empty, yayın sırasında kullanılıyor: dolu bir katalog varsa hiçbir şeye
 * dokunmuyor, böylece mağaza sahibinin düzenlemeleri ezilmiyor.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

/** Renk paleti — public/urunler/<slug>-<görünüm>.webp dosyalarıyla eşleşir. */
const COLORS = {
  siyah: { name: "Siyah", hex: "#1a1815" },
  beyaz: { name: "Beyaz", hex: "#fdfcfa" },
  gri: { name: "Gri", hex: "#9b968e" },
  lacivert: { name: "Lacivert", hex: "#232d45" },
  bej: { name: "Bej", hex: "#d8cbb4" },
  haki: { name: "Haki", hex: "#4d5340" },
  antrasit: { name: "Antrasit", hex: "#3a3835" },
} as const;

type ColorSlug = keyof typeof COLORS;

type SeedProduct = {
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

const PRODUCTS: SeedProduct[] = [
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

const DEFAULT_STOCK = 12;

/** SKU: OB-REG-SIYAH-M gibi okunabilir ve benzersiz. */
function buildSku(productSlug: string, colorSlug: string, size: string) {
  const productCode = productSlug.split("-")[0].slice(0, 6).toUpperCase();
  return `OB-${productCode}-${colorSlug.toUpperCase()}-${size}`;
}

async function main() {
  // Yayın sırasında yalnızca boş katalogda çalışsın diye
  const onlyIfEmpty = process.argv.includes("--if-empty");

  if (onlyIfEmpty) {
    const existingCount = await prisma.product.count();
    if (existingCount > 0) {
      console.log(`Katalogda ${existingCount} ürün var, başlangıç verisi atlandı.`);
      return;
    }
  }

  console.log("Başlangıç verisi yükleniyor…");

  for (const item of PRODUCTS) {
    // Seed tekrar çalıştırılabilir olsun diye önce mevcut kaydı temizliyoruz.
    // Sipariş satırları varyantlara bağlı olduğu için siparişi olan ürünler silinmez.
    const existing = await prisma.product.findUnique({
      where: { slug: item.slug },
      include: { variants: { include: { orderItems: { take: 1 } } } },
    });

    const hasOrders = existing?.variants.some((v) => v.orderItems.length > 0);
    if (hasOrders) {
      console.log(`  ⤷ ${item.name}: siparişi olduğu için atlandı`);
      continue;
    }

    if (existing) {
      await prisma.product.delete({ where: { id: existing.id } });
    }

    await prisma.product.create({
      data: {
        slug: item.slug,
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        fabric: item.fabric,
        careInfo: item.careInfo,
        price: item.price,
        comparePrice: item.comparePrice ?? null,
        sortOrder: item.sortOrder,
        active: true,
        variants: {
          create: item.colors.flatMap((colorSlug) =>
            SIZES.map((size) => ({
              colorName: COLORS[colorSlug].name,
              colorHex: COLORS[colorSlug].hex,
              size,
              stock: item.stockOverrides?.[size] ?? DEFAULT_STOCK,
              sku: buildSku(item.slug, colorSlug, size),
            })),
          ),
        },
        images: {
          create: item.colors.flatMap((colorSlug, colorIndex) =>
            (["on", "arka", "detay"] as const).map((view, viewIndex) => ({
              url: `/urunler/${colorSlug}-${view}.webp`,
              alt: `${item.name} — ${COLORS[colorSlug].name} (${
                view === "on" ? "önden" : view === "arka" ? "arkadan" : "kumaş detayı"
              })`,
              colorName: COLORS[colorSlug].name,
              sortOrder: colorIndex * 10 + viewIndex,
            })),
          ),
        },
      },
    });

    console.log(`  ✓ ${item.name} (${item.colors.length} renk × ${SIZES.length} beden)`);
  }

  // Admin panelinden düzenlenebilen genel ayarlar
  const settings: Record<string, string> = {
    shippingFee: "4900", // 49,00 TL
    freeShippingThreshold: "50000", // 500,00 TL
    announcement: "500 TL üzeri kargo bedava · 14 gün içinde ücretsiz iade",
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  console.log("Ayarlar yüklendi. Hazır.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
