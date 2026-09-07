import type { MetadataRoute } from "next";
import { getProductSlugs } from "@/lib/products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/*
 * Arama motorlarına sunulan site haritası.
 * Sepet, ödeme, sipariş sonucu ve yönetim sayfaları bilinçli olarak dışarıda —
 * bunların dizine eklenmesi istenmiyor.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getProductSlugs();

  const staticPages = [
    { path: "", priority: 1 },
    { path: "hakkimizda", priority: 0.5 },
    { path: "iletisim", priority: 0.5 },
    { path: "kargo-ve-teslimat", priority: 0.4 },
    { path: "iptal-ve-iade", priority: 0.4 },
    { path: "mesafeli-satis", priority: 0.2 },
    { path: "on-bilgilendirme", priority: 0.2 },
    { path: "gizlilik", priority: 0.2 },
    { path: "cerez-politikasi", priority: 0.2 },
  ];

  const now = new Date();

  return [
    ...staticPages.map((page) => ({
      url: `${siteUrl}/${page.path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: page.priority,
    })),
    ...slugs.map((slug) => ({
      url: `${siteUrl}/urun/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
