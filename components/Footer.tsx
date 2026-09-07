import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/mesafeli-satis", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/on-bilgilendirme", label: "Ön Bilgilendirme Formu" },
  { href: "/iptal-ve-iade", label: "İptal ve İade Koşulları" },
  { href: "/kargo-ve-teslimat", label: "Kargo ve Teslimat" },
  { href: "/gizlilik", label: "Gizlilik ve KVKK" },
  { href: "/cerez-politikasi", label: "Çerez Politikası" },
];

const SHOP_LINKS = [
  { href: "/", label: "Tüm Modeller" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
];

export function Footer() {
  return (
    <footer className="mt-section border-t border-line bg-surface md:mt-section-lg">
      <div className="container-page py-10 md:py-14">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <p className="text-sm font-semibold tracking-[0.2em]">ÖZER BUTİK</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              Beş model basic t-shirt. Fazlası yok, eksiği yok.
            </p>
          </div>

          <nav aria-labelledby="footer-shop">
            <h2 id="footer-shop" className="text-xs font-medium uppercase tracking-widest">
              Mağaza
            </h2>
            <ul className="mt-4 space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-[24px] items-center text-sm text-ink-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal" className="sm:col-span-1 md:col-span-2">
            <h2 id="footer-legal" className="text-xs font-medium uppercase tracking-widest">
              Yasal
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-[24px] items-center text-sm text-ink-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} Özer Butik. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-ink-muted">
            Ödemeler <span className="font-medium text-ink">iyzico</span> güvencesiyle
            alınır.
          </p>
        </div>
      </div>
    </footer>
  );
}
