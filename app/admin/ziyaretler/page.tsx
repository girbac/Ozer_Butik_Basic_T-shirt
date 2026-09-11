import type { Metadata } from "next";
import Link from "next/link";
import { getZiyaretOzeti, pruneOldPageViews, RETENTION_DAYS } from "@/lib/analytics-query";
import { formatDuration, pathLabel } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Ziyaretler",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ARALIKLAR = [7, 30, 90] as const;

export default async function AdminVisitsPage(props: PageProps<"/admin/ziyaretler">) {
  const params = await props.searchParams;
  const istenen = Number(Array.isArray(params.gun) ? params.gun[0] : params.gun);
  const gun = ARALIKLAR.includes(istenen as (typeof ARALIKLAR)[number]) ? istenen : 7;

  await pruneOldPageViews();
  const ozet = await getZiyaretOzeti(gun);

  // Çubukların uzunluğu en çok zaman geçirilen sayfaya göre ölçekleniyor.
  const enUzunSure = Math.max(...ozet.sayfalar.map((s) => s.toplamSure), 1);

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-2xl md:text-3xl">Ziyaretler</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            Hangi sayfada ne kadar zaman geçirildiğini gösterir. Yalnızca çerez
            bandında <strong className="text-ink">Kabul et</strong> diyen ziyaretçiler
            sayılır, o yüzden gerçek trafik buradan biraz yüksektir.
          </p>
        </div>

        <nav className="flex gap-1" aria-label="Zaman aralığı">
          {ARALIKLAR.map((aralik) => (
            <Link
              key={aralik}
              href={`/admin/ziyaretler?gun=${aralik}`}
              aria-current={aralik === gun ? "page" : undefined}
              className={`chip ${
                aralik === gun ? "border-accent bg-accent-soft text-accent-deep" : ""
              }`}
            >
              {aralik} gün
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Kutu
          baslik="Ziyaret"
          deger={ozet.toplamZiyaret.toLocaleString("tr-TR")}
          alt="Farklı oturum sayısı"
        />
        <Kutu
          baslik="Sayfa görüntüleme"
          deger={ozet.toplamGoruntuleme.toLocaleString("tr-TR")}
          alt="Açılan toplam sayfa"
        />
        <Kutu
          baslik="Telefondan"
          deger={ozet.mobilOran === null ? "—" : `%${ozet.mobilOran}`}
          alt="Görüntülemelerin oranı"
        />
      </div>

      {ozet.sayfalar.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="text-sm text-ink-muted">
            Bu aralıkta kayıt yok. Site yayına girip ziyaretçiler çerez bandında
            &quot;Kabul et&quot; dedikçe burası dolmaya başlar.
          </p>
        </div>
      ) : (
        <div className="card mt-6 overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="display text-base">En çok zaman geçirilen sayfalar</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Toplam süreye göre sıralı — yalnızca çok açılan değil, gerçekten
              üzerinde durulan sayfalar üstte.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Sayfa</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Ziyaret</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Görüntüleme</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Ortalama süre</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Toplam süre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ozet.sayfalar.map((sayfa) => (
                  <tr key={sayfa.path}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{pathLabel(sayfa.path)}</p>
                      {/* Çubuk: hangi sayfanın baskın olduğu tabloyu okumadan görünsün */}
                      <span
                        aria-hidden="true"
                        className="mt-1.5 block h-1 rounded-full bg-accent/25"
                        style={{ width: `${Math.max(3, (sayfa.toplamSure / enUzunSure) * 100)}%` }}
                      />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{sayfa.ziyaret}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{sayfa.goruntuleme}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatDuration(sayfa.ortalamaSure)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">
                      {formatDuration(sayfa.toplamSure)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ozet.gunluk.length > 1 && <GunlukGrafik gunluk={ozet.gunluk} />}

      <p className="mt-6 text-xs leading-relaxed text-ink-muted">
        Kişisel veri toplanmıyor: IP, kalıcı çerez veya parmak izi yok. &quot;Ziyaret&quot;
        bir sekme oturumuna karşılık gelir — aynı kişi yarın tekrar gelirse yeni
        ziyaret sayılır. Kayıtlar {RETENTION_DAYS} gün sonra otomatik siliniyor.
      </p>
    </div>
  );
}

function Kutu({ baslik, deger, alt }: { baslik: string; deger: string; alt: string }) {
  return (
    <div className="card p-5">
      <p className="label">{baslik}</p>
      <p className="display mt-2 text-3xl tabular-nums">{deger}</p>
      <p className="mt-1 text-xs text-ink-muted">{alt}</p>
    </div>
  );
}

/*
 * Günlük ziyaret grafiği. Kütüphane kullanılmıyor — basit bir sütun grafiği
 * için sayfaya JavaScript yüklemek gereksiz; bu hâliyle sunucuda çiziliyor.
 */
function GunlukGrafik({ gunluk }: { gunluk: { tarih: string; ziyaret: number }[] }) {
  const enYuksek = Math.max(...gunluk.map((g) => g.ziyaret), 1);

  return (
    <div className="card mt-4 p-5">
      <h2 className="display text-base">Günlük ziyaret</h2>
      <ol className="mt-5 flex h-32 items-end gap-1">
        {gunluk.map((gun) => (
          <li key={gun.tarih} className="flex h-full flex-1 flex-col justify-end">
            <span
              className="w-full rounded-t bg-accent"
              style={{ height: `${Math.max(2, (gun.ziyaret / enYuksek) * 100)}%` }}
              title={`${new Date(gun.tarih).toLocaleDateString("tr-TR")} — ${gun.ziyaret} ziyaret`}
            />
          </li>
        ))}
      </ol>
      <div className="mt-2 flex justify-between text-xs text-ink-muted">
        <span>{new Date(gunluk[0].tarih).toLocaleDateString("tr-TR")}</span>
        <span>{new Date(gunluk[gunluk.length - 1].tarih).toLocaleDateString("tr-TR")}</span>
      </div>
    </div>
  );
}
