import type { Metadata } from "next";
import { STORE_INFO } from "@/lib/store-info";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Ozer Butik iletişim bilgileri.",
};

export default function ContactPage() {
  return (
    <>
      <h1>İletişim</h1>
      <p>
        Siparişiniz, iade veya beden seçimiyle ilgili her konuda bize
        yazabilirsiniz. Hafta içi mesajlara aynı gün dönüyoruz.
      </p>

      <h2>Bize Ulaşın</h2>
      <dl>
        <dt>E-posta</dt>
        <dd>
          <a href={`mailto:${STORE_INFO.email}`}>{STORE_INFO.email}</a>
        </dd>
        <dt>Telefon</dt>
        <dd>
          <a href={`tel:${STORE_INFO.phone.replace(/\s/g, "")}`}>{STORE_INFO.phone}</a>
        </dd>
        <dt>Adres</dt>
        <dd>{STORE_INFO.address}</dd>
      </dl>

      <h2>Yasal Bilgiler</h2>
      <dl>
        <dt>Ticari unvan</dt>
        <dd>{STORE_INFO.legalName}</dd>
        <dt>Vergi dairesi / numarası</dt>
        <dd>
          {STORE_INFO.taxOffice} / {STORE_INFO.taxNumber}
        </dd>
        <dt>ETBİS kayıt numarası</dt>
        <dd>{STORE_INFO.etbisNumber}</dd>
        {STORE_INFO.mersisNumber && (
          <>
            <dt>Mersis numarası</dt>
            <dd>{STORE_INFO.mersisNumber}</dd>
          </>
        )}
      </dl>
    </>
  );
}
