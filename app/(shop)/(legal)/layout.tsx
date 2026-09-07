import { HAS_MISSING_STORE_INFO } from "@/lib/store-info";

/*
 * Yasal ve bilgi sayfaları için ortak düzen: dar okuma genişliği, tipografi.
 *
 * Mağaza bilgileri henüz doldurulmadıysa sayfanın üstünde bir uyarı gösteriyoruz
 * ki bu metinler yanlışlıkla eksik hâlde yayına alınmasın.
 */
export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="container-page py-10 md:py-16">
      <div className="mx-auto max-w-2xl">
        {HAS_MISSING_STORE_INFO && (
          <p
            role="status"
            className="mb-8 border border-danger px-4 py-3 text-sm leading-relaxed text-danger"
          >
            <strong>Yayına hazır değil:</strong> Bu sayfadaki köşeli parantezli alanlar
            (ticari unvan, adres, vergi ve ETBİS bilgileri) henüz doldurulmadı.
            Satışa başlamadan önce <code>lib/store-info.ts</code> dosyasını
            güncelleyin.
          </p>
        )}

        <article
          className="
            [&_h1]:text-2xl [&_h1]:font-medium [&_h1]:tracking-tight [&_h1]:md:text-3xl
            [&_h2]:mt-10 [&_h2]:text-base [&_h2]:font-medium [&_h2]:md:text-lg
            [&_h3]:mt-6 [&_h3]:text-sm [&_h3]:font-medium
            [&_p]:mt-4 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-ink-muted
            [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5
            [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5
            [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-ink-muted
            [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2
            [&_dl]:mt-4 [&_dt]:mt-3 [&_dt]:text-sm [&_dt]:font-medium
            [&_dd]:text-sm [&_dd]:leading-relaxed [&_dd]:text-ink-muted
            [&_table]:mt-4 [&_table]:w-full [&_table]:text-sm
            [&_td]:border-b [&_td]:border-line [&_td]:py-2.5 [&_td]:align-top
            [&_th]:border-b [&_th]:border-line [&_th]:py-2.5 [&_th]:text-left [&_th]:font-medium
          "
        >
          {children}
        </article>
      </div>
    </div>
  );
}
