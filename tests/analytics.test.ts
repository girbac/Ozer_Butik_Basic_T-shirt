/*
 * Ziyaret ölçümünün kuralları.
 *
 * Kayıt ucu şifresiz olduğu için gelen her alan doğrulanıyor; buradaki testler
 * hem o doğrulamayı hem de gizlilik kararını (sipariş numarasının ölçüme
 * sızmaması) koruyor.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_DURATION_MS,
  MIN_DURATION_MS,
  formatDuration,
  normalizePath,
  parseOlcum,
  pathLabel,
} from "../lib/analytics";

const gecerli = {
  path: "/sepet",
  visitId: "11111111-2222-3333-4444-555555555555",
  durationMs: 4000,
  device: "mobil" as const,
};

describe("yol sadeleştirme", () => {
  it("sorgu ve çapa kısmını atar", () => {
    assert.equal(normalizePath("/urun/slim-fit?renk=siyah#detay"), "/urun/slim-fit");
  });

  it("sondaki eğik çizgiyi atar", () => {
    assert.equal(normalizePath("/sepet/"), "/sepet");
  });

  it("ana sayfayı olduğu gibi bırakır", () => {
    assert.equal(normalizePath("/"), "/");
  });

  it("SİPARİŞ NUMARASINI ÖLÇÜME SIZDIRMAZ", () => {
    // Gizlilik kararı: numara sabitlenmezse her sipariş ölçüm tablosuna yazılırdı.
    assert.equal(normalizePath("/siparis/OB-2026-1171"), "/siparis/[no]");
  });

  it("ürün adresini olduğu gibi tutar", () => {
    // Hangi modelin ilgi çektiği tam da öğrenmek istediğimiz şey.
    assert.equal(normalizePath("/urun/oversize-basic-tee"), "/urun/oversize-basic-tee");
  });

  it("uydurma veya tehlikeli girdiyi reddeder", () => {
    for (const kotu of ["", "sepet", "//evil.com", "/a<script>", "/" + "x".repeat(200)]) {
      assert.equal(normalizePath(kotu), null, `"${kotu.slice(0, 20)}" reddedilmeliydi`);
    }
  });
});

describe("ölçüm kaydı doğrulama", () => {
  it("geçerli kaydı kabul eder", () => {
    assert.deepEqual(parseOlcum(gecerli), gecerli);
  });

  it("çok kısa kalışı saymaz", () => {
    assert.equal(parseOlcum({ ...gecerli, durationMs: MIN_DURATION_MS - 1 }), null);
  });

  it("aşırı uzun süreyi üst sınıra kırpar", () => {
    // Sekmeyi açık unutan biri "en çok zaman geçirilen sayfa" tablosunu bozmasın.
    const sonuc = parseOlcum({ ...gecerli, durationMs: 99 * 60 * 60 * 1000 });
    assert.equal(sonuc?.durationMs, MAX_DURATION_MS);
  });

  it("negatif süreyi reddeder", () => {
    assert.equal(parseOlcum({ ...gecerli, durationMs: -5000 }), null);
  });

  it("bilinmeyen cihaz değerini reddeder", () => {
    assert.equal(parseOlcum({ ...gecerli, device: "buzdolabi" }), null);
  });

  it("biçimi bozuk ziyaret numarasını reddeder", () => {
    for (const kotu of ["", "kisa", "x".repeat(80), "abc'; DROP TABLE"]) {
      assert.equal(parseOlcum({ ...gecerli, visitId: kotu }), null);
    }
  });

  it("nesne olmayan girdiyi reddeder", () => {
    for (const kotu of [null, undefined, "metin", 42, []]) {
      assert.equal(parseOlcum(kotu), null);
    }
  });

  it("eksik alanı reddeder", () => {
    assert.equal(parseOlcum({ path: "/sepet" }), null);
  });
});

describe("sayfa adları", () => {
  it("bilinen sayfaları Türkçe adlandırır", () => {
    assert.equal(pathLabel("/"), "Ana sayfa");
    assert.equal(pathLabel("/odeme"), "Ödeme");
    assert.equal(pathLabel("/siparis/[no]"), "Sipariş sonucu");
  });

  it("ürün adresini okunur ada çevirir", () => {
    assert.equal(pathLabel("/urun/oversize-basic-tee"), "Ürün: Oversize Basic Tee");
  });

  it("tanımadığı adresi olduğu gibi gösterir", () => {
    assert.equal(pathLabel("/bilinmeyen-sayfa"), "/bilinmeyen-sayfa");
  });
});

describe("süre biçimlendirme", () => {
  it("bir dakikanın altını saniye yazar", () => {
    assert.equal(formatDuration(45_000), "45 sn");
  });

  it("tam dakikayı sade yazar", () => {
    assert.equal(formatDuration(120_000), "2 dk");
  });

  it("dakika ve saniyeyi birlikte yazar", () => {
    assert.equal(formatDuration(80_000), "1 dk 20 sn");
  });
});
