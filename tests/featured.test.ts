/*
 * Öne çıkan model seçimi testleri.
 *
 * Zaman dışarıdan veriliyor; böylece "bir saat sonra ne olur" sorusu gerçekten
 * bir saat beklemeden sınanabiliyor.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { orderWithFeatured } from "../lib/featured";

const SAAT = 60 * 60 * 1000;
const MODELLER = ["A", "B", "C", "D", "E"];

describe("öne çıkan model", () => {
  it("saat 0'da ilk model öne çıkar", () => {
    assert.deepEqual(orderWithFeatured(MODELLER, 0), ["A", "B", "C", "D", "E"]);
  });

  it("her saat sıradaki model öne geçer", () => {
    assert.equal(orderWithFeatured(MODELLER, 1 * SAAT)[0], "B");
    assert.equal(orderWithFeatured(MODELLER, 2 * SAAT)[0], "C");
    assert.equal(orderWithFeatured(MODELLER, 3 * SAAT)[0], "D");
    assert.equal(orderWithFeatured(MODELLER, 4 * SAAT)[0], "E");
  });

  it("liste bitince başa döner", () => {
    assert.equal(orderWithFeatured(MODELLER, 5 * SAAT)[0], "A");
    assert.equal(orderWithFeatured(MODELLER, 6 * SAAT)[0], "B");
  });

  it("aynı saat içinde sonuç değişmez", () => {
    const basi = orderWithFeatured(MODELLER, 2 * SAAT);
    const ortasi = orderWithFeatured(MODELLER, 2 * SAAT + 30 * 60 * 1000);
    const sonu = orderWithFeatured(MODELLER, 3 * SAAT - 1);
    assert.deepEqual(basi, ortasi);
    assert.deepEqual(basi, sonu);
  });

  it("kalan modeller kendi sırasını korur", () => {
    // C öne geçince geri kalanlar A, B, D, E sırasında kalmalı
    assert.deepEqual(orderWithFeatured(MODELLER, 2 * SAAT), ["C", "A", "B", "D", "E"]);
  });

  it("hiçbir model kaybolmaz veya tekrarlanmaz", () => {
    for (let saat = 0; saat < 12; saat++) {
      const sonuc = orderWithFeatured(MODELLER, saat * SAAT);
      assert.equal(sonuc.length, MODELLER.length);
      assert.deepEqual([...sonuc].sort(), [...MODELLER].sort());
    }
  });

  it("tek modelde ve boş listede bir şey bozulmaz", () => {
    assert.deepEqual(orderWithFeatured(["A"], 7 * SAAT), ["A"]);
    assert.deepEqual(orderWithFeatured([], 7 * SAAT), []);
  });
});
