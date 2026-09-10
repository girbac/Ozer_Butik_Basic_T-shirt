import { z } from "zod";

/*
 * Formların ve API girdilerinin tek doğrulama noktası.
 * Hata mesajları doğrudan kullanıcıya gösterilecek şekilde Türkçe yazılmıştır.
 */

/** Türkiye cep telefonu: 05xx xxx xx xx / +90 5xx… / 5xx… kabul edilir. */
const phoneRegex = /^(?:\+?90)?0?5\d{9}$/;

export const checkoutSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "E-posta adresi gerekli.")
    .email("Geçerli bir e-posta adresi girin.")
    .max(120),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .refine((value) => phoneRegex.test(value), "Geçerli bir cep telefonu girin (05XX XXX XX XX)."),
  fullName: z
    .string()
    .trim()
    .min(3, "Ad ve soyadınızı girin.")
    .max(80)
    .refine((value) => value.split(/\s+/).length >= 2, "Lütfen ad ve soyadınızı birlikte girin."),
  city: z.string().trim().min(2, "İl seçin.").max(40),
  district: z.string().trim().min(2, "İlçe girin.").max(60),
  address: z
    .string()
    .trim()
    .min(10, "Açık adresinizi girin (mahalle, sokak, bina, daire).")
    .max(500),
  postalCode: z
    .string()
    .trim()
    .max(10)
    .optional()
    .or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  contractAccepted: z.literal(true, {
    message: "Devam etmek için sözleşmeleri onaylamanız gerekiyor.",
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartLineSchema = z.object({
  variantId: z.string().min(1).max(40),
  quantity: z.number().int().min(1).max(10),
});

export const checkoutRequestSchema = z.object({
  customer: checkoutSchema,
  lines: z.array(cartLineSchema).min(1, "Sepetiniz boş.").max(50),
  /*
   * Kupon kodu isteğe bağlı. Buradaki tek iş uzunluk sınırı; kodun geçerli
   * olup olmadığına sunucu karar veriyor (bkz. lib/coupons.ts). İstemciden
   * gelen indirim TUTARI hiç alınmıyor — olsaydı tarayıcıdan değiştirilebilirdi.
   */
  couponCode: z.string().trim().max(24).optional().or(z.literal("")),
});

/** Telefon numarasını iyzico'nun beklediği +90 biçimine çevirir. */
export function toInternationalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withoutCountry = digits.replace(/^90/, "").replace(/^0/, "");
  return `+90${withoutCountry}`;
}
