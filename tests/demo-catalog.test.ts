/*
 * Demo katalog testleri.
 *
 * Veritabanı bağlı değilken site boş görünmemeli: beş model, renkleri ve
 * bedenleriyle görünmeli. Bu testler ayrıca demo verisinin veritabanı
 * başlangıç verisiyle AYNI kaynaktan geldiğini doğruluyor — ikisi ayrışırsa
 * veritabanı bağlandığında ürünler değişmiş gibi görünürdü.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PRODUCTS, SIZES } from "../lib/catalog-data";
import {
  getDemoProductBySlug,
  getDemoProducts,
  getDemoSlugs,
  isDemoVariantId,
} from "../lib/demo-catalog";

describe("demo katalog", () => {
  it("beş modelin tamamını döndürür", () => {
    const products = getDemoProducts();
    assert.equal(products.length, 5);
    assert.equal(products.length, PRODUCTS.length, "seed ile aynı sayıda olmalı");
  });

  it("ürünler sortOrder sırasında gelir", () => {
    const slugs = getDemoProducts().map((p) => p.slug);
    const expected = [...PRODUCTS].sort((a, b) => a.sortOrder - b.sortOrder).map((p) => p.slug);
    assert.deepEqual(slugs, expected);
  });

  it("her ürünün rengi, görseli ve tüm bedenleri vardır", () => {
    for (const product of getDemoProducts()) {
      assert.ok(product.colors.length > 0, `${product.slug}: renk yok`);
      for (const color of product.colors) {
        assert.ok(color.images.length > 0, `${product.slug}/${color.name}: görsel yok`);
        assert.equal(color.sizes.length, SIZES.length, `${product.slug}/${color.name}: beden eksik`);
        assert.match(color.hex, /^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("fiyatlar kuruş cinsinden pozitif tam sayıdır", () => {
    for (const product of getDemoProducts()) {
      assert.ok(Number.isInteger(product.price) && product.price > 0, product.slug);
    }
  });

  it("slug ile tek ürün getirir", () => {
    const product = getDemoProductBySlug("oversize-basic-tee");
    assert.ok(product);
    assert.equal(product.name, "Oversize Basic Tee");
    assert.ok(product.description.length > 20);
  });

  it("olmayan slug için null döner (404 gösterilebilsin)", () => {
    assert.equal(getDemoProductBySlug("olmayan-urun"), null);
  });

  it("slug listesi ürün listesiyle örtüşür", () => {
    assert.deepEqual([...getDemoSlugs()].sort(), PRODUCTS.map((p) => p.slug).sort());
  });

  it("demo varyant kimlikleri gerçek kimliklerden ayırt edilebilir", () => {
    const [product] = getDemoProducts();
    const variantId = product.colors[0].sizes[0].variantId;
    assert.ok(isDemoVariantId(variantId));
    // Gerçek kimlikler cuid; demo öneki taşımamalı
    assert.equal(isDemoVariantId("cmtrbu0gt002l6x7dqid4094c"), false);
  });

  it("seed'deki stok istisnaları demo katalogda da geçerlidir", () => {
    // Regular Fit'te XXL bilinçli olarak tükenmiş durumda — tasarımdaki
    // "üstü çizili beden" hâli demo görünümde de test edilebilsin diye.
    const product = getDemoProductBySlug("regular-fit-basic-tee");
    assert.ok(product);
    const xxl = product.colors[0].sizes.find((s) => s.size === "XXL");
    assert.equal(xxl?.stock, 0);
  });
});
