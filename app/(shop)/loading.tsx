/*
 * Sayfa geçişlerinde gösterilen iskelet. Mobilde bağlantı yavaşken beyaz ekran
 * yerine düzenin şekli görünsün diye ürün ızgarasının ölçülerini taklit ediyor.
 */
export default function Loading() {
  return (
    <div className="container-page py-8 md:py-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Yükleniyor…</span>

      <div className="h-9 w-56 animate-pulse rounded-xl bg-surface-2 md:h-11" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded-xl bg-surface-2" />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="card p-2">
            <div className="media aspect-4/5 w-full animate-pulse" />
            <div className="mx-1.5 mt-3 h-4 w-3/4 animate-pulse rounded-full bg-surface-2" />
            <div className="mx-1.5 mb-1.5 mt-2 h-4 w-1/3 animate-pulse rounded-full bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
