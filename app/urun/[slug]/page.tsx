import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOtherProducts, getProductBySlug, getProductSlugs } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { ProductDetailView } from "@/components/ProductDetailView";
import { ProductCard } from "@/components/ProductCard";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Ürün bulunamadı" };
  }

  const image = product.colors[0]?.images[0]?.url;

  return {
    title: product.name,
    description: product.tagline ?? product.description.slice(0, 155),
    alternates: { canonical: `/urun/${product.slug}` },
    openGraph: {
      title: `${product.name} · Özer Butik`,
      description: product.tagline ?? product.description.slice(0, 155),
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/urun/[slug]">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;

  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);

  if (!product) {
    notFound();
  }

  const others = await getOtherProducts(product.slug);

  // ?renk=lacivert ile gelen bağlantı doğrudan o rengi açar (paylaşılabilir URL).
  const requestedColor = Array.isArray(searchParams.renk)
    ? searchParams.renk[0]
    : searchParams.renk;

  // Google alışveriş sonuçları için yapılandırılmış veri
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.colors.flatMap((color) => color.images.map((image) => image.url)),
    brand: { "@type": "Brand", name: "Özer Butik" },
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: "TRY",
      availability: product.colors.some((color) => color.sizes.some((size) => size.stock > 0))
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Konum" className="container-page pt-4">
        <Link href="/" className="text-xs text-ink-muted hover:text-ink">
          ← Tüm modeller
        </Link>
      </nav>

      <ProductDetailView
        product={product}
        initialColorName={requestedColor}
        freeShippingThreshold={settings.freeShippingThreshold}
      />

      {others.length > 0 && (
        <section className="container-page mt-section md:mt-section-lg" aria-labelledby="others">
          <h2 id="others" className="text-lg font-medium tracking-tight md:text-xl">
            Diğer modeller
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
            {others.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Mobil sabit satın alma barının içeriği kapatmaması için boşluk */}
      <div className="h-20 md:hidden" aria-hidden="true" />
    </>
  );
}
