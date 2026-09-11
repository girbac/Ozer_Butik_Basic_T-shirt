import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/prisma";
import { parseOlcum } from "@/lib/analytics";
import { createLimiter } from "@/lib/rate-limit";

/*
 * Ziyaret ölçümünü kaydeden uç.
 *
 * Tarayıcı bunu sayfadan ayrılırken navigator.sendBeacon ile çağırıyor, yani
 * cevabı kimse beklemiyor. Bu yüzden HER DURUMDA hızlı ve sessizce dönüyor:
 * hata olsa bile ziyaretçiye yansımamalı, ölçüm asla alışverişi bozmamalı.
 *
 * Yalnızca ziyaretçi ölçüme izin verdiyse çağrılıyor (bkz. CookieConsent);
 * izin kontrolü tarayıcı tarafında, çünkü rıza orada saklanıyor.
 */

// Dakikada tek IP'den en fazla 60 kayıt. Normal bir ziyaretçi bunun çok altında
// kalır; üstü ya bozuk bir istemci ya da kasıtlı doldurma denemesidir.
const limiter = createLimiter({ max: 60, windowMs: 60 * 1000 });

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return new NextResponse(null, { status: 204 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "bilinmeyen";
  if (!limiter.allow(ip)) {
    return new NextResponse(null, { status: 429 });
  }

  let govde: unknown;
  try {
    govde = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const olcum = parseOlcum(govde);
  if (!olcum) {
    // Geçersiz kayıt sessizce düşer; istemciye ayrıntı vermenin faydası yok.
    return new NextResponse(null, { status: 204 });
  }

  try {
    await prisma.pageView.create({ data: olcum });
  } catch (error) {
    // Ölçüm yazılamazsa bu bir arıza değil; loglayıp geçiyoruz.
    console.error("[olcum] kayıt yazılamadı:", error);
  }

  return new NextResponse(null, { status: 204 });
}
