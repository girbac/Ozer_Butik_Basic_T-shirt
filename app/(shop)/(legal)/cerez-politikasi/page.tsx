import type { Metadata } from "next";
import { STORE_INFO } from "@/lib/store-info";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "Ozer Butik'te hangi çerezlerin kullanıldığı.",
};

export default function CookiePolicyPage() {
  return (
    <>
      <h1>Çerez Politikası</h1>
      <p>
        Bu sitede yalnızca sitenin çalışması için gereken teknik veriler kullanılır.{" "}
        <strong>Reklam veya takip amaçlı üçüncü taraf çerezi kullanmıyoruz.</strong>
      </p>

      <h2>Kullanılan Teknolojiler</h2>
      <table>
        <tbody>
          <tr>
            <th>Ad</th>
            <th>Türü</th>
            <th>Amaç</th>
            <th>Süre</th>
          </tr>
          <tr>
            <td>ozer-butik-sepet</td>
            <td>Yerel depolama</td>
            <td>
              Sepetinizdeki ürünleri hatırlamak. Yalnızca kendi tarayıcınızda tutulur,
              bize gönderilmez.
            </td>
            <td>Siz silene kadar</td>
          </tr>
          <tr>
            <td>ozer_admin</td>
            <td>Zorunlu çerez</td>
            <td>
              Yönetim paneli oturumu. Yalnızca mağaza yöneticisinin tarayıcısında
              oluşur, müşterilerde bulunmaz.
            </td>
            <td>7 gün</td>
          </tr>
        </tbody>
      </table>

      <h2>Ödeme Sırasında</h2>
      <p>
        Ödeme adımında iyzico&apos;nun güvenli sayfasına yönlendirilirsiniz. O
        sayfada iyzico&apos;nun kendi çerez politikası geçerlidir.
      </p>

      <h2>Çerezleri Yönetme</h2>
      <p>
        Tarayıcınızın ayarlarından yerel depolamayı ve çerezleri silebilirsiniz.
        Sepet verisi silinirse sepetiniz boşalır; bunun dışında sitenin kullanımı
        etkilenmez.
      </p>

      <h2>İletişim</h2>
      <p>
        Sorularınız için {STORE_INFO.email} adresine yazabilirsiniz.
      </p>
    </>
  );
}
