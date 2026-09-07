import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

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
