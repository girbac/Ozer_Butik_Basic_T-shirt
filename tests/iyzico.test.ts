/*
 * iyzico imza doğrulama testleri.
 *
 * Bu kontrol güvenliğin can damarı: callback adresimiz herkese açık olduğu için,
 * imza doğrulanmazsa herhangi biri "ödeme başarılı" isteği gönderip bedava
 * sipariş oluşturabilir. Ödeme sağlayıcısına ağ erişimi olmadan da bu fonksiyonu
 * deterministik olarak test edebiliyoruz.
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";

import { verifyRetrieveSignature } from "../lib/iyzico";
import { toInternationalPhone } from "../lib/validation";
import { formatPrice, kurusToIyzicoPrice } from "../lib/format";

// Gizli anahtar imza hesaplanırken (modül yüklenirken değil) okunuyor,
// bu yüzden testte burada tanımlamak yeterli.
const SECRET = "test-secret-key";
process.env.IYZIPAY_SECRET_KEY = SECRET;
process.env.IYZIPAY_API_KEY = "test-api-key";

/** iyzico'nun imzayı nasıl ürettiğinin birebir kopyası — sıra önemli. */
function signLikeIyzico(fields: Record<string, string>): string {
  const ordered = [
    fields.paymentStatus,
    fields.paymentId,
    fields.currency,
    fields.basketId,
    fields.conversationId,
    fields.paidPrice,
    fields.price,
    fields.token,
  ];
  return createHmac("sha256", SECRET).update(ordered.join(":")).digest("hex");
}

const validResult = {
  status: "success" as const,
  paymentStatus: "SUCCESS",
  paymentId: "12345678",
  currency: "TRY",
  basketId: "OB-2026-1001",
  conversationId: "conv-abc",
  paidPrice: "548.00",
  price: "499.00",
  token: "tok_abc123",
};

describe("iyzico imza doğrulama", () => {
  it("iyzico'nun ürettiği geçerli imzayı kabul eder", () => {
    const signature = signLikeIyzico(validResult);
    assert.equal(verifyRetrieveSignature({ ...validResult, signature }), true);
  });

  it("imza yoksa reddeder", () => {
    assert.equal(verifyRetrieveSignature(validResult), false);
  });

  it("uydurma imzayı reddeder", () => {
    assert.equal(
      verifyRetrieveSignature({ ...validResult, signature: "a".repeat(64) }),
      false,
    );
  });

  it("tutar değiştirilirse imza tutmaz", () => {
    const signature = signLikeIyzico(validResult);
    // Saldırgan ödenen tutarı düşürmeye çalışırsa imza artık eşleşmez.
    assert.equal(
      verifyRetrieveSignature({ ...validResult, paidPrice: "1.00", signature }),
      false,
    );
  });

  it("ödeme durumu değiştirilirse imza tutmaz", () => {
    const signature = signLikeIyzico({ ...validResult, paymentStatus: "FAILURE" });
    assert.equal(
      verifyRetrieveSignature({ ...validResult, paymentStatus: "SUCCESS", signature }),
      false,
    );
  });

  it("başka bir gizli anahtarla üretilen imzayı reddeder", () => {
    const ordered = [
      validResult.paymentStatus,
      validResult.paymentId,
      validResult.currency,
      validResult.basketId,
      validResult.conversationId,
      validResult.paidPrice,
      validResult.price,
      validResult.token,
    ];
    const signature = createHmac("sha256", "baska-anahtar").update(ordered.join(":")).digest("hex");
    assert.equal(verifyRetrieveSignature({ ...validResult, signature }), false);
  });
});

describe("biçimlendirme yardımcıları", () => {
  it("kuruşu iyzico'nun beklediği ondalıklı metne çevirir", () => {
    assert.equal(kurusToIyzicoPrice(49900), "499.00");
    assert.equal(kurusToIyzicoPrice(0), "0.00");
    assert.equal(kurusToIyzicoPrice(5), "0.05");
    assert.equal(kurusToIyzicoPrice(1398000), "13980.00");
  });

  it("kuruşu Türk Lirası biçiminde gösterir", () => {
    assert.match(formatPrice(49900), /499,00/);
  });

  it("telefon numarasını +90 biçimine çevirir", () => {
    assert.equal(toInternationalPhone("05551112233"), "+905551112233");
    assert.equal(toInternationalPhone("5551112233"), "+905551112233");
    assert.equal(toInternationalPhone("+90 555 111 22 33"), "+905551112233");
    assert.equal(toInternationalPhone("0555 111 22 33"), "+905551112233");
  });
});
