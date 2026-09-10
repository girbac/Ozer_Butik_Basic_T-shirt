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
import {
  COLORS,
  DEFAULT_STOCK,
  PRODUCTS,
  SIZES,
  VIEWS,
  buildSku,
  imageAlt,
  imageUrl,
} from "../lib/catalog-data";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

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
            VIEWS.map((view, viewIndex) => ({
              url: imageUrl(colorSlug, view),
              alt: imageAlt(item.name, colorSlug, view),
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
