"use client";

import Image from "next/image";
import { useActionState, useId, useRef, useState } from "react";
import {
  deleteImageAction,
  setPrimaryImageAction,
  uploadImagesAction,
} from "@/app/admin/actions";

export type ManagedImage = {
  id: string;
  url: string;
  alt: string;
};

/*
 * Bir rengin (veya "tüm renkler"in) fotoğraf yönetimi: mevcutları gösterir,
 * yenisini yükler, kapak seçtirir, siler.
 *
 * Fotoğraflar gönderilmeden ÖNCE tarayıcıda küçültülüyor. Sebebi pratik:
 * telefondan çekilmiş bir kare 4000 piksel genişliğinde ve 4-5 MB oluyor,
 * mağazanın ihtiyacı olan en büyük boy ise 1600 piksel. Küçültmeden
 * gönderilseydi hem yükleme dakikalar sürerdi hem de sunucunun istek boyutu
 * sınırına takılırdı. Küçültülmüş hâli 300 KB civarında kalıyor.
 */

/** Mağazada kullanılan en büyük genişlik. Bunun üstü ziyan. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.86;

async function shrinkImage(file: File): Promise<File> {
  // Tarayıcı bu formatı çözemiyorsa (ör. HEIC) dosyayı olduğu gibi gönderelim;
  // sunucu tarafındaki boyut kontrolü yine de koruyor.
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) return file;

  // Küçültme işe yaramadıysa (zaten küçük dosya) aslını gönder.
  if (blob.size >= file.size && scale === 1) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

export function ImageManager({
  productId,
  colorName,
  images,
}: {
  productId: string;
  /** Boş dize: fotoğraf ürünün tüm renklerinde görünür. */
  colorName: string;
  images: ManagedImage[];
}) {
  const [uploadState, uploadAction, isUploading] = useActionState(uploadImagesAction, {});
  const [isPreparing, setPreparing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  /*
   * Dosya seçilince hemen yükleniyor — ayrı bir "Yükle" düğmesi yok. Küçültme
   * asenkron olduğu için formu elle gönderiyoruz: dosyaları küçültülmüş
   * hâlleriyle input'a geri yazıp submit ediyoruz.
   */
  async function handleFilesSelected() {
    const input = inputRef.current;
    const form = formRef.current;
    if (!input?.files?.length || !form) return;

    setPreparing(true);
    try {
      const shrunk = await Promise.all(Array.from(input.files).map(shrinkImage));
      const transfer = new DataTransfer();
      for (const file of shrunk) transfer.items.add(file);
      input.files = transfer.files;
    } finally {
      setPreparing(false);
    }
    form.requestSubmit();
  }

  const busy = isPreparing || isUploading;

  return (
    <div>
      <div className="flex flex-wrap items-start gap-2">
        {images.map((image, index) => (
          <ImageTile key={image.id} image={image} isPrimary={index === 0} />
        ))}

        <form ref={formRef} action={uploadAction} className="contents">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="colorName" value={colorName} />
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            name="files"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            /*
             * Bilerek disabled DEĞİL. Devre dışı bir alan forma dâhil edilmiyor;
             * yükleme sırasında disabled yapılınca dosya sunucuya hiç gitmiyor,
             * işlem de "önce bir fotoğraf seçin" diyerek sessizce başarısız
             * oluyordu. Tekrar tıklamayı zaten etiket engelliyor (aşağıda).
             */
            className="sr-only"
          />
          <label
            htmlFor={inputId}
            className={`flex h-24 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-disabled text-center text-[11px] leading-tight text-ink-muted transition-colors hover:border-ink hover:text-ink ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {busy ? (
              <span>Yükleniyor…</span>
            ) : (
              <>
                <span aria-hidden="true" className="text-lg leading-none">
                  +
                </span>
                <span>Fotoğraf ekle</span>
              </>
            )}
          </label>
        </form>
      </div>

      {uploadState.error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {uploadState.error}
        </p>
      )}
      {uploadState.success && (
        <p role="status" className="mt-2 text-xs text-success">
          {uploadState.success}
        </p>
      )}
    </div>
  );
}

/*
 * Tek bir fotoğraf karesi.
 *
 * "Kapak yap" düğmesi karenin ÜSTÜNDE değil ALTINDA: üstte dururken kendi
 * karesinden geniş olduğu için yandaki karelerin üzerine biniyordu.
 */
function ImageTile({ image, isPrimary }: { image: ManagedImage; isPrimary: boolean }) {
  const [, primaryAction, isSettingPrimary] = useActionState(setPrimaryImageAction, {});
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteImageAction, {});

  return (
    <div className="w-20 shrink-0">
      <div className="relative h-24 w-20 overflow-hidden rounded-xl bg-surface-2">
        <Image src={image.url} alt={image.alt} fill sizes="80px" className="object-cover" />

        {isPrimary && (
          <span className="absolute bottom-1 left-1 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white">
            Kapak
          </span>
        )}

        <form action={deleteAction} className="absolute right-1 top-1">
          <input type="hidden" name="imageId" value={image.id} />
          <button
            type="submit"
            disabled={isDeleting}
            aria-label={`${image.alt} fotoğrafını sil`}
            title="Fotoğrafı sil"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-surface/90 text-ink-muted shadow-[var(--shadow-chip)] backdrop-blur-sm transition-colors hover:text-danger"
          >
            <span aria-hidden="true" className="text-sm leading-none">
              ×
            </span>
          </button>
        </form>
      </div>

      {!isPrimary && (
        <form action={primaryAction}>
          <input type="hidden" name="imageId" value={image.id} />
          <button
            type="submit"
            disabled={isSettingPrimary}
            className="link-quiet mt-1 block w-full text-center text-[11px] text-ink-muted transition-colors hover:text-ink"
          >
            {isSettingPrimary ? "…" : "Kapak yap"}
          </button>
        </form>
      )}

      {deleteState.error && (
        <p role="alert" className="mt-1 text-[10px] leading-tight text-danger">
          {deleteState.error}
        </p>
      )}
    </div>
  );
}
