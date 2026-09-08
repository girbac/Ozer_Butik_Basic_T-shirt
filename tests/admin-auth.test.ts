/*
 * Yönetici girişi testleri.
 *
 * Bu testler gerçek bir sorundan doğdu: Vercel'e girilen doğru şifre kabul
 * edilmiyordu. İki sebep vardı — değerin sonundaki görünmez boşluk ve çok kısa
 * bir SESSION_SECRET. İkisi de aynı genel hata mesajını verdiği için mağaza
 * sahibi neyin yanlış olduğunu göremiyordu.
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { getAdminConfigProblem, isPasswordCorrect } from "../lib/auth";
import { isSessionSecretUsable, MIN_SECRET_LENGTH } from "../lib/session-token";

const GECERLI_ANAHTAR = "a".repeat(MIN_SECRET_LENGTH);
let saved: { pass?: string; secret?: string } = {};

beforeEach(() => {
  saved = { pass: process.env.ADMIN_PASSWORD, secret: process.env.SESSION_SECRET };
  process.env.ADMIN_PASSWORD = "gizli-sifre";
  process.env.SESSION_SECRET = GECERLI_ANAHTAR;
});

afterEach(() => {
  for (const [key, value] of [
    ["ADMIN_PASSWORD", saved.pass],
    ["SESSION_SECRET", saved.secret],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("yönetici şifresi", () => {
  it("doğru şifreyi kabul eder", () => {
    assert.equal(isPasswordCorrect("gizli-sifre"), true);
  });

  it("yanlış şifreyi reddeder", () => {
    assert.equal(isPasswordCorrect("baska-sifre"), false);
  });

  it("ortam değişkenindeki görünmez boşluğu yok sayar", () => {
    // Vercel'e yapıştırırken sona takılan boşluk/satır sonu doğru şifreyi
    // sessizce reddettiriyordu — asıl yaşanan hata buydu.
    process.env.ADMIN_PASSWORD = "  gizli-sifre\n";
    assert.equal(isPasswordCorrect("gizli-sifre"), true);
  });

  it("kullanıcının yazdığı şifredeki baştaki/sondaki boşluğu yok sayar", () => {
    assert.equal(isPasswordCorrect(" gizli-sifre "), true);
  });

  it("ADMIN_PASSWORD tanımsızsa hiçbir şifreyi kabul etmez", () => {
    delete process.env.ADMIN_PASSWORD;
    assert.equal(isPasswordCorrect("gizli-sifre"), false);
    assert.equal(isPasswordCorrect(""), false);
  });

  it("ADMIN_PASSWORD sadece boşluksa hiçbir şifreyi kabul etmez", () => {
    process.env.ADMIN_PASSWORD = "   ";
    assert.equal(isPasswordCorrect("   "), false);
    assert.equal(isPasswordCorrect(""), false);
  });

  it("boş şifre, tanımlı şifreyle eşleşmez", () => {
    assert.equal(isPasswordCorrect(""), false);
  });
});

describe("ayar teşhisi", () => {
  it("her şey tamamsa sorun bildirmez", () => {
    assert.equal(getAdminConfigProblem(), null);
  });

  it("ADMIN_PASSWORD eksikse bunu söyler", () => {
    delete process.env.ADMIN_PASSWORD;
    assert.match(getAdminConfigProblem() ?? "", /ADMIN_PASSWORD/);
  });

  it("SESSION_SECRET eksikse bunu söyler", () => {
    delete process.env.SESSION_SECRET;
    assert.match(getAdminConfigProblem() ?? "", /SESSION_SECRET/);
  });

  it("SESSION_SECRET çok kısaysa bunu söyler", () => {
    // Şifre doğru olsa bile giriş çökerdi; artık sebebi görünüyor.
    process.env.SESSION_SECRET = "kisa";
    assert.match(getAdminConfigProblem() ?? "", /SESSION_SECRET/);
    assert.equal(isSessionSecretUsable(), false);
  });

  it("tam sınırdaki anahtarı kabul eder", () => {
    process.env.SESSION_SECRET = "b".repeat(MIN_SECRET_LENGTH);
    assert.equal(isSessionSecretUsable(), true);
    assert.equal(getAdminConfigProblem(), null);
  });

  it("anahtarın sonundaki boşluk uzunluğu şişirmez", () => {
    process.env.SESSION_SECRET = "kisa" + " ".repeat(40);
    assert.equal(isSessionSecretUsable(), false);
  });
});
