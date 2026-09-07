import type { Metadata } from "next";
import { STORE_INFO } from "@/lib/store-info";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK Aydınlatma Metni",
  description: "Kişisel verilerinizin nasıl işlendiğine dair aydınlatma metni.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Gizlilik ve KVKK Aydınlatma Metni</h1>
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca,
        veri sorumlusu sıfatıyla {STORE_INFO.legalName} olarak kişisel verilerinizi
        aşağıda açıklandığı şekilde işliyoruz.
      </p>

      <h2>İşlenen Kişisel Veriler</h2>
      <ul>
        <li>
          <strong>Kimlik ve iletişim:</strong> ad, soyad, e-posta adresi, telefon
          numarası
        </li>
        <li>
          <strong>Teslimat:</strong> il, ilçe, açık adres, posta kodu
        </li>
        <li>
          <strong>Sipariş:</strong> sipariş numarası, satın alınan ürünler, tutar,
          sipariş notu
        </li>
        <li>
          <strong>İşlem güvenliği:</strong> IP adresi, işlem tarih ve saati
        </li>
      </ul>
      <p>
        <strong>Kart bilgileriniz tarafımızca işlenmez ve saklanmaz.</strong> Ödeme
        işlemi, ödeme kuruluşu iyzico&apos;nun kendi güvenli sayfasında gerçekleşir;
        bize yalnızca ödemenin başarılı olup olmadığı bilgisi ulaşır.
      </p>

      <h2>İşleme Amaçları</h2>
      <ul>
        <li>siparişinizin oluşturulması, hazırlanması ve teslim edilmesi,</li>
        <li>ödeme işleminin gerçekleştirilmesi ve doğrulanması,</li>
        <li>sipariş ve kargo bilgilendirmelerinin gönderilmesi,</li>
        <li>iade, değişim ve müşteri destek taleplerinin karşılanması,</li>
        <li>fatura düzenlenmesi ve yasal saklama yükümlülüklerinin yerine getirilmesi.</li>
      </ul>

      <h2>Hukuki Sebep</h2>
      <p>
        Verileriniz, KVKK m.5/2-(c) uyarınca <em>sözleşmenin kurulması ve ifası</em>{" "}
        için gerekli olması ve m.5/2-(ç) uyarınca <em>hukuki yükümlülüğümüzü yerine
        getirmemiz</em> hukuki sebeplerine dayanarak işlenmektedir.
      </p>

      <h2>Aktarım</h2>
      <p>Verileriniz yalnızca hizmetin gerektirdiği ölçüde şu taraflara aktarılır:</p>
      <ul>
        <li>
          <strong>{STORE_INFO.shippingCompany}</strong> — teslimat için ad, adres ve
          telefon bilgisi
        </li>
        <li>
          <strong>iyzico Ödeme Hizmetleri A.Ş.</strong> — ödemenin
          gerçekleştirilmesi için gerekli bilgiler
        </li>
        <li>
          <strong>Yetkili kamu kurumları</strong> — yalnızca hukuken zorunlu hâllerde
        </li>
      </ul>

      <h2>Saklama Süresi</h2>
      <p>
        Sipariş ve fatura kayıtları, Vergi Usul Kanunu ve Türk Ticaret Kanunu
        gereğince 10 yıl boyunca saklanır. Bu sürenin sonunda verileriniz silinir
        veya anonim hâle getirilir.
      </p>

      <h2>Haklarınız</h2>
      <p>KVKK m.11 uyarınca:</p>
      <ul>
        <li>kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
        <li>işlenmişse buna ilişkin bilgi talep etme,</li>
        <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
        <li>yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
        <li>eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
        <li>şartları oluştuğunda silinmesini veya yok edilmesini isteme,</li>
        <li>
          işlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle
          aleyhinize bir sonuç ortaya çıkmasına itiraz etme,
        </li>
        <li>kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
      </ul>
      <p>
        haklarına sahipsiniz. Taleplerinizi {STORE_INFO.email} adresine iletebilir
        veya {STORE_INFO.address} adresine yazılı olarak gönderebilirsiniz. Başvurunuz
        en geç 30 gün içinde sonuçlandırılır.
      </p>

      <h2>Veri Güvenliği</h2>
      <p>
        Site trafiği HTTPS ile şifrelenir. Yönetim paneline erişim şifre ile
        korunur. Ödeme bilgileri sistemimize hiç girmez.
      </p>
    </>
  );
}
