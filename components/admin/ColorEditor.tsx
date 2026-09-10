"use client";

import { useActionState, useState } from "react";
import { deleteColorAction, updateColorAction } from "@/app/admin/actions";
import { StockInput } from "@/components/admin/StockInput";

type ColorData = {
  name: string;
  hex: string;
  sizes: { id: string; size: string; stock: number }[];
};

/*
 * Tek bir rengin düzenleme bloğu: ad, renk kodu, bedenlerin stoğu ve silme.
 *
 * Renk kodu iki kontrolle giriliyor: tarayıcının renk seçicisi ve yanındaki
 * yazı alanı. İkisi de aynı değere bağlı — seçiciden seçmek yazıyı, yazıya
 * doğru bir kod yazmak da seçiciyi güncelliyor. Tek başına seçici bırakılsaydı
 * elindeki kodu (ör. tedarikçinin verdiği #4d5340) yapıştırmak imkânsız olurdu;
 * tek başına yazı alanı bırakılsaydı da rengin ne olduğunu görmeden yazmak
 * gerekirdi.
 */
export function ColorEditor({
  productId,
  color,
}: {
  productId: string;
  color: ColorData;
}) {
  const [state, formAction, isPending] = useActionState(updateColorAction, {});
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteColorAction, {});
  const [hex, setHex] = useState(color.hex);
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);

  const fieldId = `${productId}-${color.name}`;
  // Yazı alanına yarım kod yazılırken seçici bozulmasın diye önce geçerlilik kontrolü
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(hex);

  return (
    <div className="rounded-2xl border border-line p-4">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="currentName" value={color.name} />

        {/* basis-40 + max-w-xs: dar ekranda tam satır kaplıyor, geniş ekranda
            gereksiz yere uzayıp yanındaki alanları itmiyor */}
        <div className="min-w-0 flex-1 basis-40 sm:max-w-xs">
          <label htmlFor={`ad-${fieldId}`} className="block text-sm font-medium">
            Renk adı
          </label>
          <input
            id={`ad-${fieldId}`}
            name="name"
            defaultValue={color.name}
            required
            maxLength={30}
            className="field mt-1.5"
          />
        </div>

        <div>
          <label htmlFor={`kod-${fieldId}`} className="block text-sm font-medium">
            Renk kodu
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="color"
              value={isValidHex ? hex : color.hex}
              onChange={(event) => setHex(event.target.value)}
              aria-label={`${color.name} rengini seç`}
              className="h-12 w-12 shrink-0 cursor-pointer rounded-full border border-line bg-surface p-1"
            />
            <input
              id={`kod-${fieldId}`}
              name="hex"
              value={hex}
              onChange={(event) => setHex(event.target.value)}
              spellCheck={false}
              className="field mt-0 w-32 font-mono"
            />
          </div>
        </div>

        <button type="submit" disabled={isPending} className="btn-ink">
          {isPending ? "Kaydediliyor…" : "Rengi Kaydet"}
        </button>
      </form>

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
      {deleteState.error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {deleteState.error}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {color.sizes.map((size) => (
          <StockInput
            key={size.id}
            variantId={size.id}
            size={size.size}
            stock={size.stock}
          />
        ))}
      </div>

      {/*
        Silme iki adımlı. Tarayıcının confirm() penceresi yerine kendi onayımızı
        gösteriyoruz: confirm() bazı ortamlarda hiç açılmıyor ve açılınca da
        neyin silineceğini yazamıyoruz.
      */}
      <div className="mt-4 border-t border-line pt-3">
        {isConfirmingDelete ? (
          <form action={deleteAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="currentName" value={color.name} />
            <span className="text-sm">
              <strong className="font-medium">{color.name}</strong> rengi ve{" "}
              {color.sizes.length} bedeni silinecek. Emin misiniz?
            </span>
            <button
              type="submit"
              disabled={isDeleting}
              className="rounded-full bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isDeleting ? "Siliniyor…" : "Evet, sil"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="link-quiet text-sm text-ink-muted"
            >
              Vazgeç
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="link-quiet text-sm text-ink-muted transition-colors hover:text-danger"
          >
            Bu rengi sil
          </button>
        )}
      </div>
    </div>
  );
}
