"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/Icons";

type GalleryImage = { url: string; alt: string };

/*
 * Mobil: yatay kaydırmalı, snap'li carousel + nokta göstergesi. Parmakla kaydırma
 *        doğal davranış olduğu için ok butonu koymuyoruz.
 * Masaüstü: büyük ana görsel + altında küçük görsel şeridi, tıklayınca lightbox.
 *
 * Renk değişince galerinin başa dönmesi, üst bileşenin verdiği `key` sayesinde
 * bileşenin yeniden bağlanmasıyla olur — ayrıca bir effect'e gerek yok.
 */
export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Mobil carousel'de hangi görselin görünür olduğunu takip et
  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const index = Math.round(scroller.scrollLeft / scroller.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), images.length - 1));
  }

  // Lightbox klavye kontrolü
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight")
        setLightboxIndex((index) => (index === null ? null : (index + 1) % images.length));
      if (event.key === "ArrowLeft")
        setLightboxIndex((index) =>
          index === null ? null : (index - 1 + images.length) % images.length,
        );
    };
    window.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [lightboxIndex, images.length]);

  if (images.length === 0) {
    return <div className="media aspect-4/5 w-full" aria-hidden="true" />;
  }

  return (
    <div>
      {/* Mobil carousel */}
      <div className="md:hidden">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          // Kenardan kenara: sayfa kenar boşluğunu negatif margin ile geri alıyoruz.
          // Genişliği açıkça veriyoruz; aksi halde grid öğesinin min-width:auto değeri
          // kaydırıcıyı kırpmak yerine sayfayı yatay olarak taşırıyor.
          className="no-scrollbar -mx-4 flex w-[calc(100%+2rem)] snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        >
          {images.map((image, index) => (
            <div key={image.url} className="w-full shrink-0 snap-center px-4">
              <div className="media relative aspect-4/5 w-full">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
            {images.map((image, index) => (
              <span
                key={image.url}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === activeIndex ? "w-5 bg-ink" : "w-1.5 bg-disabled"
                }`}
              />
            ))}
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {productName} görsel {activeIndex + 1} / {images.length}
        </p>
      </div>

      {/* Masaüstü galeri */}
      <div className="hidden md:block">
        <button
          type="button"
          onClick={() => setLightboxIndex(activeIndex)}
          className="media relative block aspect-4/5 w-full cursor-zoom-in"
          aria-label="Görseli büyüt"
        >
          <Image
            src={images[activeIndex].url}
            alt={images[activeIndex].alt}
            fill
            priority
            sizes="(min-width: 1280px) 640px, 50vw"
            className="object-cover"
          />
        </button>

        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-3">
            {images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`${index + 1}. görseli göster`}
                aria-pressed={index === activeIndex}
                className={`relative aspect-4/5 overflow-hidden rounded-xl bg-surface-2 transition-opacity ${
                  index === activeIndex ? "ring-1 ring-ink" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={image.url} alt="" fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tam ekran lightbox */}
      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} büyük görsel`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Kapat"
          >
            <CloseIcon className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((index) =>
                    index === null ? null : (index - 1 + images.length) % images.length,
                  )
                }
                className="absolute left-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white"
                aria-label="Önceki görsel"
              >
                <ChevronLeftIcon className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((index) => (index === null ? null : (index + 1) % images.length))
                }
                className="absolute right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white"
                aria-label="Sonraki görsel"
              >
                <ChevronRightIcon className="h-7 w-7" />
              </button>
            </>
          )}

          <div className="relative h-[80vh] w-full max-w-3xl">
            <Image
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].alt}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
