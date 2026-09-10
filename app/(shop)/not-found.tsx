import Link from "next/link";

/*
 * Mağaza çerçevesi içindeki "bulunamadı" ekranı.
 *
 * Olmayan veya yayından kaldırılmış bir ürün adresine girildiğinde
 * (bkz. urun/[slug]/page.tsx içindeki notFound çağrısı) burası açılıyor.
 * Kök seviyedeki sayfa da açılabilirdi ama o, mağaza düzeninin dışında:
 * başlık, sepet ve alt bilgi olmadan çıplak bir ekran gelirdi. Yanlış bir
 * bağlantıya tıklayan müşterinin oradan alışverişe dönebilmesi gerekiyor.
 *
 * Not: bu sayfa HTTP 200 ile dönüyor, 404 ile değil. Sebebi Next 16'nın
 * akış (streaming) davranışı — sayfa kabuğu gönderilmeye başladıktan sonra
 * durum kodu değiştirilemiyor. Arama motoru açısından sorun değil: Next bu
 * durumda sayfaya kendiliğinden <meta name="robots" content="noindex">
 * ekliyor, yani adres dizine girmiyor.
 */
export default function ShopNotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="display text-5xl text-accent">404</p>
      <h1 className="display mt-4 text-3xl md:text-4xl">Aradığınız sayfa bulunamadı</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
        Bağlantı eskimiş ya da ürün yayından kaldırılmış olabilir. Modellerimizin
        tamamını ana sayfada bulabilirsiniz.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Modelleri Gör
      </Link>
    </div>
  );
}
