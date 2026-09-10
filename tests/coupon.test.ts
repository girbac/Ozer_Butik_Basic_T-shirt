/*
 * Kupon doğrulama ve indirim hesabı testleri.
 *
 * İndirim, sitedeki para hesaplarının en riskli parçalarından biri: yanlış
 * yuvarlama veya atlanan bir sınır kontrolü doğrudan gelir kaybı demek.
 * Zaman dışarıdan veriliyor ki tarih kuralları beklemeden sınanabilsin.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateDiscount,
  checkCoupon,
  isValidCouponCode,
  normalizeCouponCode,
  type CouponRules,
} from "../lib/coupon-math";

/** Geçerli, sınırsız bir kupon; testler gerekli alanı ezerek kullanıyor. */
function kupon(over: Partial<CouponRules> = {}): CouponRules {
  return {
    code: "YAZ25",
    kind: "PERCENT",
    value: 25,
    minSubtotal: 0,
    maxUses: null,
    usedCount: 0,
    active: true,
    startsAt: null,
    expiresAt: null,
    ...over,
  };
}

describe("kupon kodu biçimi", () => {
  it("boşlukları atar ve büyük harfe çevirir", () => {
    assert.equal(normalizeCouponCode("  yaz25 "), "YAZ25");
    assert.equal(normalizeCouponCode("yaz 25"), "YAZ25");
  });

  it("yalnızca harf ve rakam kabul eder", () => {
    assert.equal(isValidCouponCode("YAZ25"), true);
    assert.equal(isValidCouponCode("AB"), false, "3 karakterden kısa");
    assert.equal(isValidCouponCode("YAZ-25"), false, "tire olmaz");
    assert.equal(isValidCouponCode("YAZ 25"), false, "boşluk olmaz");
    assert.equal(isValidCouponCode("A".repeat(25)), false, "24 karakterden uzun");
  });
});

describe("indirim hesabı", () => {
  it("yüzde indirimi doğru hesaplar", () => {
    assert.equal(calculateDiscount("PERCENT", 25, 100000), 25000);
    assert.equal(calculateDiscount("PERCENT", 10, 49900), 4990);
  });

  it("kuruş küsuratını aşağı yuvarlar", () => {
    // 49900'ün %33'ü = 16467 — tam sayı çıkmadığında aşağı inmeli
    assert.equal(calculateDiscount("PERCENT", 33, 49900), 16467);
    assert.equal(calculateDiscount("PERCENT", 3, 3333), 99);
  });

  it("yüzde en fazla 90 olabilir", () => {
    assert.equal(calculateDiscount("PERCENT", 200, 100000), 90000);
  });

  it("sabit tutar sepetten büyük olamaz", () => {
    assert.equal(calculateDiscount("AMOUNT", 60000, 50000), 50000);
    assert.equal(calculateDiscount("AMOUNT", 10000, 50000), 10000);
  });

  it("boş sepette indirim yok", () => {
    assert.equal(calculateDiscount("PERCENT", 25, 0), 0);
    assert.equal(calculateDiscount("AMOUNT", 5000, 0), 0);
  });
});

describe("kupon geçerliliği", () => {
  it("geçerli kupon indirimi döndürür", () => {
    assert.deepEqual(checkCoupon(kupon(), 100000), { ok: true, discount: 25000 });
  });

  it("pasif kupon reddedilir", () => {
    const sonuc = checkCoupon(kupon({ active: false }), 100000);
    assert.equal(sonuc.ok, false);
  });

  it("başlangıç tarihinden önce reddedilir", () => {
    const yarin = new Date("2026-06-02T00:00:00Z");
    const bugun = new Date("2026-06-01T00:00:00Z");
    assert.equal(checkCoupon(kupon({ startsAt: yarin }), 100000, bugun).ok, false);
    assert.equal(checkCoupon(kupon({ startsAt: bugun }), 100000, yarin).ok, true);
  });

  it("son kullanma tarihinden sonra reddedilir", () => {
    const dun = new Date("2026-05-31T00:00:00Z");
    const bugun = new Date("2026-06-01T00:00:00Z");
    assert.equal(checkCoupon(kupon({ expiresAt: dun }), 100000, bugun).ok, false);
    assert.equal(checkCoupon(kupon({ expiresAt: bugun }), 100000, dun).ok, true);
  });

  it("kullanım sınırı dolunca reddedilir", () => {
    assert.equal(checkCoupon(kupon({ maxUses: 10, usedCount: 10 }), 100000).ok, false);
    assert.equal(checkCoupon(kupon({ maxUses: 10, usedCount: 9 }), 100000).ok, true);
    assert.equal(checkCoupon(kupon({ maxUses: null, usedCount: 999 }), 100000).ok, true);
  });

  it("alt limitin altındaki sepette reddedilir ve limiti söyler", () => {
    const sonuc = checkCoupon(kupon({ minSubtotal: 50000 }), 49900);
    assert.equal(sonuc.ok, false);
    assert.match(sonuc.ok === false ? sonuc.reason : "", /500,00 TL/);
    assert.equal(checkCoupon(kupon({ minSubtotal: 50000 }), 50000).ok, true);
  });

  it("boş sepette reddedilir", () => {
    assert.equal(checkCoupon(kupon(), 0).ok, false);
  });

  it("sepeti sıfırlayan kupon reddedilir", () => {
    // Ödeme sağlayıcısı sıfır tutarlı işlemi kabul etmez
    assert.equal(checkCoupon(kupon({ kind: "AMOUNT", value: 50000 }), 50000).ok, false);
    assert.equal(checkCoupon(kupon({ kind: "AMOUNT", value: 49999 }), 50000).ok, true);
  });

  it("indirim üretmeyen kupon reddedilir", () => {
    // 100 kuruşluk sepette %0.5 → 0 kuruş
    assert.equal(checkCoupon(kupon({ kind: "PERCENT", value: 0 }), 100000).ok, false);
  });

  it("indirim asla sepetten büyük olmaz", () => {
    for (const tutar of [100, 4999, 50000, 123456]) {
      for (const k of [kupon({ kind: "PERCENT", value: 90 }), kupon({ kind: "AMOUNT", value: 40000 })]) {
        const sonuc = checkCoupon(k, tutar);
        if (sonuc.ok) assert.ok(sonuc.discount < tutar, `${tutar} için indirim sepetten küçük olmalı`);
      }
    }
  });
});
