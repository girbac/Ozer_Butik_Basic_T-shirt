/*
 * Yönetim oturumu jetonu testleri.
 *
 * Panel tek şifreyle korunuyor ve oturum sunucuda saklanmıyor; güvenlik tamamen
 * jetonun imzasına dayanıyor. Bu yüzden "kullanıcı jetonu kendi üretebilir mi,
 * süresini uzatabilir mi" sorularını açıkça test ediyoruz.
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";

import {
  SESSION_DURATION_MS,
  createSessionValue,
  isSessionValueValid,
  safeEquals,
} from "../lib/session-token";

const SECRET = "test-oturum-anahtari-en-az-16-karakter";
process.env.SESSION_SECRET = SECRET;

describe("oturum jetonu", () => {
  it("ürettiği jetonu geçerli sayar", () => {
    const { value } = createSessionValue();
    assert.equal(isSessionValueValid(value), true);
  });

  it("jeton yoksa geçersizdir", () => {
    assert.equal(isSessionValueValid(undefined), false);
    assert.equal(isSessionValueValid(""), false);
  });

  it("imzasız veya bozuk biçimli jetonu reddeder", () => {
    const future = Date.now() + SESSION_DURATION_MS;
    assert.equal(isSessionValueValid(String(future)), false);
    assert.equal(isSessionValueValid(`${future}.`), false);
    assert.equal(isSessionValueValid(".imza"), false);
    assert.equal(isSessionValueValid("saçmalık"), false);
  });

  it("süresi dolmuş jetonu reddeder", () => {
    // Bir gün önce üretilmiş, dolayısıyla 6 gün önce sona ermiş bir jeton
    const pastNow = Date.now() - SESSION_DURATION_MS - 1000;
    const { value } = createSessionValue(pastNow);
    assert.equal(isSessionValueValid(value), false);
  });

  it("kullanıcı son kullanma tarihini uzatamaz", () => {
    const { value } = createSessionValue();
    const [, signature] = value.split(".");

    // Saldırgan imzayı koruyup süreyi ileri atmaya çalışıyor
    const forged = `${Date.now() + 365 * 24 * 60 * 60 * 1000}.${signature}`;
    assert.equal(isSessionValueValid(forged), false);
  });

  it("başka bir anahtarla imzalanmış jetonu reddeder", () => {
    const expiresAt = String(Date.now() + SESSION_DURATION_MS);
    const signature = createHmac("sha256", "baska-anahtar").update(expiresAt).digest("hex");
    assert.equal(isSessionValueValid(`${expiresAt}.${signature}`), false);
  });

  it("SESSION_SECRET yoksa hiçbir jetonu kabul etmez", () => {
    const { value } = createSessionValue();
    const original = process.env.SESSION_SECRET;

    delete process.env.SESSION_SECRET;
    try {
      assert.equal(isSessionValueValid(value), false);
    } finally {
      process.env.SESSION_SECRET = original;
    }
  });
});

describe("sabit süreli karşılaştırma", () => {
  it("aynı metinleri eşit sayar", () => {
    assert.equal(safeEquals("gizli-sifre", "gizli-sifre"), true);
  });

  it("farklı metinleri eşit saymaz", () => {
    assert.equal(safeEquals("gizli-sifre", "gizli-sifrf"), false);
  });

  it("farklı uzunlukta metinlerde hata fırlatmadan false döner", () => {
    // timingSafeEqual farklı uzunlukta buffer'larda hata fırlatır; uzunluk
    // kontrolünü önce yapmazsak burası çöker.
    assert.equal(safeEquals("kısa", "çok daha uzun bir metin"), false);
    assert.equal(safeEquals("", "x"), false);
  });

  it("çok baytlı Türkçe karakterlerle çalışır", () => {
    assert.equal(safeEquals("şifreÇĞİ", "şifreÇĞİ"), true);
    assert.equal(safeEquals("şifreÇĞİ", "şifreÇĞı"), false);
  });
});
