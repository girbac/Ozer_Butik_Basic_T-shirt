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

/*
 * Alt bilgi koyu bir bant. Sayfanın gövdesi açık tuval olduğu için burası
 * doğal bir "son" işareti veriyor; ayrıca yasal bağlantıların hepsi tek yerde.
 */
export function Footer() {
  return (
    <footer className="mt-section md:mt-section-lg">
      <div className="container-page">
        <div className="rounded-t-[28px] bg-slate px-6 py-10 text-white md:px-10 md:py-14">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="sm:col-span-2 md:col-span-1">
              <p className="display text-lg">
                Ozer Butik
                <span aria-hidden="true" className="text-accent-wash">
                  .
                </span>
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
                Beş model basic t-shirt. Fazlası yok, eksiği yok.
              </p>
            </div>

            <nav aria-labelledby="footer-shop">
              <h2 id="footer-shop" className="text-xs font-medium text-white/65">
                Mağaza
              </h2>
              <ul className="mt-4 space-y-2">
                {SHOP_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-sm text-white/80 transition-colors hover:text-white sm:min-h-[28px]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-labelledby="footer-legal" className="sm:col-span-1 md:col-span-2">
              <h2 id="footer-legal" className="text-xs font-medium text-white/65">
                Yasal
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-sm text-white/80 transition-colors hover:text-white sm:min-h-[28px]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/12 pt-6 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Ozer Butik. Tüm hakları saklıdır.</p>
            <p>
              Ödemeler <span className="text-white">iyzico</span> güvencesiyle alınır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
