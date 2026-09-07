import type { Metadata } from "next";
import { STORE_INFO } from "@/lib/store-info";

export const metadata: Metadata = {
  title: "İptal ve İade Koşulları",
  description:
    "Özer Butik iptal, iade ve değişim koşulları. 14 gün içinde koşulsuz iade.",
};

export default function ReturnsPage() {
  return (
    <>
      <h1>İptal ve İade Koşulları</h1>

      <h2>Sipariş İptali</h2>
      <p>
        Siparişiniz kargoya verilmeden önce {STORE_INFO.email} adresine yazarak veya{" "}
        {STORE_INFO.phone} numarasını arayarak iptal ettirebilirsiniz. İptal edilen
        siparişin bedeli, bankanıza bağlı olarak 2-10 iş günü içinde kartınıza iade
        edilir.
      </p>

      <h2>İade</h2>
      <p>
        Ürünü teslim aldığınız tarihten itibaren {STORE_INFO.withdrawalDays} gün
        içinde, hiçbir gerekçe göstermeden iade edebilirsiniz.
      </p>
      <p>İade edilecek ürünün:</p>
      <ul>
        <li>kullanılmamış ve yıkanmamış olması,</li>
        <li>etiketlerinin sökülmemiş olması,</li>
        <li>orijinal ambalajıyla ve faturasıyla birlikte gönderilmesi gerekir.</li>
      </ul>

      <h3>İade adımları</h3>
      <ol>
        <li>
          {STORE_INFO.email} adresine sipariş numaranızı ve iade etmek istediğiniz
          ürünü yazın.
        </li>
        <li>Size iade kodunu ve kargo bilgilerini ileteceğiz.</li>
        <li>
          Ürünü {STORE_INFO.shippingCompany} şubesinden, vereceğimiz kodla ücretsiz
          olarak gönderin.
        </li>
        <li>
          Ürün elimize ulaşıp kontrol edildikten sonra en geç 14 gün içinde ödemeniz
          iade edilir.
        </li>
      </ol>

      <h3>İade adresi</h3>
      <p>{STORE_INFO.returnAddress}</p>

      <h2>Değişim</h2>
      <p>
        Beden veya renk değişimi için de aynı adımları izleyin. İade işlemi
        tamamlandıktan sonra istediğiniz ürün için yeni sipariş oluşturabilirsiniz.
        Bu yöntem, stok durumundan bağımsız olarak en hızlı çözümdür.
      </p>

      <h2>Ayıplı Ürün</h2>
      <p>
        Ürün hatalı, eksik veya siparişinizden farklı geldiyse, teslimattan sonraki 30
        gün içinde bize bildirin. Bu durumda kargo masrafı tarafımıza aittir ve
        ürünü değiştiriyor ya da bedelini tamamen iade ediyoruz.
      </p>

      <h2>İade Edilemeyecek Ürünler</h2>
      <p>
        Kişiye özel üretilen ürünler ile ambalajı açılmış iç giyim ürünleri hijyen
        gerekçesiyle iade alınamaz.
      </p>
    </>
  );
}
