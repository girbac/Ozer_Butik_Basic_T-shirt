import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Kişisel veri içeren veya dizine girmesi anlamsız sayfalar
      disallow: ["/admin", "/sepet", "/odeme", "/siparis/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
