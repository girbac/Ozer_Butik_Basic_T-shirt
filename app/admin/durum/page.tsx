import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminConfigProblem } from "@/lib/auth";
import { diagnoseDatabaseError } from "@/lib/db-error";
import { getDatabaseUrlSource, isDatabaseConfigured, prisma } from "@/lib/prisma";
import { listPostgresEnvNames } from "@/lib/database-url.mjs";
import { getImageStoreKind } from "@/lib/image-store";
import { isSessionSecretUsable, MIN_SECRET_LENGTH } from "@/lib/session-token";

/*
 * Kurulum durumu sayfası — ŞİFRE GEREKTİRMEZ.
 *
 * Neden şifresiz: eksik ayar yüzünden panele giremeyen bir mağaza sahibi, tam da
 * o anda ayarları kontrol edecek sayfaya da giremiyor. Kilidin arkasına koymak
 * kilitli kaldığında işe yaramaz.
 *
 * Neden güvenli: hiçbir DEĞER gösterilmiyor, yalnızca "tanımlı mı / yeterince
 * uzun mu" bilgisi. Ayrıca her şey doğruysa sayfa 404 veriyor — yani düzgün
 * kurulmuş bir mağazada bu sayfa hiç yok. Bir saldırgan bu bilgiyi zaten
 * deneyerek öğrenir; mağaza sahibinin öğrenememesi ise onu kilitli bırakıyordu.
 */

export const metadata: Metadata = {
  title: "Kurulum Durumu",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Check = {
  label: string;
  ok: boolean;
  detail: string;
  action?: string;
};

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [];

  /*
   * 1. Veritabanı adresi.
   *
   * Adı DATABASE_URL olmak zorunda değil — Vercel'de Postgres bağlarken seçilen
   * ön eke göre STORAGE_URL, POSTGRES_URL vb. olabiliyor. Hangisinde bulunduğunu
   * YAZIYORUZ: bu sayfanın varlık sebebi tahmin ettirmemek. Bulunamadığında da
   * ortamda Postgres adresi taşıyan başka değişken var mı diye bakıp adlarını
   * (değerlerini değil) listeliyoruz.
   */
  const dbConfigured = isDatabaseConfigured();
  const dbSource = getDatabaseUrlSource();
  const postgresNames = listPostgresEnvNames();

  checks.push({
    label: "Veritabanı adresi",
    ok: dbConfigured,
    detail: dbConfigured
      ? `Bulundu — ${dbSource} değişkeninde`
      : postgresNames.length > 0
        ? `Bulunamadı. Postgres adresi taşıyan değişkenler: ${postgresNames.join(", ")}`
        : "Bulunamadı — mağaza demo görünümünde",
    action: dbConfigured
      ? undefined
      : "Vercel → Storage → Neon Postgres oluşturup projeye bağlayın. Değişkenin adı önemli değil, adresi kendimiz buluyoruz.",
  });

  // 2. Veritabanına gerçekten ulaşılıyor mu, tablolar var mı
  if (dbConfigured) {
    try {
      const count = await prisma.product.count();
      checks.push({
        label: "Veritabanı bağlantısı",
        ok: true,
        detail: `Bağlantı kuruldu, katalogda ${count} ürün var`,
        action:
          count === 0
            ? "Ürünler görünmüyorsa Deployments → Redeploy yapın; tablolar ve örnek ürünler yayın sırasında oluşturulur."
            : undefined,
      });
    } catch (error) {
      const diagnosis = diagnoseDatabaseError(error);
      checks.push({
        label: "Veritabanı bağlantısı",
        ok: false,
        detail: `${diagnosis.title} (kod: ${diagnosis.code})`,
        action: diagnosis.action,
      });
    }
  }

  // 3. Yönetim şifresi
  const hasPassword = Boolean(process.env.ADMIN_PASSWORD?.trim());
  checks.push({
    label: "ADMIN_PASSWORD",
    ok: hasPassword,
    detail: hasPassword ? "Tanımlı" : "Tanımlı değil — panele giriş yapılamaz",
    action: hasPassword
      ? undefined
      : "Vercel → Settings → Environment Variables'a tam olarak ADMIN_PASSWORD adıyla ekleyin.",
  });

  /*
   * 4. Fotoğraf deposu.
   *
   * Eksikliği mağazayı anında çökertmiyor ama panelden fotoğraf yüklenemiyor,
   * yani gerçek ürün kareleri hiç konulamıyor. Bir tişört mağazası için bu
   * eksik sayılır; o yüzden diğerleri gibi "tamam değil" olarak işaretleniyor
   * ve tamamlanana kadar bu sayfa görünmeye devam ediyor.
   *
   * Geliştirme makinesinde depo yerel klasör olduğu için orada zaten tamam.
   */
  const storeKind = getImageStoreKind();
  checks.push({
    label: "Fotoğraf deposu",
    ok: storeKind !== "yok",
    detail:
      storeKind === "blob"
        ? "Vercel Blob bağlı — panelden fotoğraf yüklenebilir"
        : storeKind === "yerel"
          ? "Yerel klasör (yalnızca geliştirme makinesi)"
          : "Bağlı değil — panelden fotoğraf yüklenemez",
    action:
      storeKind === "yok"
        ? "Vercel → Storage → Blob oluşturup projeye bağlayın, sonra Redeploy yapın."
        : undefined,
  });

  // 5. Oturum anahtarı
  const secretRaw = process.env.SESSION_SECRET?.trim() ?? "";
  const secretUsable = isSessionSecretUsable();
  checks.push({
    label: "SESSION_SECRET",
    ok: secretUsable,
    detail: secretUsable
      ? `Tanımlı (${secretRaw.length} karakter)`
      : secretRaw.length === 0
        ? "Tanımlı değil"
        : `Çok kısa: ${secretRaw.length} karakter, en az ${MIN_SECRET_LENGTH} olmalı`,
    action: secretUsable
      ? undefined
      : `En az ${MIN_SECRET_LENGTH} karakterlik rastgele bir dizi girin.`,
  });

  return checks;
}

export default async function AdminStatusPage() {
  const checks = await runChecks();
  const allOk = checks.every((check) => check.ok) && getAdminConfigProblem() === null;

  // Her şey yolundaysa bu sayfanın var olmasına gerek yok.
  if (allOk) {
    notFound();
  }

  return (
    <div className="container-page py-10 md:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="display text-2xl md:text-3xl">Kurulum Durumu</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Aşağıda eksik olan ayarlar listeleniyor. Hepsini tamamlayıp{" "}
          <strong className="text-ink">Deployments → Redeploy</strong> yaptığınızda bu
          sayfa kaybolur ve panele girebilirsiniz.
        </p>

        <ul className="mt-8 divide-y divide-line border-y border-line">
          {checks.map((check) => (
            <li key={check.label} className="flex gap-4 py-4">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm ${
                  check.ok ? "bg-success/12 text-success" : "bg-danger/12 text-danger"
                }`}
              >
                {check.ok ? "✓" : "!"}
              </span>
              <div className="min-w-0">
                <p className="font-medium">
                  <code className="text-[13px]">{check.label}</code>
                  <span className="sr-only">{check.ok ? " — tamam" : " — eksik"}</span>
                </p>
                <p className={`mt-1 text-sm ${check.ok ? "text-ink-muted" : "text-danger"}`}>
                  {check.detail}
                </p>
                {check.action && (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {check.action}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-ink-muted">
          Değişkenleri eklerken adları harfi harfine yazın (büyük harf ve alt çizgi
          dahil) ve değerin sonuna boşluk almamaya dikkat edin.
        </p>

        <Link href="/admin/giris" className="btn-secondary mt-8">
          Giriş Ekranına Dön
        </Link>
      </div>
    </div>
  );
}
