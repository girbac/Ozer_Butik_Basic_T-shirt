import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, isSessionValueValid } from "@/lib/session-token";

/*
 * /admin altındaki her sayfayı korur.
 *
 * Next.js 16'da bu dosyanın adı `middleware` değil `proxy`; çalışma ortamı
 * nodejs olduğu için node:crypto ile imza doğrulaması burada yapılabiliyor.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Giriş sayfasının kendisi korumasız olmalı, yoksa sonsuz yönlendirme olur.
  if (pathname === "/admin/giris") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!isSessionValueValid(token)) {
    const loginUrl = new URL("/admin/giris", request.url);
    // Girişten sonra kullanıcıyı gitmek istediği sayfaya geri götürelim.
    if (pathname !== "/admin") {
      loginUrl.searchParams.set("devam", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
