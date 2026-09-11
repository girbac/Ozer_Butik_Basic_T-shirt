/*
 * Mağazanın yasal ve iletişim bilgileri.
 *
 * !!! CANLIYA ÇIKMADAN ÖNCE DOLDURULMASI ZORUNLU !!!
 * Buradaki değerler yasal sayfalarda (Mesafeli Satış Sözleşmesi, Ön Bilgilendirme
 * Formu, KVKK metni) doğrudan kullanılıyor. Eksik bilgiyle satış yapmak
 * 6502 sayılı Tüketicinin Korunması Hakkında Kanun'a aykırıdır.
 *
 * Tek yerden yönetilmesi için burada toplandı; sayfalar bu değerleri okuyor.
 */

export const STORE_INFO = {
  /** Ticari unvan — şahıs şirketiyse ad soyad, limitedse tam unvan */
  legalName: "[TİCARİ UNVAN GİRİLECEK]",
  /** Müşterinin gördüğü marka adı */
  brandName: "Ozer Butik",
  /** Açık adres (mahalle, cadde, no, ilçe/il) */
  address: "[AÇIK ADRES GİRİLECEK]",
  /** Vergi dairesi ve numarası; şahıs şirketinde T.C. kimlik no da olabilir */
  taxOffice: "[VERGİ DAİRESİ GİRİLECEK]",
  taxNumber: "[VERGİ NO GİRİLECEK]",
  /** ETBİS kayıt numarası — e-ticaret için zorunlu */
  etbisNumber: "[ETBİS NO GİRİLECEK]",
  /** Mersis numarası (varsa) */
  mersisNumber: "",
  phone: "[TELEFON GİRİLECEK]",
  email: "[E-POSTA GİRİLECEK]",
  /** Anlaşmalı kargo firması */
  shippingCompany: "[KARGO FİRMASI GİRİLECEK]",
  /** İadelerin gönderileceği adres */
  returnAddress: "[İADE ADRESİ GİRİLECEK]",
  /** Cayma hakkı süresi (gün) — kanunen en az 14 */
  withdrawalDays: 14,
  /** Teslimat taahhüdü (gün) — kanunen en fazla 30 */
  deliveryDays: 30,
} as const;

/** Bir alan hâlâ doldurulmamış mı? Sayfalarda uyarı göstermek için. */
export function isPlaceholder(value: string): boolean {
  return value.startsWith("[") && value.endsWith("]");
}

export const HAS_MISSING_STORE_INFO = Object.values(STORE_INFO).some(
  (value) => typeof value === "string" && isPlaceholder(value),
);
