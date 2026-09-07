import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { sortSizes } from "@/lib/sizes";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata: Metadata = {
  title: "Ürünler",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { variants: true },
  });

  return (
    <div className="container-page py-8">
      <h1 className="text-xl font-medium tracking-tight md:text-2xl">Ürünler</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Fiyat, açıklama ve stok bilgilerini buradan güncelleyebilirsiniz.
        Değişiklikler mağazada anında görünür.
      </p>

      <div className="mt-6 space-y-4">
        {products.map((product) => {
          // Renk bazında grupla — stok tablosu bu şekilde okunaklı oluyor.
          const byColor = new Map<
            string,
            { hex: string; sizes: { id: string; size: string; stock: number }[] }
          >();

          for (const variant of product.variants) {
            let entry = byColor.get(variant.colorName);
            if (!entry) {
              entry = { hex: variant.colorHex, sizes: [] };
              byColor.set(variant.colorName, entry);
            }
            entry.sizes.push({ id: variant.id, size: variant.size, stock: variant.stock });
          }

          const colors = [...byColor.entries()].map(([name, value]) => ({
            name,
            hex: value.hex,
            sizes: sortSizes(value.sizes),
          }));

          return (
            <ProductEditor
              key={product.id}
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                tagline: product.tagline ?? "",
                description: product.description,
                fabric: product.fabric ?? "",
                careInfo: product.careInfo ?? "",
                price: product.price,
                comparePrice: product.comparePrice,
                active: product.active,
              }}
              colors={colors}
            />
          );
        })}
      </div>
    </div>
  );
}
