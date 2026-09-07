"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { revalidateCart } from "@/lib/actions/cart";
import type { PricedCart } from "@/lib/cart-server";
import { CITIES } from "@/lib/cities";
import { useCart } from "@/lib/cart";
import { replaceCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { checkoutSchema } from "@/lib/validation";
import { LockIcon } from "@/components/Icons";

/*
 * Ödeme sayfası. Bilinçli olarak TEK EKRAN, adımsız: her ek adım terk oranını
 * artırır. Üyelik yok — sadece teslimat için gereken alanlar isteniyor.
 *
 * Mobilde özet en üstte katlanabilir bir satır olarak duruyor (kullanıcı ne kadar
 * ödeyeceğini görsün ama formun önünü kapatmasın), masaüstünde sağda yapışkan kart.
 */

type FieldErrors = Partial<Record<string, string>>;

const initialForm = {
  email: "",
  phone: "",
  fullName: "",
  city: "",
  district: "",
  address: "",
  postalCode: "",
  note: "",
};

export function CheckoutForm() {
  const { items, isReady } = useCart();
  const [priced, setPriced] = useState<PricedCart | null>(null);
  const [form, setForm] = useState(initialForm);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [cartIssues, setCartIssues] = useState<string[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady || items.length === 0) return;

    let cancelled = false;
    revalidateCart(items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })))
      .then((result) => {
        if (cancelled) return;
        setPriced(result);
        replaceCart(
          result.lines.map((line) => ({
            variantId: line.variantId,
            productSlug: line.productSlug,
            productName: line.productName,
            colorName: line.colorName,
            size: line.size,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            image: line.image ?? "",
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setFormError("Sepet doğrulanamadı. Sayfayı yenileyin.");
      });

    return () => {
      cancelled = true;
    };
  }, [items, isReady]);

  function updateField(name: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    // Kullanıcı düzeltmeye başlar başlamaz o alanın hatası kalksın
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setCartIssues([]);

    const parsed = checkoutSchema.safeParse({ ...form, contractAccepted });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);

      // İlk hatalı alana odaklan — mobilde kullanıcı hatayı aramasın
      const firstKey = String(parsed.error.issues[0]?.path[0] ?? "");
      document.getElementById(firstKey)?.scrollIntoView({ block: "center", behavior: "smooth" });
      document.getElementById(firstKey)?.focus({ preventScroll: true });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: parsed.data,
          lines: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error ?? "Ödeme başlatılamadı.");
        if (Array.isArray(data.issues)) setCartIssues(data.issues);
        setSubmitting(false);
        return;
      }

      // iyzico'nun 3D Secure ödeme sayfasına yönlendir
      window.location.href = data.paymentPageUrl;
    } catch {
      setFormError("Bağlantı hatası. İnternetinizi kontrol edip tekrar deneyin.");
      setSubmitting(false);
    }
  }

  if (!isReady) {
    return (
      <div className="container-page py-16">
        <p className="text-sm text-ink-muted">Yükleniyor…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-5 py-20 text-center">
        <h1 className="text-2xl font-medium tracking-tight">Sepetiniz boş</h1>
        <p className="max-w-sm text-sm text-ink-muted">
          Ödeme yapabilmek için önce sepetinize ürün eklemelisiniz.
        </p>
        <Link href="/" className="btn-primary">
          Modelleri Gör
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-2xl font-medium tracking-tight md:text-3xl">Ödeme</h1>

      {/* Mobilde özet formun üstünde — kullanıcı ne ödeyeceğini baştan görsün */}
      <div className="mt-6 lg:hidden">
        <OrderSummary priced={priced} compact />
      </div>

      <div className="mt-6 grid gap-10 lg:mt-8 lg:grid-cols-[1fr_380px] lg:gap-14">
        <form onSubmit={handleSubmit} noValidate className="min-w-0">
          <fieldset disabled={isSubmitting} className="space-y-8">
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest">İletişim</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Sipariş onayını ve kargo takip numarasını buraya göndereceğiz.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  id="email"
                  label="E-posta"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  error={errors.email}
                  onChange={(value) => updateField("email", value)}
                />
                <Field
                  id="phone"
                  label="Cep telefonu"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="05XX XXX XX XX"
                  value={form.phone}
                  error={errors.phone}
                  onChange={(value) => updateField("phone", value)}
                />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest">Teslimat Adresi</h2>
              <div className="mt-4 grid gap-4">
                <Field
                  id="fullName"
                  label="Ad Soyad"
                  autoComplete="name"
                  value={form.fullName}
                  error={errors.fullName}
                  onChange={(value) => updateField("fullName", value)}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium">
                      İl
                    </label>
                    <select
                      id="city"
                      name="city"
                      autoComplete="address-level1"
                      value={form.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      aria-invalid={Boolean(errors.city)}
                      aria-describedby={errors.city ? "city-error" : undefined}
                      className={`mt-1.5 h-12 w-full border bg-bg px-3 ${
                        errors.city ? "border-danger" : "border-line"
                      }`}
                    >
                      <option value="">Seçin</option>
                      {CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    {errors.city && (
                      <p id="city-error" className="mt-1 text-xs text-danger">
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <Field
                    id="district"
                    label="İlçe"
                    autoComplete="address-level2"
                    value={form.district}
                    error={errors.district}
                    onChange={(value) => updateField("district", value)}
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium">
                    Açık adres
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    autoComplete="street-address"
                    placeholder="Mahalle, sokak, bina no, daire no"
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    aria-invalid={Boolean(errors.address)}
                    aria-describedby={errors.address ? "address-error" : undefined}
                    className={`mt-1.5 w-full resize-y border bg-bg px-3 py-2.5 ${
                      errors.address ? "border-danger" : "border-line"
                    }`}
                  />
                  {errors.address && (
                    <p id="address-error" className="mt-1 text-xs text-danger">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="postalCode"
                    label="Posta kodu (isteğe bağlı)"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    value={form.postalCode}
                    error={errors.postalCode}
                    onChange={(value) => updateField("postalCode", value)}
                  />
                  <Field
                    id="note"
                    label="Sipariş notu (isteğe bağlı)"
                    value={form.note}
                    error={errors.note}
                    onChange={(value) => updateField("note", value)}
                  />
                </div>
              </div>
            </section>

            <section>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={(event) => {
                    setContractAccepted(event.target.checked);
                    setErrors((current) => ({ ...current, contractAccepted: undefined }));
                  }}
                  aria-invalid={Boolean(errors.contractAccepted)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#111111]"
                />
                <span className="text-sm leading-relaxed text-ink-muted">
                  <Link href="/on-bilgilendirme" target="_blank" className="text-ink underline underline-offset-2">
                    Ön Bilgilendirme Formu
                  </Link>{" "}
                  ve{" "}
                  <Link href="/mesafeli-satis" target="_blank" className="text-ink underline underline-offset-2">
                    Mesafeli Satış Sözleşmesi
                  </Link>
                  &apos;ni okudum, onaylıyorum.
                </span>
              </label>
              {errors.contractAccepted && (
                <p role="alert" className="mt-2 text-xs text-danger">
                  {errors.contractAccepted}
                </p>
              )}
            </section>

            {formError && (
              <div role="alert" className="border border-danger px-4 py-3 text-sm text-danger">
                <p>{formError}</p>
                {cartIssues.length > 0 && (
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {cartIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
                {cartIssues.length > 0 && (
                  <Link href="/sepet" className="mt-3 inline-block text-ink underline underline-offset-2">
                    Sepete git
                  </Link>
                )}
              </div>
            )}

            <div>
              <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? "Yönlendiriliyor…" : "Ödemeye Geç"}
              </button>
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-muted">
                <LockIcon className="h-4 w-4" />
                Kart bilgileriniz iyzico&apos;nun güvenli sayfasında alınır, bizde saklanmaz.
              </p>
            </div>
          </fieldset>
        </form>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <OrderSummary priced={priced} />
        </aside>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  type = "text",
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1.5 h-12 w-full border bg-bg px-3 ${
          error ? "border-danger" : "border-line"
        }`}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function OrderSummary({ priced, compact = false }: { priced: PricedCart | null; compact?: boolean }) {
  if (!priced) {
    return (
      <div className="border border-line p-5">
        <p className="text-sm text-ink-muted">Özet hesaplanıyor…</p>
      </div>
    );
  }

  return (
    <div className="border border-line p-5">
      <h2 className="text-xs font-medium uppercase tracking-widest">Sipariş Özeti</h2>

      {!compact && (
        <ul className="mt-4 space-y-4 border-b border-line pb-4">
          {priced.lines.map((line) => (
            <li key={line.variantId} className="flex gap-3">
              <div className="relative aspect-4/5 w-14 shrink-0 overflow-hidden bg-surface">
                {line.image && (
                  <Image src={line.image} alt="" fill sizes="56px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{line.productName}</p>
                <p className="text-xs text-ink-muted">
                  {line.colorName} · {line.size} · {line.quantity} adet
                </p>
              </div>
              <p className="shrink-0 text-sm tabular-nums">{formatPrice(line.lineTotal)}</p>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">
            Ara toplam{compact ? ` (${priced.lines.length} ürün)` : ""}
          </dt>
          <dd className="tabular-nums">{formatPrice(priced.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">Kargo</dt>
          <dd className="tabular-nums">
            {priced.shippingFee === 0 ? (
              <span className="text-success">Ücretsiz</span>
            ) : (
              formatPrice(priced.shippingFee)
            )}
          </dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
          <dt>Toplam</dt>
          <dd className="tabular-nums">{formatPrice(priced.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
