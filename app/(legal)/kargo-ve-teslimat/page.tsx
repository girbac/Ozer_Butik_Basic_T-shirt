import type { Metadata } from "next";
import { formatPrice } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { STORE_INFO } from "@/lib/store-info";

export const metadata: Metadata = {
  title: "Kargo ve Teslimat",
  description: "Özer Butik kargo ücretleri ve teslimat süreleri.",
};

export default async function ShippingPage() {
  // Kargo ücreti ve ücretsiz kargo eşiği admin panelinden değiştirilebildiği için
  // sayfada sabit yazmıyoruz, ayarlardan okuyoruz.
  const settings = await getSettings();

  return (
    <>
      <h1>Kargo ve Teslimat</h1>

      <h2>Kargo Ücreti</h2>
      <table>
        <tbody>
          <tr>
            <th>Sepet tutarı</th>
            <th>Kargo ücreti</th>
          </tr>
          <tr>
            <td>{formatPrice(settings.freeShippingThreshold)} ve üzeri</td>
            <td>Ücretsiz</td>
          </tr>
          <tr>
            <td>{formatPrice(settings.freeShippingThreshold)} altı</td>
            <td>{formatPrice(settings.shippingFee)}</td>
          </tr>
        </tbody>
      </table>

      <h2>Kargoya Veriliş</h2>
      <p>
        Hafta içi saat 16:00&apos;a kadar verilen siparişler aynı gün, sonrasında
        verilenler ertesi iş günü kargoya teslim edilir. Hafta sonu ve resmî
        tatillerde kargo çıkışı yapılmaz.
      </p>

      <h2>Teslimat Süresi</h2>
      <p>
        Kargoya verildikten sonra teslimat, {STORE_INFO.shippingCompany} ile
        genellikle 1-3 iş günü sürer. Yoğun kampanya dönemlerinde bu süre uzayabilir.
        Yasal azami teslim süresi {STORE_INFO.deliveryDays} gündür.
      </p>

      <h2>Kargo Takibi</h2>
      <p>
        Siparişiniz kargoya verildiğinde takip numarasını sipariş sırasında
        girdiğiniz e-posta adresine gönderiyoruz. Takip numarasıyla kargonuzun yerini{" "}
        {STORE_INFO.shippingCompany} internet sitesinden izleyebilirsiniz.
      </p>

      <h2>Teslim Alırken</h2>
      <p>
        Paketi teslim alırken hasarlı olup olmadığını kontrol edin. Hasarlı bir paketi
        teslim almak zorunda değilsiniz; kargo görevlisine tutanak tutturarak iade
        edebilir ve durumu {STORE_INFO.email} adresinden bize bildirebilirsiniz.
      </p>

      <h2>Adres Değişikliği</h2>
      <p>
        Sipariş kargoya verilmeden önce {STORE_INFO.email} adresine yazarak teslimat
        adresinizi değiştirebilirsiniz. Kargoya verildikten sonra adres değişikliği
        yapılamaz.
      </p>
    </>
  );
}
