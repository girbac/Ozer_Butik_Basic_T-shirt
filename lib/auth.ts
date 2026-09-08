import "server-only";

import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  MIN_SECRET_LENGTH,
  SESSION_DURATION_MS,
  createSessionValue,
  isSessionSecretUsable,
  isSessionValueValid,
  safeEquals,
} from "@/lib/session-token";

/*
 * Yönetim paneli girişi.
 *
 * Bilerek basit tutuldu: tek şifre, kullanıcı tablosu yok. Beş ürünlük bir butikte
 * tek yönetici var; rol/izin sistemi kurmak gereksiz karmaşıklık olurdu.
 */

/**
 * Şifreyi doğrular. Karşılaştırma sabit sürelidir — aksi hâlde yanıt süresinden
 * şifrenin ilk karakterleri tahmin edilebilirdi.
 *
 * Her iki taraf da kırpılıyor: panele yapıştırırken sona takılan bir boşluk ya da
 * telefon klavyesinin eklediği boşluk, doğru şifreyi sessizce reddettiriyordu.
 */
export function isPasswordCorrect(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  return safeEquals(input.trim(), expected);
}

/**
 * Sunucu tarafında eksik bir ayar var mı?
 *
 * Giriş ekranında "şifre yanlış" ile "sunucu ayarı eksik" durumlarını ayırmak için.
 * Tek yöneticili bir mağazada, ayar eksikken genel bir hata göstermek sahibini
 * teşhis imkânı olmadan dışarıda bırakıyordu. Bu bilgi saldırgana bir şey
 * kazandırmaz — hiçbir şifrenin çalışmadığını zaten deneyerek öğrenir.
 */
export function getAdminConfigProblem(): string | null {
  if (!process.env.ADMIN_PASSWORD?.trim()) {
    return "ADMIN_PASSWORD tanımlı değil";
  }
  if (!isSessionSecretUsable()) {
    return `SESSION_SECRET tanımlı değil veya ${MIN_SECRET_LENGTH} karakterden kısa`;
  }
  return null;
}

export async function createSession(): Promise<void> {
  const { value } = createSessionValue();
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, value, {
    httpOnly: true, // JavaScript okuyamasın
    sameSite: "lax", // CSRF'e karşı
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function isLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  return isSessionValueValid(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

/**
 * Admin işlemlerinin başında çağrılır. proxy.ts zaten /admin altını koruyor;
 * bu ikinci kontrol, sunucu eylemlerinin (Server Action) doğrudan çağrılması
 * ihtimaline karşı savunma katmanıdır.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isLoggedIn())) {
    throw new Error("Bu işlem için yönetici girişi gerekiyor.");
  }
}

export { ADMIN_COOKIE_NAME };
