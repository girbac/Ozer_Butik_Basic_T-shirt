import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

/*
 * Ürün fotoğraflarının nereye yazılacağı.
 *
 * İki hedef var ve hangisinin kullanılacağı ortama göre kendiliğinden seçiliyor:
 *
 *   blob  → Vercel Blob. Canlıda kullanılan tek yol. BLOB_READ_WRITE_TOKEN
 *           tanımlıysa buraya yazılır.
 *   yerel → public/urunler/yuklenen/ altına dosya olarak. YALNIZCA geliştirme
 *           makinesinde. Vercel'de dosya sistemi salt okunur olduğu için orada
 *           asla kullanılamaz; zaten VERCEL değişkeni varken bu yola girilmiyor.
 *
 * Vercel'de token yoksa sessizce başka bir yola sapmıyoruz — yükleme açık bir
 * hatayla reddediliyor. Sessizce yerel diske yazmak, mağaza sahibinin
 * fotoğrafları yüklediğini sanıp ilk yayında hepsini kaybetmesi demek olurdu.
 */

const LOCAL_DIR = path.join(process.cwd(), "public", "urunler", "yuklenen");
const LOCAL_URL_PREFIX = "/urunler/yuklenen/";

export type ImageStoreKind = "blob" | "yerel" | "yok";

function readToken(): string | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token ? token : undefined;
}

/** Bu ortamda fotoğraf nereye yazılır? Kurulum durumu sayfası da bunu gösteriyor. */
export function getImageStoreKind(): ImageStoreKind {
  if (readToken()) return "blob";
  // VERCEL değişkenini Vercel'in kendisi tanımlar; yerel makinede yoktur.
  if (!process.env.VERCEL) return "yerel";
  return "yok";
}

export function isImageUploadAvailable(): boolean {
  return getImageStoreKind() !== "yok";
}

/** Dosya adını URL'de ve dosya sisteminde güvenli hâle getirir. */
function safeName(original: string): string {
  const ext = path.extname(original).toLowerCase().slice(0, 5) || ".jpg";
  const stem = path
    .basename(original, path.extname(original))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  // Zaman damgası + rastgele son ek: aynı adlı iki dosya birbirini ezmesin.
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${stem || "gorsel"}-${unique}${ext}`;
}

/**
 * Dosyayı saklar ve mağazada kullanılacak adresini döndürür.
 *
 * @param file Tarayıcıdan gelen dosya.
 * @param folder Blob/klasör içindeki alt yol (ör. ürün slug'ı).
 */
export async function storeImage(file: File, folder: string): Promise<string> {
  const kind = getImageStoreKind();
  const name = safeName(file.name);

  if (kind === "blob") {
    const result = await put(`urunler/${folder}/${name}`, file, {
      access: "public",
      token: readToken(),
      // Adı biz benzersiz yapıyoruz; Vercel'in ayrıca son ek eklemesine gerek yok.
      addRandomSuffix: false,
    });
    return result.url;
  }

  if (kind === "yerel") {
    await mkdir(LOCAL_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(LOCAL_DIR, name), buffer);
    return `${LOCAL_URL_PREFIX}${name}`;
  }

  throw new Error(
    "Fotoğraf yüklenemez: depolama bağlı değil. " +
      "Vercel → Storage → Blob oluşturup projeye bağlayın, sonra Redeploy yapın.",
  );
}

/**
 * Fotoğrafı depodan siler.
 *
 * Silme başarısız olursa hata YÜKSELTİLMİYOR, yalnızca log'a yazılıyor. Sebep:
 * bu işlev veritabanı kaydı silinirken çağrılıyor ve asıl olan kaydın gitmesi.
 * Depoda artık kimsenin görmediği bir dosyanın kalması katlanılabilir; buna
 * takılıp mağaza sahibinin fotoğrafı panelden silememesi değil.
 */
export async function removeImage(url: string): Promise<void> {
  try {
    if (url.startsWith(LOCAL_URL_PREFIX)) {
      await unlink(path.join(LOCAL_DIR, path.basename(url)));
      return;
    }
    if (url.startsWith("https://") && readToken()) {
      await del(url, { token: readToken() });
    }
  } catch (error) {
    console.error(`[gorsel] silinemedi (${url}):`, error);
  }
}
