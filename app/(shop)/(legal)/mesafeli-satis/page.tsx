import type { Metadata } from "next";
import { STORE_INFO } from "@/lib/store-info";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description: "Ozer Butik mesafeli satış sözleşmesi.",
};

export default function DistanceSalesPage() {
  return (
    <>
      <h1>Mesafeli Satış Sözleşmesi</h1>

      <h2>1. Taraflar</h2>
      <h3>Satıcı</h3>
      <dl>
        <dt>Unvan</dt>
        <dd>{STORE_INFO.legalName}</dd>
        <dt>Adres</dt>
        <dd>{STORE_INFO.address}</dd>
        <dt>Telefon</dt>
        <dd>{STORE_INFO.phone}</dd>
        <dt>E-posta</dt>
        <dd>{STORE_INFO.email}</dd>
        <dt>Vergi dairesi / numarası</dt>
        <dd>
          {STORE_INFO.taxOffice} / {STORE_INFO.taxNumber}
        </dd>
        <dt>ETBİS numarası</dt>
        <dd>{STORE_INFO.etbisNumber}</dd>
      </dl>

      <h3>Alıcı</h3>
      <p>
        Sipariş sırasında girilen ad, soyad, adres ve iletişim bilgileri ile
        tanımlanan tüketici.
      </p>

      <h2>2. Sözleşmenin Konusu</h2>
      <p>
        İşbu sözleşmenin konusu, Alıcı&apos;nın Satıcı&apos;ya ait{" "}
        {STORE_INFO.brandName} internet sitesinden elektronik ortamda siparişini
        verdiği, aşağıda nitelikleri ve satış fiyatı belirtilen ürünün satışı ve
        teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve
        Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve
        yükümlülüklerinin belirlenmesidir.
      </p>

      <h2>3. Sözleşme Konusu Ürün</h2>
      <p>
        Ürünün türü, miktarı, marka/modeli, rengi, bedeni, satış bedeli ve ödeme
        şekli, siparişin verildiği andaki sipariş özetinde ve Alıcı&apos;ya
        gönderilen sipariş onayı e-postasında belirtildiği gibidir. Kargo ücreti
        Alıcı tarafından ödenir; kampanya koşullarının sağlanması hâlinde kargo
        ücretsizdir.
      </p>

      <h2>4. Genel Hükümler</h2>
      <ol>
        <li>
          Alıcı, sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme
          şekli ile teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve
          elektronik ortamda gerekli teyidi verdiğini beyan eder.
        </li>
        <li>
          Ürün, Alıcı&apos;nın sipariş formunda belirttiği adrese, siparişin
          onaylanmasından itibaren en geç {STORE_INFO.deliveryDays} gün içinde teslim
          edilir. Olağan koşullarda teslimat 1-3 iş günü içinde tamamlanır.
        </li>
        <li>
          Ürünün tesliminden sonra Alıcı&apos;ya ait kredi kartının Alıcı&apos;nın
          kusurundan kaynaklanmayan bir şekilde yetkisiz kişilerce haksız olarak
          kullanılması nedeniyle ilgili banka veya finans kuruluşunun ürün bedelini
          Satıcı&apos;ya ödememesi hâlinde, ürünün Alıcı&apos;ya teslim edilmiş
          olması kaydıyla ürünün Satıcı&apos;ya gönderilmesi zorunludur.
        </li>
        <li>
          Satıcı, mücbir sebepler veya kargoyu engelleyen olağanüstü durumlar
          nedeniyle ürünü süresi içinde teslim edemezse durumu Alıcı&apos;ya bildirir.
          Bu durumda Alıcı siparişi iptal edebilir; iptal hâlinde ödediği tutar 14 gün
          içinde kendisine iade edilir.
        </li>
        <li>
          Ödemeler, iyzico altyapısı üzerinden 3D Secure ile alınır. Kart bilgileri
          Satıcı tarafından görülmez ve saklanmaz.
        </li>
      </ol>

      <h2>5. Cayma Hakkı</h2>
      <p>
        Alıcı, ürünü teslim aldığı tarihten itibaren {STORE_INFO.withdrawalDays} gün
        içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden
        cayma hakkına sahiptir. Cayma bildiriminin bu süre içinde{" "}
        {STORE_INFO.email} adresine veya {STORE_INFO.phone} numarasına yapılması
        gerekir.
      </p>
      <p>
        Cayma hakkının kullanılması hâlinde ürünün, kullanılmamış, yıkanmamış ve
        etiketleri sökülmemiş olarak, faturası ve varsa aksesuarlarıyla birlikte
        eksiksiz iade edilmesi gerekir. Cayma bildiriminin Satıcı&apos;ya ulaşmasından
        itibaren 14 gün içinde ürün bedeli Alıcı&apos;ya iade edilir.
      </p>
      <p>
        Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesi uyarınca; Alıcı&apos;nın
        istekleri doğrultusunda kişiye özel hazırlanan ürünler ile iç giyim
        ürünlerinde ambalajı açılmış olanlar cayma hakkı kapsamı dışındadır.
      </p>

      <h2>6. Uyuşmazlıkların Çözümü</h2>
      <p>
        İşbu sözleşmeden doğabilecek uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca her
        yıl ilan edilen parasal sınırlar dâhilinde Alıcı&apos;nın yerleşim yerindeki
        Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.
      </p>

      <h2>7. Yürürlük</h2>
      <p>
        Alıcı, siparişi onaylamakla işbu sözleşmenin tüm koşullarını kabul etmiş
        sayılır. Sözleşme, siparişin Satıcı tarafından onaylanmasıyla yürürlüğe girer.
      </p>
    </>
  );
}
