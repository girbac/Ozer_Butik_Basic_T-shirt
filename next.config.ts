import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * iyzipay, kaynak dosyalarını çalışma anında fs.readdirSync + require ile yüklüyor.
   * Paketleyici bu dinamik yolu çözemediği için paketi olduğu gibi node_modules'tan
   * yüklenmeye bırakıyoruz.
   */
  serverExternalPackages: ["iyzipay"],

  images: {
    remotePatterns: [
      {
        // Vercel Blob: admin panelinden yüklenen ürün fotoğrafları buradan gelir.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
