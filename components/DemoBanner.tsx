/*
 * Veritabanı bağlı değilken sitenin üstünde duran uyarı.
 *
 * Gerekli çünkü demo modunda vitrin gerçek bir mağazadan ayırt edilemiyor:
 * ürünler, fiyatlar, sepet hepsi çalışıyor ama sipariş alınamıyor. Bunu
 * gizlemek, mağaza sahibinin "yayındayım" sanmasına yol açardı.
 */
export function DemoBanner() {
  return (
    <div className="border-b border-ink/15 bg-accent-soft">
      <p className="container-page py-2.5 text-center text-xs leading-relaxed text-ink">
        <strong className="font-medium">Demo görünümü</strong> — veritabanı henüz
        bağlanmadı. Ürünler örnek verilerdir ve{" "}
        <strong className="font-medium">sipariş alınamaz</strong>. Vercel panelinden
        Storage → Postgres bağladığınızda mağaza gerçek verilerle çalışmaya başlar.
      </p>
    </div>
  );
}
