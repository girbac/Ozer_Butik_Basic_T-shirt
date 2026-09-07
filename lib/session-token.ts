import { createHmac, timingSafeEqual } from "node:crypto";

/*
 * Yönetim oturumu jetonunun üretimi ve doğrulaması.
 *
 * lib/auth.ts'ten ayrı bir dosyada çünkü proxy.ts (eski adıyla middleware) de bu
 * fonksiyonları kullanıyor ve oraya "server-only" işaretli bir modül import
 * edilemiyor.
 *
 * Jeton biçimi: "sonKullanmaZamanı.imza". Sunucuda oturum tablosu tutmuyoruz;
 * imza SESSION_SECRET ile üretildiği için kullanıcı jetonu kendi üretemiyor ve
 * süresini uzatamıyor.
 */

export const ADMIN_COOKIE_NAME = "ozer_admin";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET tanımlı değil veya çok kısa. `openssl rand -base64 32` ile üretip .env dosyanıza ekleyin.",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Sabit süreli karşılaştırma — yanıt süresinden bilgi sızmasın. */
export function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function createSessionValue(now = Date.now()): { value: string; expiresAt: number } {
  const expiresAt = now + SESSION_DURATION_MS;
  return { value: `${expiresAt}.${sign(String(expiresAt))}`, expiresAt };
}

export function isSessionValueValid(value: string | undefined, now = Date.now()): boolean {
  if (!value) return false;

  const separatorIndex = value.indexOf(".");
  if (separatorIndex <= 0) return false;

  const expiresAtRaw = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  if (!signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return false;

  try {
    return safeEquals(sign(expiresAtRaw), signature);
  } catch {
    // SESSION_SECRET yoksa oturum doğrulanamaz — giriş yapılmamış sayılır.
    return false;
  }
}
