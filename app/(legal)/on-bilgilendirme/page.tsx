import type { Metadata } from "next";
import { STORE_INFO } from "@/lib/store-info";

export const metadata: Metadata = {
  title: "Ön Bilgilendirme Formu",
  description: "Özer Butik ön bilgilendirme formu.",
};

export default function PreInformationPage() {
  return (
    <>
      <h1>Ön Bilgilendirme Formu</h1>
      <p>
        Bu form, Mesafeli Sözleşmeler Yönetmeliği uyarınca, siparişinizi
        tamamlamadan önce bilmeniz gereken bilgileri içerir.
      </p>

      <h2>Satıcıya İlişkin Bilgiler</h2>
      <dl>
        <dt>Unvan</dt>
        <dd>{STORE_INFO.legalName}</dd>
        <dt>Adres</dt>
        <dd>{STORE_INFO.address}</dd>
        <dt>Telefon</dt>
        <dd>{STORE_INFO.phone}</dd>
        <dt>E-posta</dt>
        <dd>{STORE_INFO.email}</dd>
        <dt>ETBİS numarası</dt>
        <dd>{STORE_INFO.etbisNumber}</dd>
      </dl>

      <h2>Ürünün Temel Nitelikleri</h2>
      <p>
        Sipariş edilen ürünün adı, rengi, bedeni, adedi ve birim fiyatı ödeme
        sayfasındaki sipariş özetinde yer alır. Ürünlerin kumaş bileşimi, gramajı ve
        bakım talimatları ilgili ürün sayfasında belirtilmiştir.
      </p>

      <h2>Ödeme ve Teslimat</h2>
      <ul>
        <li>
          Ödeme, iyzico altyapısı üzerinden kredi/banka kartı ile ve 3D Secure
          doğrulamasıyla alınır. Kart bilgileriniz Satıcı tarafından görülmez ve
          saklanmaz.
        </li>
        <li>
          Toplam tutar, ürün bedelleri ile kargo ücretinin toplamıdır ve ödeme
          öncesinde sipariş özetinde açıkça gösterilir.
        </li>
        <li>
          Teslimat {STORE_INFO.shippingCompany} ile, sipariş formunda belirttiğiniz
          adrese yapılır. Teslim süresi en geç {STORE_INFO.deliveryDays} gündür;
          olağan koşullarda 1-3 iş günüdür.
        </li>
        <li>
          Kargo ücreti Alıcı&apos;ya aittir. Kampanya koşulları sağlandığında kargo
          ücretsizdir; geçerli tutar sitenin üst kısmındaki duyuru şeridinde
          belirtilir.
        </li>
      </ul>

      <h2>Cayma Hakkı</h2>
      <p>
        Ürünü teslim aldığınız tarihten itibaren {STORE_INFO.withdrawalDays} gün
        içinde, gerekçe göstermeksizin cayma hakkınız vardır. Cayma bildiriminizi{" "}
        {STORE_INFO.email} adresine veya {STORE_INFO.phone} numarasına iletmeniz
        yeterlidir.
      </p>
      <p>
        Ürünün kullanılmamış, yıkanmamış ve etiketleri sökülmemiş olması gerekir.
        Cayma bildiriminizin bize ulaşmasından itibaren 14 gün içinde ödemeniz iade
        edilir.
      </p>

      <h2>Cayma Hakkının Kullanılamayacağı Hâller</h2>
      <p>
        Kişiye özel hazırlanan ürünler ile ambalajı açılmış iç giyim ürünlerinde
        cayma hakkı kullanılamaz.
      </p>

      <h2>Şikâyet ve İtiraz</h2>
      <p>
        Uyuşmazlık durumunda, Ticaret Bakanlığı&apos;nca ilan edilen parasal sınırlar
        dâhilinde yerleşim yerinizdeki Tüketici Hakem Heyeti&apos;ne veya Tüketici
        Mahkemesi&apos;ne başvurabilirsiniz.
      </p>
    </>
  );
}
