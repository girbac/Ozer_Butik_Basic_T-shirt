import Link from "next/link";
import { isLoggedIn } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/LogoutButton";

/*
 * Yönetim panelinin kendi çerçevesi. Müşteri başlığı, sepet ve alt bilgi burada
 * bilinçli olarak yok: panelde sepet ikonuna veya yasal sayfa bağlantılarına
 * ihtiyaç duyulmaz, üstelik sepet JavaScript'i de hiç yüklenmemiş olur.
 */
const TABS = [
  { href: "/admin", label: "Siparişler" },
  { href: "/admin/urunler", label: "Ürünler" },
  { href: "/admin/ayarlar", label: "Ayarlar" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const loggedIn = await isLoggedIn();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <span className="text-sm font-semibold tracking-[0.2em]">
            ÖZER BUTİK
            <span className="ml-2 font-normal tracking-normal text-ink-muted">yönetim</span>
          </span>

          {loggedIn && (
            <div className="flex items-center gap-1">
              <Link
                href="/"
                target="_blank"
                className="hidden px-3 py-2 text-sm text-ink-muted hover:text-ink sm:block"
              >
                Mağazayı gör
              </Link>
              <LogoutButton />
            </div>
          )}
        </div>
      </header>

      {loggedIn && (
        <nav className="border-b border-line" aria-label="Yönetim bölümleri">
          <div className="container-page no-scrollbar flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="whitespace-nowrap px-3 py-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <main className="flex-1">{children}</main>
    </div>
  );
}
