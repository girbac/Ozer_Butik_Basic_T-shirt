import Link from "next/link";

/*
 * 404 sayfası. Kök seviyede olduğu için mağaza çerçevesini (başlık, alt bilgi)
 * almıyor; kullanıcıyı çıkmazda bırakmamak için kendi bağlantısını taşıyor.
 */
export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">404</p>
      <h1 className="mt-4 text-2xl font-medium tracking-tight md:text-3xl">
        Aradığınız sayfa bulunamadı
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
        Bağlantı eskimiş ya da ürün yayından kaldırılmış olabilir. Beş modelimizin
        tamamını ana sayfada bulabilirsiniz.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Modelleri Gör
      </Link>
    </div>
  );
}
