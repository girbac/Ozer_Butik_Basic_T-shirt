/** Beden sırası. Veritabanından gelen varyantlar bu sıraya göre dizilir. */
export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export function sortSizes<T extends { size: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      SIZE_ORDER.indexOf(a.size as (typeof SIZE_ORDER)[number]) -
      SIZE_ORDER.indexOf(b.size as (typeof SIZE_ORDER)[number]),
  );
}

/** Beden tablosu — cm cinsinden, düz serilmiş ölçüler. */
export const SIZE_CHART = {
  columns: ["Beden", "Göğüs (cm)", "Boy (cm)", "Omuz (cm)", "Kol (cm)"],
  rows: [
    ["S", "48", "68", "42", "19"],
    ["M", "51", "70", "44", "20"],
    ["L", "54", "72", "46", "21"],
    ["XL", "57", "74", "48", "22"],
    ["XXL", "60", "76", "50", "23"],
  ],
} as const;

export const SIZE_GUIDE_TIPS = [
  "Ölçüler ürün düz serildiğinde alınmıştır; göğüs ölçüsü koltuk altı hizasından tek taraftır.",
  "İki beden arasında kaldıysanız: Regular ve V Yaka için büyük bedeni, Slim Fit için de büyük bedeni seçin.",
  "Oversize modelde normal bedeninizi seçin — kalıp zaten bol keser, küçültmenize gerek yok.",
  "Elinizdeki en sevdiğiniz tişörtü düz serip ölçün, tablodaki en yakın satırı seçin. En güvenilir yöntem budur.",
];
