import { prisma } from "@/lib/prisma";
import { sortSizes } from "@/lib/sizes";

export type SizeOption = {
  variantId: string;
  size: string;
  stock: number;
};

export type ColorOption = {
  name: string;
  hex: string;
  images: { url: string; alt: string }[];
  sizes: SizeOption[];
};

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  fabric: string | null;
  careInfo: string | null;
  price: number;
  comparePrice: number | null;
  colors: ColorOption[];
};

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price: number;
  comparePrice: number | null;
  colors: ColorOption[];
};

const productInclude = {
  variants: true,
  images: { orderBy: { sortOrder: "asc" } },
} as const;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  fabric: string | null;
  careInfo: string | null;
  price: number;
  comparePrice: number | null;
  variants: {
    id: string;
    colorName: string;
    colorHex: string;
    size: string;
    stock: number;
  }[];
  images: { url: string; alt: string; colorName: string | null }[];
};

/**
 * Varyant satırlarını renk bazında gruplar. Ürün sayfasındaki renk seçimi ve
 * galeri bu yapıyı kullanır; renk sırası varyantların eklenme sırasını korur.
 */
function groupByColor(product: ProductRow): ColorOption[] {
  const byColor = new Map<string, ColorOption>();

  for (const variant of product.variants) {
    let color = byColor.get(variant.colorName);
    if (!color) {
      color = {
        name: variant.colorName,
        hex: variant.colorHex,
        images: [],
        sizes: [],
      };
      byColor.set(variant.colorName, color);
    }
    color.sizes.push({
      variantId: variant.id,
      size: variant.size,
      stock: variant.stock,
    });
  }

  // Renge özel görseller ilgili renge, colorName'i olmayan genel görseller hepsine.
  const sharedImages = product.images.filter((image) => image.colorName === null);

  for (const [colorName, color] of byColor) {
    const own = product.images.filter((image) => image.colorName === colorName);
    color.images = [...own, ...sharedImages].map(({ url, alt }) => ({ url, alt }));
    color.sizes = sortSizes(color.sizes);
  }

  return [...byColor.values()];
}

export async function getActiveProducts(): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: productInclude,
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    price: product.price,
    comparePrice: product.comparePrice,
    colors: groupByColor(product),
  }));
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findFirst({
    where: { slug, active: true },
    include: productInclude,
  });

  if (!product) return null;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    fabric: product.fabric,
    careInfo: product.careInfo,
    price: product.price,
    comparePrice: product.comparePrice,
    colors: groupByColor(product),
  };
}

/** Ana sayfadaki "diğer modeller" şeridi için, açık olan ürünün kendisi hariç. */
export async function getOtherProducts(excludeSlug: string): Promise<ProductCardData[]> {
  const products = await getActiveProducts();
  return products.filter((product) => product.slug !== excludeSlug);
}

export async function getProductSlugs(): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { slug: true },
  });
  return products.map((product) => product.slug);
}

/** Bir üründe herhangi bir bedende stok var mı? Kartta "tükendi" göstermek için. */
export function hasAnyStock(colors: ColorOption[]): boolean {
  return colors.some((color) => color.sizes.some((size) => size.stock > 0));
}
