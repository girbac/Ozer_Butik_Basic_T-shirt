import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import Iyzipay, {
  type CheckoutFormInitializeRequest,
  type CheckoutFormInitializeResult,
  type CheckoutFormRetrieveResult,
} from "iyzipay";

/*
 * iyzico Checkout Form sarmalayıcısı.
 *
 * Akış: initializeCheckoutForm → kullanıcı iyzico'nun ödeme sayfasına yönlenir →
 * ödeme sonrası iyzico callbackUrl'e POST eder → retrieveCheckoutForm ile sonuç
 * doğrulanır. Ödemenin gerçekten başarılı olduğuna KARAR VEREN yer bu son adımdır;
 * tarayıcıdan dönen bilgiye güvenilmez.
 */

export const IYZICO_PAYMENT_STATUS_SUCCESS = "SUCCESS";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} tanımlı değil. iyzico entegrasyonu için .env dosyanızı doldurun.`,
    );
  }
  return value;
}

export function getIyzipayClient(): Iyzipay {
  return new Iyzipay({
    apiKey: requireEnv("IYZIPAY_API_KEY"),
    secretKey: requireEnv("IYZIPAY_SECRET_KEY"),
    uri: process.env.IYZIPAY_URI ?? "https://sandbox-api.iyzipay.com",
  });
}

export function initializeCheckoutForm(
  request: CheckoutFormInitializeRequest,
): Promise<CheckoutFormInitializeResult> {
  const client = getIyzipayClient();
  return new Promise((resolve, reject) => {
    client.checkoutFormInitialize.create(request, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

export function retrieveCheckoutForm(
  token: string,
  conversationId?: string,
): Promise<CheckoutFormRetrieveResult> {
  const client = getIyzipayClient();
  return new Promise((resolve, reject) => {
    client.checkoutForm.retrieve(
      { locale: Iyzipay.LOCALE.TR, conversationId, token },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
  });
}

function calculateSignature(params: (string | undefined)[]): string {
  return createHmac("sha256", requireEnv("IYZIPAY_SECRET_KEY"))
    .update(params.map((value) => value ?? "").join(":"))
    .digest("hex");
}

function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * iyzico'nun döndürdüğü sonucun gerçekten iyzico'dan geldiğini doğrular.
 *
 * İmza, gizli anahtarımızla hesaplanan HMAC-SHA256 ile karşılaştırılır. Bu kontrol
 * olmadan, callback adresimizi bilen biri sahte "ödeme başarılı" isteği gönderip
 * bedava sipariş oluşturabilirdi.
 */
export function verifyRetrieveSignature(result: CheckoutFormRetrieveResult): boolean {
  if (!result.signature) return false;

  // Parametre sırası iyzico tarafından belirlenir, değiştirilemez.
  const expected = calculateSignature([
    result.paymentStatus,
    result.paymentId,
    result.currency,
    result.basketId,
    result.conversationId,
    result.paidPrice,
    result.price,
    result.token,
  ]);

  return safeEquals(expected, result.signature);
}

export { Iyzipay };
