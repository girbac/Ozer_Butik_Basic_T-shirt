/*
 * Sipariş takibi kuralları.
 *
 * Bu ekran şifresiz ve herkese açık; sipariş numaraları da sıralı üretiliyor.
 * Yani buradaki kurallar bir müşterinin siparişini başkasının görmesini
 * engelleyen tek şey. Her biri ayrı ayrı sınanıyor.
 */
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  ATTEMPT_WINDOW_MS,
  MAX_ATTEMPTS,
  attemptKey,
  clearAttempts,
  emailMatches,
  formatRetryAfter,
  isValidEmail,
  isValidOrderNo,
  normalizeEmail,
  normalizeOrderNo,
  registerAttempt,
  resetAttempts,
} from "../lib/order-lookup";

describe("sipariş numarası biçimi", () => {
  it("baştaki ve sondaki boşluğu atar, büyük harfe çevirir", () => {
    assert.equal(normalizeOrderNo("  ob-2026-1171 "), "OB-2026-1171");
  });

  it("boşlukla yazılmış numarayı da kabul eder", () => {
    assert.equal(normalizeOrderNo("ob 2026 1171"), "OB-2026-1171");
  });

  it("fazladan tireleri teke indirir", () => {
    assert.equal(normalizeOrderNo("OB--2026---1171"), "OB-2026-1171");
  });

  it("geçerli numarayı tanır", () => {
    assert.ok(isValidOrderNo("OB-2026-1171"));
  });

  it("biçimi bozuk girdiyi reddeder", () => {
    for (const kotu of ["", "OB", "OB-", "OB-2026-1171'; DROP TABLE", "A".repeat(40)]) {
      assert.equal(isValidOrderNo(normalizeOrderNo(kotu)), false, `"${kotu}" reddedilmeliydi`);
    }
  });

  it("boşluk tireye çevrildiği için 'abc def' biçimsel olarak geçerli sayılır", () => {
    /*
     * Bu bir açık değil, "ob 2026 1171" yazımını desteklemenin sonucu.
     * Biçim kontrolü yalnızca veritabanına gitmeye değer mi diye bakıyor;
     * siparişi açan şey numaranın biçimi değil, e-posta eşleşmesi.
     */
    assert.equal(normalizeOrderNo("abc def"), "ABC-DEF");
    assert.ok(isValidOrderNo("ABC-DEF"));
  });
});

describe("e-posta eşleştirme", () => {
  it("büyük/küçük harf farkını yok sayar", () => {
    assert.ok(emailMatches("Ahmet@Ornek.COM", "ahmet@ornek.com"));
  });

  it("baştaki ve sondaki boşluğu yok sayar", () => {
    assert.ok(emailMatches("  ahmet@ornek.com  ", "ahmet@ornek.com"));
  });

  it("farklı adresi eşleştirmez", () => {
    assert.equal(emailMatches("baskasi@ornek.com", "ahmet@ornek.com"), false);
  });

  it("boş girdiyi eşleştirmez", () => {
    assert.equal(emailMatches("", "ahmet@ornek.com"), false);
  });

  it("normalize edilmiş hâli küçük harftir", () => {
    assert.equal(normalizeEmail("  AHMET@ORNEK.com "), "ahmet@ornek.com");
  });

  it("kabaca e-posta olmayanı reddeder", () => {
    for (const kotu of ["", "ahmet", "ahmet@", "@ornek.com", "ahmet ornek.com"]) {
      assert.equal(isValidEmail(normalizeEmail(kotu)), false, `"${kotu}" reddedilmeliydi`);
    }
  });
});

describe("deneme sınırı", () => {
  beforeEach(() => resetAttempts());

  it("sınıra kadar izin verir", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      assert.equal(registerAttempt("1.2.3.4").allowed, true, `${i + 1}. deneme geçmeliydi`);
    }
  });

  it("sınırdan sonra engeller", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) registerAttempt("1.2.3.4");
    const sonuc = registerAttempt("1.2.3.4");
    assert.equal(sonuc.allowed, false);
    assert.ok(sonuc.allowed === false && sonuc.retryAfterMs > 0);
  });

  it("farklı IP'ler birbirini etkilemez", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) registerAttempt("1.2.3.4");
    assert.equal(registerAttempt("5.6.7.8").allowed, true);
  });

  it("aynı IP'deki farklı müşteriler birbirini kilitlemez", () => {
    /*
     * CGNAT senaryosu: iki müşteri aynı IP'nin arkasından çıkıyor. Biri
     * numarasını yanlış girip hakkını tüketse bile diğeri sorgulayabilmeli.
     */
    const ip = "88.77.66.55";
    const ahmet = attemptKey(ip, "ahmet@ornek.com");
    const ayse = attemptKey(ip, "ayse@ornek.com");

    for (let i = 0; i < MAX_ATTEMPTS; i++) registerAttempt(ahmet);
    assert.equal(registerAttempt(ahmet).allowed, false, "hakkını tüketen durmalı");
    assert.equal(registerAttempt(ayse).allowed, true, "diğer müşteri etkilenmemeli");
  });

  it("anahtar e-postayı normalize eder — büyük harfle yazıp sınırı aşamazsınız", () => {
    assert.equal(
      attemptKey("1.2.3.4", "  AHMET@Ornek.COM "),
      attemptKey("1.2.3.4", "ahmet@ornek.com"),
    );
  });

  it("pencere dolunca sayaç sıfırlanır", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_ATTEMPTS; i++) registerAttempt("1.2.3.4", t0);
    assert.equal(registerAttempt("1.2.3.4", t0).allowed, false);
    assert.equal(registerAttempt("1.2.3.4", t0 + ATTEMPT_WINDOW_MS + 1).allowed, true);
  });

  it("başarılı sorgudan sonra hak geri verilir", () => {
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) registerAttempt("1.2.3.4");
    clearAttempts("1.2.3.4");
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      assert.equal(registerAttempt("1.2.3.4").allowed, true);
    }
  });

  it("kalan süreyi okunur biçimde yazar", () => {
    assert.equal(formatRetryAfter(60_000), "1 dakika");
    assert.equal(formatRetryAfter(5 * 60_000), "5 dakika");
    // Bir dakikadan az kalsa bile "0 dakika" denmemeli.
    assert.equal(formatRetryAfter(1_000), "1 dakika");
  });
});
