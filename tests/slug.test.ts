/*
 * Slug testleri.
 *
 * Türkçe harfler burada asıl mesele: JavaScript'in kendi küçültmesi "I"yı "i"
 * yapıyor ama Türkçe'de "I"nın küçüğü "ı"; "İ" ise iki kod noktalı bozuk bir
 * şeye dönüşüyor. Aşağıdaki testler bu iki durumu ve ürün adlarında geçen
 * ğ/ş/ç/ö/ü harflerini koruyor.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toSlug, uniqueSlug } from "../lib/slug";

describe("slug üretimi", () => {
  it("Türkçe harfleri karşılıklarına çevirir", () => {
    assert.equal(toSlug("Ağır Gramaj Basic Tee"), "agir-gramaj-basic-tee");
    assert.equal(toSlug("Çiçek Şişman Öz Üç"), "cicek-sisman-oz-uc");
  });

  it("büyük I ve İ harflerini doğru çevirir", () => {
    assert.equal(toSlug("İstanbul"), "istanbul");
    assert.equal(toSlug("ILIK"), "ilik");
    assert.equal(toSlug("Islak Isı"), "islak-isi");
  });

  it("boşluk ve noktalama yerine tek tire koyar", () => {
    assert.equal(toSlug("V Yaka  ///  Basic"), "v-yaka-basic");
    assert.equal(toSlug("%100 Pamuk!"), "100-pamuk");
  });

  it("baştaki ve sondaki tireleri atar", () => {
    assert.equal(toSlug("  -- Oversize --  "), "oversize");
  });

  it("aksanlı latin harflerini taban harfe indirir", () => {
    assert.equal(toSlug("Café Niño"), "cafe-nino");
  });

  it("hiç kullanılabilir harf yoksa boş döner", () => {
    assert.equal(toSlug("!!! ???"), "");
  });
});

describe("benzersiz slug", () => {
  it("boştaysa olduğu gibi kullanır", () => {
    assert.equal(uniqueSlug("Yeni Model", []), "yeni-model");
  });

  it("çakışırsa sona sayı ekler", () => {
    assert.equal(uniqueSlug("Yeni Model", ["yeni-model"]), "yeni-model-2");
    assert.equal(
      uniqueSlug("Yeni Model", ["yeni-model", "yeni-model-2", "yeni-model-3"]),
      "yeni-model-4",
    );
  });

  it("ad hiç harf içermiyorsa yine de kullanılabilir bir slug verir", () => {
    assert.equal(uniqueSlug("???", []), "urun");
    assert.equal(uniqueSlug("???", ["urun"]), "urun-2");
  });
});
