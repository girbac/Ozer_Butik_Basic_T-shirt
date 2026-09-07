import {
  COLORS,
  DEFAULT_STOCK,
  PRODUCTS,
  SIZES,
  VIEWS,
  imageAlt,
  imageUrl,
  type CatalogProduct,
} from "@/lib/catalog-data";
import type { ColorOption, ProductCardData, ProductDetail } from "@/lib/products";

/*
 * Veritabanı bağlı DEĞİLKEN gösterilen tanıtım kataloğu.
 *
 * Neden var: yeni kurulan bir projede (Vercel'e ilk yayın) veritabanı henüz
 * bağlanmamış olur. Bu durumda boş bir sayfa göstermek yerine, tasarımın
 * tamamını gerçek ürünlerle görebilmek gerekiyor. Ürün verisi zaten
 * lib/catalog-data.ts içindeki yer tutucularla aynı — veritabanı bağlandığında
 * birebir aynı beş model geliyor.
 *
 * SINIR: yalnızca DATABASE_URL hiç tanımlı değilken devreye girer. Veritabanı
 * tanımlı ama erişilemiyorsa hata normal şekilde yükselir; bir arıza sessizce
 * tanıtım verisiyle maskelenmez. Ayrıca demo modunda site üstünde uyarı şeridi
 * çıkar ve sipariş alınamaz (bkz. DemoBanner ve /api/checkout).
 */

/** Demo modunda varyant kimliği: gerçek bir kayda karşılık gelmez. */
function demoVariantId(slug: string, colorName: string, size: string): string {
  return `demo:${slug}:${colorName}:${size}`;
}

export function isDemoVariantId(variantId: string): boolean {
  return variantId.startsWith("demo:");
}

function buildColors(item: CatalogProduct): ColorOption[] {
  return item.colors.map((colorSlug) => ({
    name: COLORS[colorSlug].name,
    hex: COLORS[colorSlug].hex,
    images: VIEWS.map((view) => ({
      url: imageUrl(colorSlug, view),
      alt: imageAlt(item.name, colorSlug, view),
    })),
    sizes: SIZES.map((size) => ({
      variantId: demoVariantId(item.slug, COLORS[colorSlug].name, size),
      size,
      stock: item.stockOverrides?.[size] ?? DEFAULT_STOCK,
    })),
  }));
}

export function getDemoProducts(): ProductCardData[] {
  return [...PRODUCTS]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: `demo-${item.slug}`,
      slug: item.slug,
      name: item.name,
      tagline: item.tagline,
      price: item.price,
      comparePrice: item.comparePrice ?? null,
      colors: buildColors(item),
    }));
}

export function getDemoProductBySlug(slug: string): ProductDetail | null {
  const item = PRODUCTS.find((product) => product.slug === slug);
  if (!item) return null;

  return {
    id: `demo-${item.slug}`,
    slug: item.slug,
    name: item.name,
    tagline: item.tagline,
    description: item.description,
    fabric: item.fabric,
    careInfo: item.careInfo,
    price: item.price,
    comparePrice: item.comparePrice ?? null,
    colors: buildColors(item),
  };
}

export function getDemoSlugs(): string[] {
  return PRODUCTS.map((item) => item.slug);
}
