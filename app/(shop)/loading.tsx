/*
 * Sayfa geçişlerinde gösterilen iskelet. Mobilde bağlantı yavaşken beyaz ekran
 * yerine düzenin şekli görünsün diye ürün ızgarasının ölçülerini taklit ediyor.
 */
export default function Loading() {
  return (
    <div className="container-page py-8 md:py-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Yükleniyor…</span>

      <div className="h-9 w-56 animate-pulse bg-surface md:h-11" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse bg-surface" />

      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <div className="aspect-4/5 w-full animate-pulse bg-surface" />
            <div className="mt-3 h-4 w-3/4 animate-pulse bg-surface" />
            <div className="mt-2 h-4 w-1/3 animate-pulse bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
