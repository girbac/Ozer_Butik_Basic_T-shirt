"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/Icons";

type GalleryImage = { url: string; alt: string };

/*
 * Ürün galerisi.
 *
 * Mobil: yatay kaydırmalı, snap'li carousel. Parmakla kaydırma doğal davranış
 *        ama tek yol o değil — okla da, noktaya basarak da gezilebiliyor.
 * Masaüstü: büyük ana görsel + altında küçük görsel şeridi.
 *
 * Sağa/sola geçiş okları görselin ÜZERİNDE duruyor. Önceden oklar yalnızca
 * tam ekran görünümün içindeydi; yani fotoğrafı değiştirmek için önce
 * fotoğrafa girip büyütmek gerekiyordu. Bu, en sık yapılan hareketi en
 * uzun yola bağlıyordu.
 *
 * Renk değişince galerinin başa dönmesi, üst bileşenin verdiği `key` sayesinde
 * bileşenin yeniden bağlanmasıyla olur — ayrıca bir effect'e gerek yok.
 */
export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const hasMany = images.length > 1;

  // Mobil carousel'de hangi görselin görünür olduğunu takip et
  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const index = Math.round(scroller.scrollLeft / scroller.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), images.length - 1));
  }

  /*
   * Mobilde ok/noktaya basınca kaydırıcıyı elle sürüyoruz. State'i burada
   * ayrıca güncellemiyoruz: kaydırma bittiğinde handleScroll zaten çalışıyor,
   * tek doğru kaynak kaydırıcının kendi konumu.
   */
  function scrollToIndex(index: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ left: index * scroller.clientWidth, behavior: "smooth" });
  }

  /** Döngüsel ilerleme: sondan sonra başa, baştan öncesi sona. */
  function step(from: number, direction: 1 | -1): number {
    return (from + direction + images.length) % images.length;
  }

  function handleMobileStep(direction: 1 | -1) {
    scrollToIndex(step(activeIndex, direction));
  }

  function handleDesktopStep(direction: 1 | -1) {
    setActiveIndex((index) => step(index, direction));
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
        <div className="relative">
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

          {hasMany && (
            <>
              <GalleryArrow
                direction="prev"
                onClick={() => handleMobileStep(-1)}
                className="left-6"
              />
              <GalleryArrow
                direction="next"
                onClick={() => handleMobileStep(1)}
                className="right-6"
              />
            </>
          )}
        </div>

        {hasMany && (
          /* Noktalar da basılabilir: istenen görsele doğrudan gidilebiliyor */
          <div className="mt-3 flex justify-center gap-1">
            {images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`${index + 1}. görsele git`}
                aria-current={index === activeIndex}
                // p-2 -m-1: nokta küçük kalırken dokunma alanı büyüyor
                className="-m-1 p-2"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-200 ${
                    index === activeIndex ? "w-5 bg-ink" : "w-1.5 bg-disabled"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {productName} görsel {activeIndex + 1} / {images.length}
        </p>
      </div>

      {/* Masaüstü galeri */}
      <div className="hidden md:block">
        {/*
          Büyütme düğmesi ile oklar KARDEŞ; oklar düğmenin içinde olsaydı
          iç içe buton olurdu (geçersiz HTML) ve oka basmak aynı zamanda
          görseli büyütürdü.
        */}
        <div className="relative">
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

          {hasMany && (
            <>
              <GalleryArrow
                direction="prev"
                onClick={() => handleDesktopStep(-1)}
                className="left-3"
              />
              <GalleryArrow
                direction="next"
                onClick={() => handleDesktopStep(1)}
                className="right-3"
              />
            </>
          )}
        </div>

        {hasMany && (
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

          {hasMany && (
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

/*
 * Galeri oku: beyaz yuvarlak düğme, gölgeyle görselin üzerinde duruyor.
 * Fotoğraf koyu da olsa açık da olsa görünür kalması için beyaz zemin
 * kullanılıyor — ok rengi fotoğrafa göre değişmiyor.
 */
function GalleryArrow({
  direction,
  onClick,
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  className: string;
}) {
  const Icon = direction === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Önceki görsel" : "Sonraki görsel"}
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-[var(--shadow-float)] backdrop-blur-sm transition-transform hover:scale-105 ${className}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
