# Özer Butik — Basic T-shirt

Beş model basic t-shirt satan, mobil öncelikli e-ticaret sitesi.

Tasarım hedefi: **ziyaretçiyi yormamak.** Ana sayfada büyük tanıtım görseli yok —
girer girmez beş model görünür; ürün sayfasında renk, beden ve satın alma butonu
ilk ekranda yer alır.

## Teknoloji

| Katman | Seçim |
|---|---|
| Çatı | Next.js 16 (App Router, Turbopack) + TypeScript |
| Stil | Tailwind CSS v4 (CSS tabanlı tema, `app/globals.css`) |
| Veritabanı | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) |
| Ödeme | iyzico Checkout Form (3D Secure) |
| Görsel | Vercel Blob |
| E-posta | Resend |
| Barındırma | Vercel |

## Kurulum

```bash
npm install
cp .env.example .env      # değerleri doldurun
npx prisma migrate dev    # tabloları oluşturur
npm run db:seed           # 5 örnek model yükler
npm run dev
```

`http://localhost:3000`

### Kullanılabilir komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run db:migrate` | Şema değişikliğini veritabanına uygular |
| `npm run db:seed` | Örnek ürünleri yükler (siparişi olan ürüne dokunmaz) |
| `npm run db:studio` | Veritabanını tarayıcıda görüntüler |
| `npm run images:placeholder` | Geçici ürün görsellerini yeniden üretir |
| `npm test` | Testleri çalıştırır (veritabanı gerekir) |

## Tasarım sistemi

Tümü `app/globals.css` içinde CSS değişkeni olarak (Tailwind v4, `tailwind.config.ts` yok).

| Token | Değer | Kullanım |
|---|---|---|
| `bg` | `#fbfaf7` | Sayfa zemini — saf beyaz değil, sıcak kâğıt |
| `surface` | `#f2efe9` | Görsel zeminleri, kartlar |
| `surface-2` | `#e7e1d7` | İlerleme çubuğu yatağı, seçili sekme |
| `ink` | `#1a1815` | Metin ve birincil buton — saf siyah değil |
| `ink-muted` | `#6e6861` | İkincil metin |
| `line` | `#dfd9cf` | Kenarlık |
| `accent` | `#a2543a` | **Kil.** Sadece 5 yerde (aşağıya bakın) |
| `danger` | `#a3342b` | Yalnızca hata |
| `success` | `#4a6b4f` | Ücretsiz kargo, ödeme başarılı |

**Vurgu rengi kuralı:** `accent` yalnızca şu beş yerde kullanılır — duyuru şeridi,
seçili renk halkası, klavye odak halkası, azalan stok uyarısı, ücretsiz kargo
çubuğu. Bunun dışına taşarsa vurgu olmaktan çıkar. Stok azlığı bir hata değildir,
bu yüzden `danger` değil `accent` kullanır.

**Tipografi:** Başlıklarda Fraunces (serif, `.display` sınıfı), arayüz ve gövde
metninde Inter. Serif yalnızca büyük başlıklarda; küçük boyutta okunurluğu
düşürüyor. Küçük büyük-harf etiketler için `.label-caps`.

Tüm renk çiftleri WCAG AA (4.5:1) için doğrulandı; devre dışı ögeler 3:1.

## Neler var

| Bölüm | Adres |
|---|---|
| Vitrin | `/` |
| Ürün sayfası | `/urun/[slug]` |
| Sepet | `/sepet` |
| Ödeme (misafir checkout) | `/odeme` |
| Sipariş sonucu | `/siparis/[siparisNo]` |
| Yönetim paneli | `/admin` |
| Yasal sayfalar | `/mesafeli-satis`, `/on-bilgilendirme`, `/iptal-ve-iade`, `/kargo-ve-teslimat`, `/gizlilik`, `/cerez-politikasi` |

## Ödeme akışı

1. `POST /api/checkout` — sepet **sunucuda yeniden fiyatlandırılır**, sipariş
   `PENDING` olarak kaydedilir, iyzico Checkout Form başlatılır
2. Kullanıcı iyzico'nun 3D Secure sayfasına yönlenir
3. `POST /api/iyzico/callback` — token ile iyzico'ya sorulur, dönen sonucun
   **imzası HMAC-SHA256 ile doğrulanır**; ancak ikisi de geçerse ödeme kabul edilir
4. Stok tek transaction içinde düşülür, sipariş `PAID` olur, e-postalar gider

Stok sipariş oluşturulurken değil, **ödeme onaylandığında** düşülür — başarısız
ödeme stoğu boşuna kilitlemesin diye.

## Testler

`npm test` — 28 test, `node:test` ile. Kapsam:

- stok düşme, idempotency (aynı callback iki kez), eşzamanlı callback
- stok yetersizliği (eksiye düşmüyor), başarısız ödeme
- iyzico imza doğrulaması (tutar ve ödeme durumu kurcalama denemeleri dahil)
- yönetim oturumu jetonu (süre uzatma ve sahte imza denemeleri)
- tutar biçimlendirme ve telefon normalizasyonu

## Önemli notlar

- **Para birimi her yerde kuruş cinsinden `Int`'tir** (49900 = 499,00 TL). Ondalık
  sayı kullanılmaz. Görüntüleme için `lib/format.ts` içindeki `formatPrice`.
- **Sepetteki fiyata güvenilmez.** Sepet tarayıcıda tutulur; ödeme sırasında fiyat
  ve stok sunucuda veritabanından yeniden hesaplanır.
- **Ürün görselleri şu an yer tutucudur** (`public/urunler/`). Gerçek fotoğraflar
  admin panelinden yüklenecek.
- Ürün adları, fiyatlar ve renkler de yer tutucudur; `prisma/seed.ts` içinde.
- **Yasal bilgiler `lib/store-info.ts` içinde tek yerde.** Doldurulmadığı sürece
  yasal sayfaların ve yönetim panelinin üstünde kırmızı uyarı görünür.
- Mobil öncelikli: vitrin telefonda 2 sütun, ürün sayfasında sayfa kaydırılınca
  sabit alt satın alma barı devreye girer.
- Ürün görselini değiştirdikten sonra eski hâli görüyorsanız Next.js'in görsel
  önbelleğini temizleyin: `rm -rf .next/cache/images`
- iyzico'ya giden dış ağ erişimi olmadığı için **uçtan uca sandbox ödemesi henüz
  test edilmedi.** Sandbox anahtarları girildikten sonra ilk gerçek ödemenin
  denenmesi gerekiyor.

## Yapılacaklar (canlıya çıkmadan önce)

- [ ] 5 modelin gerçek isim, fiyat, renk ve beden bilgileri
- [ ] Ürün fotoğrafları (model başına en az 3 kare, 4:5 oranında)
- [ ] iyzico canlı API anahtarları
- [ ] Yasal metinlerin doldurulması: ticari unvan, adres, vergi no, ETBİS no
- [ ] Kargo firması, kargo ücreti ve ücretsiz kargo eşiği
- [ ] Alan adının Vercel'e bağlanması
