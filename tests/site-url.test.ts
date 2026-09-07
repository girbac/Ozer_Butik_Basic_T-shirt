/*
 * Site adresi çözümleme testleri.
 *
 * Bu testler gerçek bir yayın hatasından doğdu: `process.env.X ?? "yedek"`
 * yazılmıştı ve Vercel'de BOŞ tanımlanmış bir değişken yedeği devre dışı
 * bıraktığı için `new URL("")` derlemeyi kırdı. `??` yalnızca undefined/null
 * için yedeğe düşer, boş metin için düşmez.
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { getIyzicoUri, getSiteUrl } from "../lib/site-url";

const ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "IYZIPAY_URI",
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("site adresi", () => {
  it("NEXT_PUBLIC_SITE_URL tanımlıysa onu kullanır", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://ozerbutik.com";
    assert.equal(getSiteUrl(), "https://ozerbutik.com");
  });

  it("BOŞ değişkeni tanımsız sayar — derlemeyi kıran hata buydu", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "";
    assert.equal(getSiteUrl(), "http://localhost:3000");
    // Kritik olan: sonuç new URL() ile ayrıştırılabilmeli
    assert.doesNotThrow(() => new URL(getSiteUrl()));
  });

  it("yalnızca boşluktan oluşan değişkeni de tanımsız sayar", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "   ";
    assert.equal(getSiteUrl(), "http://localhost:3000");
  });

  it("değişken boşken Vercel'in kendi adresine düşer", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "ozer-butik.vercel.app";
    assert.equal(getSiteUrl(), "https://ozer-butik.vercel.app");
  });

  it("VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL'den önce gelir", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "canli.vercel.app";
    process.env.VERCEL_URL = "onizleme-abc123.vercel.app";
    assert.equal(getSiteUrl(), "https://canli.vercel.app");
  });

  it("hiçbiri yoksa localhost'a düşer", () => {
    assert.equal(getSiteUrl(), "http://localhost:3000");
  });

  it("sondaki eğik çizgiyi temizler — çift çizgili URL üretmesin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://ozerbutik.com/";
    assert.equal(getSiteUrl(), "https://ozerbutik.com");
    assert.equal(`${getSiteUrl()}/api/iyzico/callback`, "https://ozerbutik.com/api/iyzico/callback");
  });

  it("protokol yazılmamışsa https ekler", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "ozerbutik.com";
    assert.equal(getSiteUrl(), "https://ozerbutik.com");
  });

  it("her durumda geçerli bir URL döndürür", () => {
    for (const value of ["", "   ", "ozerbutik.com", "https://ozerbutik.com/"]) {
      process.env.NEXT_PUBLIC_SITE_URL = value;
      assert.doesNotThrow(() => new URL(getSiteUrl()), `başarısız girdi: "${value}"`);
    }
  });
});

describe("iyzico adresi", () => {
  it("tanımlıysa onu kullanır", () => {
    process.env.IYZIPAY_URI = "https://api.iyzipay.com";
    assert.equal(getIyzicoUri(), "https://api.iyzipay.com");
  });

  it("boşsa sandbox'a düşer — yanlışlıkla canlıya geçilmesin", () => {
    process.env.IYZIPAY_URI = "";
    assert.equal(getIyzicoUri(), "https://sandbox-api.iyzipay.com");
  });

  it("tanımsızsa sandbox'a düşer", () => {
    assert.equal(getIyzicoUri(), "https://sandbox-api.iyzipay.com");
  });
});
