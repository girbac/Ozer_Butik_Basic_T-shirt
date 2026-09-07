import "server-only";

import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  SESSION_DURATION_MS,
  createSessionValue,
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
 */
export function isPasswordCorrect(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error("[auth] ADMIN_PASSWORD tanımlı değil, giriş yapılamaz.");
    return false;
  }
  return safeEquals(input, expected);
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
