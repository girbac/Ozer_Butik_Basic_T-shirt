/*
 * Veritabanı adresi bulma testleri.
 *
 * Bu mantık bir kullanıcı şikâyetinden doğdu: Vercel'de Postgres bağlanırken
 * ön ek STORAGE seçilmiş, değişken STORAGE_URL olmuş, uygulama DATABASE_URL
 * aradığı için veritabanı bağlı olduğu hâlde "tanımlı değil" demişti. Aşağıdaki
 * "STORAGE_URL" testi tam olarak o durumu koruyor.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findDatabaseUrl, listPostgresEnvNames } from "../lib/database-url.mjs";

const ADRES = "postgresql://kullanici:sifre@sunucu.neon.tech/db?sslmode=require";

describe("veritabanı adresi bulma", () => {
  it("DATABASE_URL varsa onu kullanır", () => {
    const found = findDatabaseUrl({ DATABASE_URL: ADRES });
    assert.equal(found?.url, ADRES);
    assert.equal(found?.source, "DATABASE_URL");
  });

  it("STORAGE_URL — Vercel'de STORAGE ön eki seçildiğinde oluşan ad", () => {
    const found = findDatabaseUrl({ STORAGE_URL: ADRES });
    assert.equal(found?.url, ADRES);
    assert.equal(found?.source, "STORAGE_URL");
  });

  it("POSTGRES_URL de tanınır", () => {
    assert.equal(findDatabaseUrl({ POSTGRES_URL: ADRES })?.source, "POSTGRES_URL");
  });

  it("hiç bilinmeyen bir ad bile olsa _URL ile bitiyorsa ve postgres adresiyse bulur", () => {
    const found = findDatabaseUrl({ OZERBUTIK_VERITABANI_URL: ADRES });
    assert.equal(found?.url, ADRES);
    assert.equal(found?.source, "OZERBUTIK_VERITABANI_URL");
  });

  it("birden çok aday varsa DATABASE_URL önceliklidir", () => {
    const digeri = "postgresql://baska@sunucu/db";
    const found = findDatabaseUrl({ STORAGE_URL: digeri, DATABASE_URL: ADRES });
    assert.equal(found?.source, "DATABASE_URL");
  });

  it("migration için havuzsuz bağlantı öne alınır", () => {
    const havuzsuz = "postgresql://dogrudan@sunucu/db";
    const found = findDatabaseUrl(
      { DATABASE_URL: ADRES, DATABASE_URL_UNPOOLED: havuzsuz },
      { preferDirect: true },
    );
    assert.equal(found?.source, "DATABASE_URL_UNPOOLED");
    // Varsayılanda ise havuzlanmış olan tercih edilir
    assert.equal(
      findDatabaseUrl({ DATABASE_URL: ADRES, DATABASE_URL_UNPOOLED: havuzsuz })?.source,
      "DATABASE_URL",
    );
  });

  it("_URL ile bitse bile postgres adresi olmayan değeri seçmez", () => {
    assert.equal(
      findDatabaseUrl({ NEXT_PUBLIC_SITE_URL: "https://ozerbutik.com", API_URL: "" }),
      null,
    );
  });

  it("boş veya boşluklu değeri tanımlı saymaz", () => {
    assert.equal(findDatabaseUrl({ DATABASE_URL: "   " }), null);
    assert.equal(findDatabaseUrl({ DATABASE_URL: "" }), null);
  });

  it("baştaki ve sondaki boşluğu temizler — kopyala/yapıştır hatası sık", () => {
    assert.equal(findDatabaseUrl({ DATABASE_URL: `  ${ADRES}  ` })?.url, ADRES);
  });

  it("hiçbir aday yoksa null döner", () => {
    assert.equal(findDatabaseUrl({ ADMIN_PASSWORD: "gizli" }), null);
  });

  it("aynı ortamda her zaman aynı değişkeni seçer", () => {
    const env = { B_URL: ADRES, A_URL: "postgresql://a@s/db", C_URL: "postgresql://c@s/db" };
    assert.equal(findDatabaseUrl(env)?.source, "A_URL");
    assert.equal(findDatabaseUrl(env)?.source, "A_URL");
  });
});

describe("postgres değişken adlarını listeleme", () => {
  it("yalnızca adları döndürür, adresleri değil", () => {
    const names = listPostgresEnvNames({
      STORAGE_URL: ADRES,
      ADMIN_PASSWORD: "gizli",
      NEXT_PUBLIC_SITE_URL: "https://ozerbutik.com",
    });
    assert.deepEqual(names, ["STORAGE_URL"]);
  });

  it("hiç yoksa boş liste", () => {
    assert.deepEqual(listPostgresEnvNames({ ADMIN_PASSWORD: "gizli" }), []);
  });
});
