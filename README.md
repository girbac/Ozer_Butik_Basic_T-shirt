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

## Önemli notlar

- **Para birimi her yerde kuruş cinsinden `Int`'tir** (49900 = 499,00 TL). Ondalık
  sayı kullanılmaz. Görüntüleme için `lib/format.ts` içindeki `formatPrice`.
- **Sepetteki fiyata güvenilmez.** Sepet tarayıcıda tutulur; ödeme sırasında fiyat
  ve stok sunucuda veritabanından yeniden hesaplanır.
- **Ürün görselleri şu an yer tutucudur** (`public/urunler/`). Gerçek fotoğraflar
  admin panelinden yüklenecek.
- Ürün adları, fiyatlar ve renkler de yer tutucudur; `prisma/seed.ts` içinde.

## Yapılacaklar (canlıya çıkmadan önce)

- [ ] 5 modelin gerçek isim, fiyat, renk ve beden bilgileri
- [ ] Ürün fotoğrafları (model başına en az 3 kare, 4:5 oranında)
- [ ] iyzico canlı API anahtarları
- [ ] Yasal metinlerin doldurulması: ticari unvan, adres, vergi no, ETBİS no
- [ ] Kargo firması, kargo ücreti ve ücretsiz kargo eşiği
- [ ] Alan adının Vercel'e bağlanması
