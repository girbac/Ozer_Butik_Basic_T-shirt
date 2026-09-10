"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { updateProductAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import { ColorEditor } from "@/components/admin/ColorEditor";
import { ImageManager, type ManagedImage } from "@/components/admin/ImageManager";
import { ChevronDownIcon } from "@/components/Icons";

type ProductData = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  fabric: string;
  careInfo: string;
  price: number;
  comparePrice: number | null;
  active: boolean;
};

type ColorData = {
  name: string;
  hex: string;
  sizes: { id: string; size: string; stock: number }[];
  images: ManagedImage[];
};

/** Kuruş → düzenlenebilir TL metni: 49900 → "499.00" */
function toLiraInput(kurus: number | null): string {
  if (kurus === null) return "";
  return (kurus / 100).toFixed(2);
}

/*
 * Tek ürünün düzenleme kartı. Varsayılan olarak kapalı; açınca ürün bilgileri ve
 * renk × beden stok tablosu geliyor. Beş ürün için ayrı bir liste/detay sayfası
 * kurmak yerine hepsini tek sayfada tutmak daha pratik.
 */
export function ProductEditor({
  product,
  colors,
  sharedImages,
}: {
  product: ProductData;
  colors: ColorData[];
  /** Renge bağlı olmayan kareler — her rengin galerisinin sonuna eklenir. */
  sharedImages: ManagedImage[];
}) {
  const [isOpen, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(updateProductAction, {});

  const totalStock = colors.reduce(
    (sum, color) => sum + color.sizes.reduce((s, size) => s + size.stock, 0),
    0,
  );

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="display text-base">{product.name}</span>
            {!product.active && (
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] text-ink-muted">
                Yayında değil
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-sm text-ink-muted">
            {formatPrice(product.price)} · {colors.length} renk · toplam {totalStock} adet stok
          </span>
        </span>
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-line p-4">
          <form action={formAction}>
            <input type="hidden" name="id" value={product.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ürün adı" name="name" defaultValue={product.name} required />
              <Field label="Kısa açıklama" name="tagline" defaultValue={product.tagline} />
              <Field
                label="Fiyat (TL)"
                name="price"
                defaultValue={toLiraInput(product.price)}
                inputMode="decimal"
                required
              />
              <Field
                label="Eski fiyat (TL, boş bırakılabilir)"
                name="comparePrice"
                defaultValue={toLiraInput(product.comparePrice)}
                inputMode="decimal"
              />
            </div>

            <TextArea
              label="Açıklama"
              name="description"
              defaultValue={product.description}
              rows={4}
            />
            <Field label="Kumaş bilgisi" name="fabric" defaultValue={product.fabric} />
            <TextArea
              label="Yıkama ve bakım"
              name="careInfo"
              defaultValue={product.careInfo}
              rows={2}
            />

            <label className="mt-4 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product.active}
                className="h-5 w-5 accent-[#5433eb]"
              />
              <span className="text-sm">Mağazada yayında</span>
            </label>

            {state.error && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {state.error}
              </p>
            )}
            {state.success && (
              <p role="status" className="mt-3 text-sm text-success">
                {state.success}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? "Kaydediliyor…" : "Ürünü Kaydet"}
              </button>
              <Link
                href={`/urun/${product.slug}`}
                target="_blank"
                className="link-quiet text-sm text-ink-muted"
              >
                Mağazada gör
              </Link>
            </div>
          </form>

          <h3 className="label mt-8">Renkler ve stok</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Renk adını ve kodunu değiştirip <strong>Rengi Kaydet</strong>&apos;e basın.
            Stok adedi ise yazdığınız anda kendiliğinden kaydedilir.
          </p>

          <div className="mt-4 space-y-3">
            {colors.map((color) => (
              <ColorEditor key={color.name} productId={product.id} color={color} />
            ))}
          </div>

          <h3 className="label mt-8">Tüm renklerde görünen fotoğraflar</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Renkten bağımsız kareler — kumaş yakın çekimi, beden ölçüsü, etiket gibi.
            Her rengin galerisinin sonuna eklenirler.
          </p>
          <div className="mt-3">
            <ImageManager productId={product.id} colorName="" images={sharedImages} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  inputMode,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  inputMode?: "text" | "decimal";
}) {
  return (
    <div className="mt-4 first:mt-0 sm:mt-0">
      <label htmlFor={`${name}-${defaultValue.slice(0, 4)}`} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={`${name}-${defaultValue.slice(0, 4)}`}
        name={name}
        defaultValue={defaultValue}
        required={required}
        inputMode={inputMode}
        className="field mt-1.5"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows: number;
}) {
  return (
    <div className="mt-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="field-area mt-1.5"
      />
    </div>
  );
}
