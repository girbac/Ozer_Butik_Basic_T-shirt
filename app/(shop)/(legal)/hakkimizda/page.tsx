import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Özer Butik neden yalnızca beş model basic t-shirt satıyor?",
};

export default function AboutPage() {
  return (
    <>
      <h1>Hakkımızda</h1>

      <p>
        Özer Butik, tek bir soruyla başladı: neden iyi bir basic tişört bulmak bu
        kadar zor?
      </p>

      <p>
        Mağazalar yüzlerce seçenekle dolu, ama çoğu birkaç yıkamada formunu
        kaybediyor, yakası genişliyor ya da kumaşı inceliyor. Biz tersini yaptık:
        seçeneği azalttık, kaliteyi sabitledik. Beş kalıp, tek bir amaç için —
        yıllarca giyebileceğiniz bir tişört.
      </p>

      <h2>Beş model, beş farklı ihtiyaç</h2>
      <p>
        Regular Fit her güne, Oversize rahat duruşa, Slim Fit ceket altına, V Yaka
        daha açık bir yakaya, Ağır Gramaj ise dik duruş ve uzun ömre. Hepsi aynı
        özene sahip; sadece kalıpları ve gramajları farklı.
      </p>

      <h2>Kumaş</h2>
      <p>
        Tüm modellerde penye pamuk kullanıyoruz. Kumaşlar dikilmeden önce ön işlemden
        geçiyor, böylece yıkamada çekme yapmıyor. Yaka bantları ve etek uçları çift
        dikişle takviyeli.
      </p>

      <h2>Söz veriyoruz</h2>
      <p>
        Beğenmediğiniz ürünü 14 gün içinde koşulsuz geri alıyoruz. Bir sorun
        olduğunda bize yazmanız yeterli — çözüme kadar takipteyiz.
      </p>

      <p>
        <Link href="/">Modelleri incelemek için buraya dönebilirsiniz.</Link>
      </p>
    </>
  );
}
